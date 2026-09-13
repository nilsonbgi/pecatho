-- Fix Fans checkout settlement idempotency for refunds and chargebacks.
-- The function is already deployed in Supabase; this migration keeps the
-- correction reproducible in the repository migration history.

do $$
declare
  v_oid oid;
  v_definition text;
begin
  select p.oid
    into v_oid
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'settle_fans_checkout'
    and pg_get_function_identity_arguments(p.oid) like 'uuid, text, text, public.payment_status, text, numeric';

  if v_oid is null then
    raise exception 'Function public.settle_fans_checkout was not found';
  end if;

  v_definition := pg_get_functiondef(v_oid);

  v_definition := replace(
    v_definition,
    $$if v_payment.status='paid' then return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id); end if;$$,
    $$if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then
     return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id);
   end if;$$
  );

  v_definition := replace(
    v_definition,
    $$if p_payment_status in ('refunded','chargeback') then
   update public.payments$$,
    $$if p_payment_status in ('refunded','chargeback') then
   if v_payment.status in ('refunded','chargeback') then
     select * into v_previous_purchase
       from public.fans_purchases
      where provider=p_provider
        and provider_reference=p_provider_payment_id
      order by created_at desc
      limit 1;

     return jsonb_build_object(
       'ok',true,
       'idempotent',true,
       'status',v_payment.status,
       'order_id',p_order_id,
       'refunded_purchase_id',v_previous_purchase.id
     );
   end if;

   update public.payments$$
  );

  v_definition := replace(
    v_definition,
    $$where provider=p_provider and provider_reference=p_provider_payment_id and status='paid' order by created_at desc limit 1 for update;$$,
    $$where provider=p_provider and provider_reference=p_provider_payment_id order by created_at desc limit 1 for update;$$
  );

  execute v_definition;
end;
$$;
