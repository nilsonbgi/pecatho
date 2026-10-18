-- Permit only the explicitly supported refund -> chargeback escalation.
-- Refund and chargeback remain terminal for all other status changes.
CREATE OR REPLACE FUNCTION private.guard_payment_terminal_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'pg_catalog', 'public', 'private'
AS $function$
BEGIN
  IF OLD.status = 'chargeback' AND NEW.status <> 'chargeback' THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_STATE_TRANSITION';
  END IF;

  IF OLD.status = 'refunded'
     AND NEW.status NOT IN ('refunded', 'chargeback')
  THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_STATE_TRANSITION';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_payment_terminal_state()
  FROM PUBLIC, anon, authenticated;

DO $verification$
DECLARE
  v_definition text;
  v_enabled boolean;
BEGIN
  SELECT pg_get_functiondef('private.guard_payment_terminal_state()'::regprocedure)
    INTO v_definition;

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

  IF position('NEW.status NOT IN (''refunded'', ''chargeback'')' in v_definition) = 0
     OR position('OLD.status = ''chargeback''' in v_definition) = 0
  THEN
    RAISE EXCEPTION 'Refund/chargeback transition guard verification failed';
  END IF;
END
$verification$;
