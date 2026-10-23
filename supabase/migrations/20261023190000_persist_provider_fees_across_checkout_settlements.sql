-- Ensure checkout settlement RPCs persist the payment-provider fee supplied by the verified webhook.
-- This changes function definitions only; no payment, order, seller balance, or ledger row is rewritten.
DO $migration$
DECLARE
  v_name text;
  v_oid oid;
  v_definition text;
  v_search text := 'payment_method=p_payment_method,paid_at=';
  v_replacement text := 'payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,0),2),paid_at=';
  v_count integer;
  v_expected text[] := ARRAY[
    'settle_digital_content_checkout',
    'settle_fans_boost_checkout',
    'settle_fans_checkout',
    'settle_fans_live_extension_checkout',
    'settle_profile_media_checkout'
  ];
BEGIN
  FOREACH v_name IN ARRAY v_expected LOOP
    SELECT p.oid INTO v_oid
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname=v_name
       AND p.prokind='f'
       AND pg_get_function_arguments(p.oid) LIKE '%p_provider_fee numeric%';

    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'Expected settlement function missing or signature changed: %', v_name;
    END IF;

    v_definition := pg_get_functiondef(v_oid);
    v_count := (length(v_definition) - length(replace(v_definition, v_search, ''))) / length(v_search);

    IF v_count <> 1 THEN
      RAISE EXCEPTION 'Expected exactly one paid-settlement fee insertion point in %, found %', v_name, v_count;
    END IF;

    v_definition := replace(v_definition, v_search, v_replacement);
    EXECUTE v_definition;
  END LOOP;
END;
$migration$;
