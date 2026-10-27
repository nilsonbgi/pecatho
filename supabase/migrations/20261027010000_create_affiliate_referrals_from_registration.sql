-- Ensure the referral captured during signup becomes a commission-eligible referral.
-- The registration metadata trigger runs BEFORE auth.users INSERT; this trigger runs
-- after the corresponding profile is created, when the registration intent is available.
CREATE OR REPLACE FUNCTION private.create_pecatho_affiliate_referral_from_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_creator_id uuid;
  v_affiliate_user_id uuid;
BEGIN
  SELECT ri.referral_creator_id, ri.referral_affiliate_user_id
    INTO v_creator_id, v_affiliate_user_id
  FROM public.registration_intents ri
  WHERE ri.user_id = NEW.id
  ORDER BY ri.created_at DESC
  LIMIT 1;

  IF v_affiliate_user_id IS NULL AND v_creator_id IS NOT NULL THEN
    SELECT c.user_id
      INTO v_affiliate_user_id
    FROM public.fans_creators c
    WHERE c.id = v_creator_id
      AND c.status = 'active';
  END IF;

  -- Ignore missing, inactive, or self-referrals without blocking signup.
  IF v_affiliate_user_id IS NULL OR v_affiliate_user_id = NEW.id THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.affiliates a
    WHERE a.user_id = v_affiliate_user_id
      AND a.active = true
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.pecatho_affiliate_referrals (
    creator_id,
    affiliate_user_id,
    referred_user_id,
    attribution_source
  )
  VALUES (
    v_creator_id,
    v_affiliate_user_id,
    NEW.id,
    CASE
      WHEN v_creator_id IS NOT NULL THEN 'fans_creator_profile'
      ELSE 'profile_referral_link'
    END
  )
  ON CONFLICT (referred_user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.create_pecatho_affiliate_referral_from_registration() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profiles_create_pecatho_affiliate_referral ON public.profiles;
CREATE TRIGGER trg_profiles_create_pecatho_affiliate_referral
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION private.create_pecatho_affiliate_referral_from_registration();

-- Repair referrals missed by the previous implementation only when the signup intent
-- explicitly captured an affiliate code. Do not rewrite existing referrals or ledger entries.
INSERT INTO public.pecatho_affiliate_referrals (
  creator_id,
  affiliate_user_id,
  referred_user_id,
  attribution_source
)
SELECT
  ri.referral_creator_id,
  ri.referral_affiliate_user_id,
  ri.user_id,
  'profile_referral_link'
FROM public.registration_intents ri
JOIN public.profiles p ON p.id = ri.user_id
WHERE ri.referral_affiliate_user_id IS NOT NULL
  AND ri.referral_affiliate_user_id IS DISTINCT FROM ri.user_id
  AND EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.user_id = ri.referral_affiliate_user_id
      AND a.active = true
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.pecatho_affiliate_referrals r
    WHERE r.referred_user_id = ri.user_id
  )
ON CONFLICT (referred_user_id) DO NOTHING;
