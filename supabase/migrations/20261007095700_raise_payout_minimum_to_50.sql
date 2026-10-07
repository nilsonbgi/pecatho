DO $migration$
DECLARE
  v_definition text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
    INTO v_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'private'
    AND p.proname = 'request_fans_payout'
    AND pg_get_function_identity_arguments(p.oid) = 'uuid, numeric, text';

  IF v_definition IS NULL THEN
    RAISE EXCEPTION 'private.request_fans_payout(uuid,numeric,text) não encontrada';
  END IF;

  v_definition := replace(
    v_definition,
    'v_minimum numeric:=20.00',
    'v_minimum numeric:=50.00'
  );

  EXECUTE v_definition;

  SELECT pg_get_functiondef(p.oid)
    INTO v_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'private'
    AND p.proname = 'request_seller_payout'
    AND pg_get_function_identity_arguments(p.oid) = 'numeric, text';

  IF v_definition IS NULL THEN
    RAISE EXCEPTION 'private.request_seller_payout(numeric,text) não encontrada';
  END IF;

  v_definition := replace(
    v_definition,
    'if p_amount < 20 then raise exception ''O valor mínimo para recebimento é R$ 20,00''; end if;',
    'if p_amount < 50 then raise exception ''O valor mínimo para recebimento é R$ 50,00''; end if;'
  );

  EXECUTE v_definition;
END
$migration$;