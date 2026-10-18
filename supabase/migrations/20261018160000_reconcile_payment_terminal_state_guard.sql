-- Reconcile the live payment terminal-state guard into a forward migration.
-- This intentionally reasserts the current production definition instead of
-- rewriting historical migration versions or guessing at missing historical SQL.

CREATE OR REPLACE FUNCTION private.guard_payment_terminal_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'pg_catalog', 'public', 'private'
AS $function$
BEGIN
  IF OLD.status IN ('refunded', 'chargeback')
     AND NEW.status <> OLD.status
  THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_STATE_TRANSITION';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_payment_terminal_state()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS payments_guard_terminal_state ON public.payments;

CREATE TRIGGER payments_guard_terminal_state
BEFORE UPDATE OF status ON public.payments
FOR EACH ROW
EXECUTE FUNCTION private.guard_payment_terminal_state();

DO $verification$
DECLARE
  v_enabled boolean;
BEGIN
  SELECT t.tgenabled = 'O'
    INTO v_enabled
    FROM pg_trigger t
   WHERE t.tgrelid = 'public.payments'::regclass
     AND t.tgname = 'payments_guard_terminal_state'
     AND NOT t.tgisinternal;

  IF v_enabled IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Payment terminal-state guard trigger is missing or disabled';
  END IF;

  IF has_function_privilege('anon', 'private.guard_payment_terminal_state()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'private.guard_payment_terminal_state()', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'Payment trigger function is directly executable by API roles';
  END IF;
END
$verification$;
