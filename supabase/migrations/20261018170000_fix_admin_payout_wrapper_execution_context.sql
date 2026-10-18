-- Preserve the public staff RPC while keeping its privileged implementation private.
-- The wrapper must execute with its owner privileges because authenticated callers
-- are intentionally denied direct EXECUTE on private.admin_fans_payout_action.
CREATE OR REPLACE FUNCTION public.admin_fans_payout_action(
  p_payout_id uuid,
  p_action text,
  p_provider text DEFAULT NULL::text,
  p_provider_reference text DEFAULT NULL::text,
  p_reason text DEFAULT NULL::text
)
RETURNS public.fans_payout_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR (SELECT private.is_staff()) IS NOT TRUE THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  RETURN private.admin_fans_payout_action(
    p_payout_id,
    p_action,
    p_provider,
    p_provider_reference,
    p_reason
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_fans_payout_action(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_fans_payout_action(uuid, text, text, text, text) TO authenticated;

DO $validation$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'admin_fans_payout_action'
      AND pg_get_function_identity_arguments(p.oid) =
        'p_payout_id uuid, p_action text, p_provider text, p_provider_reference text, p_reason text'
      AND p.prosecdef
      AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'PUBLIC_PAYOUT_WRAPPER_SECURITY_VALIDATION_FAILED';
  END IF;
  IF has_function_privilege('authenticated', 'private.admin_fans_payout_action(uuid,text,text,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'PRIVATE_PAYOUT_FUNCTION_STILL_EXPOSED';
  END IF;
END;
$validation$;