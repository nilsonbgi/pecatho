-- Allow mixed-role accounts to purchase the customer Premium product.
-- Keep the customer plan audience validation and all payment/settlement guards intact.
DO $migration$
DECLARE
  v_definition text;
  v_old text := 'account_type=''customer''';
  v_new text := 'account_type in (''customer'', ''both'')';
BEGIN
  SELECT pg_get_functiondef('public.create_pecatho_customer_premium_checkout(uuid,uuid,integer)'::regprocedure)
    INTO v_definition;

  IF v_definition IS NULL THEN
    RAISE EXCEPTION 'FUNCTION_NOT_FOUND: create_pecatho_customer_premium_checkout(uuid,uuid,integer)';
  END IF;

  IF position(v_new in v_definition) > 0 THEN
    RAISE NOTICE 'Customer Premium checkout already accepts customer and both account types.';
    RETURN;
  END IF;

  IF position(v_old in v_definition) = 0 THEN
    RAISE EXCEPTION 'EXPECTED_GUARD_NOT_FOUND: refusing to modify an unexpected function definition';
  END IF;

  v_definition := replace(v_definition, v_old, v_new);
  EXECUTE v_definition;
END;
$migration$;
