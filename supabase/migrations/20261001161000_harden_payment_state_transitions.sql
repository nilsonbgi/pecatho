do $migration$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='settle_digital_content_checkout'
     and pg_get_function_identity_arguments(p.oid)='p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status, p_payment_method text, p_provider_fee numeric';
  v_def := replace(v_def, '  if p_payment_status=''paid'' then',
    $$  if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then
    raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
  end if;
  if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then
    return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id);
  end if;
  if p_payment_status='paid' then$$);
  execute v_def;

  select pg_get_functiondef(p.oid) into v_def from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='settle_profile_media_checkout'
     and pg_get_function_identity_arguments(p.oid)='p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status, p_payment_method text, p_provider_fee numeric';
  v_def := replace(v_def, ' if p_payment_status=''paid'' then',
    $$ if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then
   raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
 end if;
 if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then
   return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,'purchase_id',v_purchase.id);
 end if;
 if p_payment_status='paid' then$$);
  execute v_def;

  select pg_get_functiondef(p.oid) into v_def from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='settle_pecatho_gift_checkout'
     and pg_get_function_identity_arguments(p.oid)='p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status, p_payment_method text, p_provider_fee numeric';
  v_def := replace(v_def, $$  if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then$$,
    $$  if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then
    raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
  end if;
  if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then$$);
  execute v_def;

  select pg_get_functiondef(p.oid) into v_def from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='settle_fans_live_extension_checkout'
     and pg_get_function_identity_arguments(p.oid)='p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status, p_payment_method text, p_provider_fee numeric';
  v_def := replace(v_def, $$if v_payment.status='paid' and p_payment_status not in('refunded','chargeback') then$$,
    $$if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then
 raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
end if;
if v_payment.status='paid' and p_payment_status not in('refunded','chargeback') then$$);
  execute v_def;

  select pg_get_functiondef(p.oid) into v_def from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='settle_fans_checkout'
     and pg_get_function_identity_arguments(p.oid)='p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status, p_payment_method text, p_provider_fee numeric';
  v_def := replace(v_def, $$  if v_payment.status = 'paid'
     and p_payment_status not in ('refunded','chargeback') then$$,
    $$  if v_payment.status in ('refunded','chargeback')
     and p_payment_status not in ('refunded','chargeback') then
    raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
  end if;
  if v_payment.status = 'paid'
     and p_payment_status not in ('refunded','chargeback') then$$);
  execute v_def;
end
$migration$;
