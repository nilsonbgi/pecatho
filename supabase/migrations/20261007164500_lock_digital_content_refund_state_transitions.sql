DO $mig$
DECLARE v_sql text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_sql
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='settle_digital_content_checkout'
    AND pg_get_function_identity_arguments(p.oid)='p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status, p_payment_method text, p_provider_fee numeric';
  IF v_sql IS NULL THEN RAISE EXCEPTION 'settle_digital_content_checkout not found'; END IF;
  v_sql := replace(v_sql,
    $old$  if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then
    raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
  end if;$old$,
    $new$  if v_payment.status in ('refunded','chargeback') then
    if p_payment_status <> v_payment.status then
      raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
    end if;
  end if;$new$);
  IF v_sql = pg_get_functiondef((SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='settle_digital_content_checkout')) THEN
    RAISE EXCEPTION 'Expected payment-state guard was not found';
  END IF;
  EXECUTE v_sql;
END $mig$;