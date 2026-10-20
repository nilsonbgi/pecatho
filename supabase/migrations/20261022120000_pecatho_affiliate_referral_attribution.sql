-- Affiliate attribution: capture the referring Fans creator during registration.
-- No existing customer or financial data is changed by this migration.

ALTER TABLE public.registration_intents
  ADD COLUMN IF NOT EXISTS referral_creator_id uuid
  REFERENCES public.fans_creators(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.pecatho_affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.fans_creators(id) ON DELETE RESTRICT,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attribution_source text NOT NULL DEFAULT 'fans_creator_profile',
  status text NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered','qualified','reversed')),
  registered_at timestamptz NOT NULL DEFAULT now(),
  first_paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pecatho_affiliate_referrals_one_creator_per_user UNIQUE (referred_user_id)
);

CREATE INDEX IF NOT EXISTS pecatho_affiliate_referrals_creator_status_idx
  ON public.pecatho_affiliate_referrals (creator_id, status, registered_at DESC);

ALTER TABLE public.pecatho_affiliate_referrals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pecatho_affiliate_referrals FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.capture_registration_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_entry_mode text := CASE
    WHEN m->>'entry_mode' IN ('customer','advertiser','fans','both') THEN m->>'entry_mode'
    ELSE 'customer'
  END;
  v_creator_id uuid := null;
BEGIN
  IF m ? 'referral_creator_id' THEN
    BEGIN
      v_creator_id := nullif(m->>'referral_creator_id','')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      v_creator_id := null;
    END;
    IF v_creator_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.fans_creators c
      WHERE c.id = v_creator_id
        AND c.status = 'active'
        AND c.user_id IS DISTINCT FROM new.id
    ) THEN
      v_creator_id := null;
    END IF;
  END IF;

  IF m ? 'cpf' AND m ? 'birth_date' THEN
    INSERT INTO public.registration_intents AS ri (
      user_id, token_hash, email, display_name, cpf, birth_date, phone,
      zipcode, street, number, complement, neighborhood, city, uf, ibge_code,
      entry_mode, referral_creator_id
    ) VALUES (
      new.id,
      encode(extensions.digest(new.id::text || ':' || coalesce(new.email,''), 'sha256'), 'hex'),
      coalesce(new.email,''),
      coalesce(m->>'display_name',''), coalesce(m->>'cpf',''), (m->>'birth_date')::date,
      coalesce(m->>'phone',''), coalesce(m->>'cep',''), coalesce(m->>'street',''),
      coalesce(m->>'number',''), nullif(m->>'complement',''), coalesce(m->>'neighborhood',''),
      coalesce(m->>'city',''), coalesce(m->>'uf',''), coalesce(m->>'ibge_code',''),
      v_entry_mode, v_creator_id
    )
    ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE SET
      email=excluded.email, display_name=excluded.display_name, cpf=excluded.cpf,
      birth_date=excluded.birth_date, phone=excluded.phone, zipcode=excluded.zipcode,
      street=excluded.street, number=excluded.number, complement=excluded.complement,
      neighborhood=excluded.neighborhood, city=excluded.city, uf=excluded.uf,
      ibge_code=excluded.ibge_code, entry_mode=excluded.entry_mode,
      referral_creator_id=coalesce(ri.referral_creator_id, excluded.referral_creator_id),
      expires_at=now()+interval '30 minutes', consumed_at=null;
    new.raw_user_meta_data := jsonb_build_object('registration_pending', true);
  END IF;
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_pecatho_affiliate_referral(p_creator_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_creator_user_id uuid;
  v_referral_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_creator_id IS NULL THEN RAISE EXCEPTION 'AFFILIATE_CREATOR_REQUIRED'; END IF;

  SELECT user_id INTO v_creator_user_id
  FROM public.fans_creators
  WHERE id = p_creator_id AND status = 'active';

  IF NOT FOUND OR v_creator_user_id IS NULL THEN
    RAISE EXCEPTION 'AFFILIATE_CREATOR_UNAVAILABLE';
  END IF;
  IF v_creator_user_id = v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'SELF_REFERRAL');
  END IF;

  INSERT INTO public.pecatho_affiliate_referrals
    (creator_id, referred_user_id, attribution_source)
  VALUES (p_creator_id, v_user_id, 'fans_creator_profile')
  ON CONFLICT (referred_user_id) DO NOTHING
  RETURNING id INTO v_referral_id;

  IF v_referral_id IS NULL THEN
    SELECT id INTO v_referral_id
    FROM public.pecatho_affiliate_referrals
    WHERE referred_user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'referral_id', v_referral_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.record_pecatho_affiliate_referral(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_pecatho_affiliate_referral(uuid) TO authenticated;
