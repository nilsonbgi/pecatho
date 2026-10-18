-- Private payout administration must not be callable directly by API roles.
-- The public API wrapper remains the only intended client entry point and performs
-- its own authorization checks before invoking the private implementation.
REVOKE ALL ON FUNCTION private.admin_fans_payout_action(uuid, text, text, text, text)
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION private.payout_balance_before_settlement(uuid, uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION private.guard_unique_payout_provider_reference()
  FROM PUBLIC, anon, authenticated;

DO $verification$
BEGIN
  IF has_function_privilege('anon', 'private.admin_fans_payout_action(uuid,text,text,text,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'private.admin_fans_payout_action(uuid,text,text,text,text)', 'EXECUTE')
     OR has_function_privilege('anon', 'private.payout_balance_before_settlement(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'private.payout_balance_before_settlement(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'private.guard_unique_payout_provider_reference()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'private.guard_unique_payout_provider_reference()', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'Privileged private payout functions remain executable by API roles';
  END IF;
END
$verification$;
