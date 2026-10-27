-- Generaliza el programa de indicação existente para qualquer perfil Pecatho.
-- Preserva o histórico de indicações Fans e o razão financeiro já existente.

ALTER TABLE public.pecatho_affiliate_referrals
  ALTER COLUMN creator_id DROP NOT NULL;

ALTER TABLE public.pecatho_affiliate_referrals
  ADD COLUMN IF NOT EXISTS affiliate_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.registration_intents
  ADD COLUMN IF NOT EXISTS referral_affiliate_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pecatho_affiliate_referrals_affiliate_status_idx
  ON public.pecatho_affiliate_referrals (affiliate_user_id, status, registered_at DESC);

-- Um código único por conta, reaproveitando public.affiliates (sem criar programa paralelo).
INSERT INTO public.affiliates (user_id, code, active, metadata)
SELECT p.id, 'P' || upper(substr(replace(p.id::text, '-', ''), 1, 12)), true,
       jsonb_build_object('source', 'pecatho_profile_referral', 'created_by_migration', true)
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = p.id)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION private.ensure_pecatho_affiliate_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.affiliates (user_id, code, active, metadata)
  VALUES (NEW.id, 'P' || upper(substr(replace(NEW.id::text, '-', ''), 1, 12)), true,
          jsonb_build_object('source', 'pecatho_profile_referral'))
  ON CONFLICT (code) DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_profiles_ensure_pecatho_affiliate_code ON public.profiles;
CREATE TRIGGER trg_profiles_ensure_pecatho_affiliate_code
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.ensure_pecatho_affiliate_code();

-- Persiste o indicador genérico no registro sem sobrescrever atribuição anterior.
DO $migration$
DECLARE
  v_definition text;
  v_original text;
BEGIN
  SELECT pg_get_functiondef('private.capture_registration_metadata()'::regprocedure)
    INTO v_definition;
  v_definition := replace(v_definition, E'\r\n', E'\n');

  v_original := v_definition;
  v_definition := replace(v_definition,
    'v_creator_id uuid := null;',
    'v_creator_id uuid := null; v_affiliate_user_id uuid := null;');

  v_definition := replace(v_definition,
    '  IF m ? ''cpf'' AND m ? ''birth_date'' THEN',
    $replace$
  IF nullif(btrim(m->>'referral_code'), '') IS NOT NULL THEN
    SELECT a.user_id INTO v_affiliate_user_id
    FROM public.affiliates a
    WHERE upper(a.code) = upper(btrim(m->>'referral_code'))
      AND a.active = true
      AND a.user_id IS NOT NULL
      AND a.user_id IS DISTINCT FROM new.id
    LIMIT 1;
  END IF;

  IF m ? 'cpf' AND m ? 'birth_date' THEN
$replace$);

  v_definition := replace(v_definition,
    'entry_mode, referral_creator_id',
    'entry_mode, referral_creator_id, referral_affiliate_user_id');

  v_definition := replace(v_definition,
    'v_entry_mode, v_creator_id',
    'v_entry_mode, v_creator_id, v_affiliate_user_id');

  v_definition := replace(v_definition,
    'referral_creator_id=coalesce(ri.referral_creator_id, excluded.referral_creator_id),',
    'referral_creator_id=coalesce(ri.referral_creator_id, excluded.referral_creator_id), referral_affiliate_user_id=coalesce(ri.referral_affiliate_user_id, excluded.referral_affiliate_user_id),');

  IF v_definition = v_original
     OR position('referral_affiliate_user_id' in v_definition) = 0
     OR position('v_affiliate_user_id' in v_definition) = 0 THEN
    RAISE EXCEPTION 'Não foi possível adaptar private.capture_registration_metadata com segurança; migration cancelada.';
  END IF;

  EXECUTE v_definition;
END;
$migration$;

-- Registra a indicação pelo usuário indicador, mantendo compatibilidade com o fluxo antigo.
CREATE OR REPLACE FUNCTION public.record_pecatho_affiliate_referral_by_user(p_affiliate_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_referral_id uuid;
  v_creator_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_affiliate_user_id IS NULL THEN RAISE EXCEPTION 'AFFILIATE_REQUIRED'; END IF;
  IF p_affiliate_user_id = v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'SELF_REFERRAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = p_affiliate_user_id AND a.active) THEN
    RAISE EXCEPTION 'AFFILIATE_UNAVAILABLE';
  END IF;

  SELECT c.id INTO v_creator_id
  FROM public.fans_creators c
  WHERE c.user_id = p_affiliate_user_id AND c.status = 'active'
  LIMIT 1;

  INSERT INTO public.pecatho_affiliate_referrals
    (creator_id, affiliate_user_id, referred_user_id, attribution_source)
  VALUES (v_creator_id, p_affiliate_user_id, v_user_id, 'profile_referral_link')
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

REVOKE ALL ON FUNCTION public.record_pecatho_affiliate_referral_by_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_pecatho_affiliate_referral_by_user(uuid) TO authenticated;

-- Mantém integralmente o cálculo de estornos/idempotência existente e amplia apenas
-- a atribuição genérica e o tipo de assinatura profissional.
DO $commission$
DECLARE
  v_definition text;
  v_original text;
BEGIN
  SELECT pg_get_functiondef('public.post_pecatho_affiliate_commission()'::regprocedure)
    INTO v_definition;
  v_definition := replace(v_definition, E'\r\n', E'\n');
  v_original := v_definition;

  v_definition := replace(v_definition,
    'SELECT c.user_id INTO v_creator_user_id FROM public.fans_creators c
   WHERE c.id=v_referral.creator_id AND c.status=''active'';',
    'SELECT coalesce(v_referral.affiliate_user_id, (SELECT c.user_id FROM public.fans_creators c WHERE c.id=v_referral.creator_id AND c.status=''active'')) INTO v_creator_user_id;');

  v_definition := replace(v_definition,
    'IF v_order.metadata->>''product_type''=''premium_subscription'' THEN',
    'IF v_order.metadata->>''product_type'' IN (''premium_subscription'',''professional_premium_subscription'') THEN');

  IF v_definition = v_original OR position('professional_premium_subscription' in v_definition) = 0 OR position('coalesce(v_referral.affiliate_user_id' in v_definition) = 0 THEN
    RAISE EXCEPTION 'Não foi possível adaptar post_pecatho_affiliate_commission com segurança; migration cancelada.';
  END IF;

  EXECUTE v_definition;
END;
$commission$;
