-- One customer Premium product with configurable billing terms.
-- Provisional development discounts: quarterly 10%, semiannual 15%, annual 20%.
alter table public.pecatho_customer_premium_plans add column if not exists billing_options jsonb not null default '{"90":{"discount_percent":10},"180":{"discount_percent":15},"365":{"discount_percent":20}}'::jsonb;

update public.pecatho_customer_premium_plans set billing_options='{"90":{"discount_percent":10},"180":{"discount_percent":15},"365":{"discount_percent":20}}'::jsonb,updated_at=now()
where audience='customer' and duration_days=30 and (billing_options='{}'::jsonb or billing_options is null);

update public.pecatho_customer_premium_plans set active=false,updated_at=now()
where audience='customer' and duration_days in (90,180,365) and plan_key<>'premium-nivel1';

create or replace function public.admin_save_pecatho_customer_premium_plan(
 p_plan_id uuid,p_plan_key text,p_name text,p_description text,p_price numeric,p_duration_days integer,
 p_discount_percent numeric,p_benefits jsonb,p_active boolean,p_audience text,p_feature_flags jsonb,
 p_card_style text,p_badge_label text,p_sort_order integer,p_billing_options jsonb
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $function$
declare v_user uuid:=auth.uid(); v_result jsonb; v_options jsonb:=coalesce(p_billing_options,'{}'::jsonb);
 v_quarter numeric; v_semi numeric; v_annual numeric;
begin
 if v_user is null or not exists(select 1 from public.user_roles where user_id=v_user and role in ('super_admin','admin')) then raise exception 'ADMIN_REQUIRED'; end if;
 if p_audience='customer' then
  if p_duration_days<>30 or coalesce(p_discount_percent,0)<>0 then raise exception 'CUSTOMER_PREMIUM_SINGLE_PRODUCT_MONTHLY_BASE_REQUIRED'; end if;
  if jsonb_typeof(v_options)<>'object' or not(v_options?'90' and v_options?'180' and v_options?'365') then raise exception 'CUSTOMER_PREMIUM_BILLING_OPTIONS_REQUIRED'; end if;
  v_quarter:=nullif(v_options->'90'->>'discount_percent','')::numeric;
  v_semi:=nullif(v_options->'180'->>'discount_percent','')::numeric;
  v_annual:=nullif(v_options->'365'->>'discount_percent','')::numeric;
  if v_quarter is null or v_semi is null or v_annual is null or v_quarter<0 or v_quarter>80 or v_semi<0 or v_semi>80 or v_annual<0 or v_annual>80 or v_quarter>=v_semi or v_semi>=v_annual then raise exception 'CUSTOMER_PREMIUM_DISCOUNTS_MUST_INCREASE'; end if;
 else v_options:='{}'::jsonb; end if;
 v_result:=public.admin_save_pecatho_customer_premium_plan(p_plan_id,p_plan_key,p_name,p_description,p_price,p_duration_days,case when p_audience='customer' then 0 else coalesce(p_discount_percent,0) end,p_benefits,p_active,p_audience,p_feature_flags,p_card_style,p_badge_label,p_sort_order);
 update public.pecatho_customer_premium_plans set billing_options=v_options,updated_at=now() where id=(v_result->>'id')::uuid;
 return v_result||jsonb_build_object('billing_options',v_options);
end;$function$;
revoke all on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,numeric,jsonb,boolean,text,jsonb,text,text,integer,jsonb) from public,anon;
grant execute on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,numeric,jsonb,boolean,text,jsonb,text,text,integer,jsonb) to authenticated;

drop function if exists public.create_pecatho_customer_premium_checkout(uuid,uuid);
create or replace function public.create_pecatho_customer_premium_checkout(p_plan_id uuid,p_creator_id uuid default null,p_duration_days integer default 30)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $function$
declare v_user uuid:=auth.uid(); v_plan public.pecatho_customer_premium_plans%rowtype; v_creator public.fans_creators%rowtype;
 v_discount numeric:=0; v_gross numeric(12,2); v_amount numeric(12,2); v_order uuid; v_order_number text; v_subscription uuid;
begin
 if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
 if not exists(select 1 from public.profiles where id=v_user and account_type='customer') then raise exception 'CUSTOMER_ACCOUNT_REQUIRED'; end if;
 if p_duration_days not in (30,90,180,365) then raise exception 'PREMIUM_DURATION_INVALID'; end if;
 select * into v_plan from public.pecatho_customer_premium_plans where id=p_plan_id and active=true and audience='customer' and duration_days=30 for share;
 if not found then raise exception 'PREMIUM_PLAN_UNAVAILABLE'; end if;
 if p_duration_days>30 then
  if not(v_plan.billing_options?p_duration_days::text) then raise exception 'PREMIUM_BILLING_TERM_NOT_CONFIGURED'; end if;
  v_discount:=nullif(v_plan.billing_options->p_duration_days::text->>'discount_percent','')::numeric;
  if v_discount is null or v_discount<=0 or v_discount>80 then raise exception 'PREMIUM_BILLING_TERM_NOT_CONFIGURED'; end if;
 end if;
 v_gross:=round(v_plan.price*(p_duration_days::numeric/30),2); v_amount:=round(v_gross*(1-v_discount/100),2);
 if v_amount<=0 then raise exception 'PREMIUM_PRICE_INVALID'; end if;
 if p_creator_id is not null then select * into v_creator from public.fans_creators where id=p_creator_id and status='active' and user_id<>v_user; if not found then raise exception 'PREMIUM_ATTRIBUTION_CREATOR_INVALID'; end if; end if;
 v_order_number:='PEC-PREM-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
 insert into public.orders(order_number,user_id,status,subtotal,discount,fee,total,currency,metadata)
 values(v_order_number,v_user,'awaiting_payment',v_gross,v_gross-v_amount,0,v_amount,'BRL',jsonb_build_object(
  'source','pecatho','kind','customer_premium','product_type','premium_subscription','product_id',v_plan.id,
  'plan_key',v_plan.plan_key,'title',v_plan.name,'duration_days',p_duration_days,'discount_percent',v_discount,
  'monthly_base_price',v_plan.price,'gross_amount',v_gross,'final_amount',v_amount,
  'attribution_source',case when p_creator_id is not null then 'creator_profile' else null end,'attributed_creator_id',p_creator_id))
 returning id into v_order;
 insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference) values(v_order,v_user,'pending',v_amount,'BRL','pending','pending','{}'::jsonb);
 insert into public.pecatho_customer_premium_subscriptions(user_id,plan_id,order_id,paid_amount,currency,status,attributed_creator_id,duration_days)
 values(v_user,v_plan.id,v_order,v_amount,'BRL','pending',p_creator_id,p_duration_days) returning id into v_subscription;
 return jsonb_build_object('subscription_id',v_subscription,'order_id',v_order,'order_number',v_order_number,'plan_id',v_plan.id,'amount',v_amount,'currency','BRL','status','pending','duration_days',p_duration_days,'discount_percent',v_discount,'attributed_creator_id',p_creator_id);
end;$function$;
revoke all on function public.create_pecatho_customer_premium_checkout(uuid,uuid,integer) from public,anon;
grant execute on function public.create_pecatho_customer_premium_checkout(uuid,uuid,integer) to authenticated,service_role;

create or replace function public.settle_pecatho_customer_premium_checkout(
 p_order_id uuid,p_provider text,p_provider_payment_id text,p_payment_status payment_status,p_payment_method text default null,p_provider_fee numeric default 0
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $function$
declare v_order public.orders%rowtype; v_payment public.payments%rowtype; v_subscription public.pecatho_customer_premium_subscriptions%rowtype;
 v_start timestamptz; v_end timestamptz; v_duration integer;
begin
 if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null then raise exception 'INVALID_PREMIUM_SETTLEMENT_REQUEST'; end if;
 if coalesce(p_provider_fee,0)<0 then raise exception 'INVALID_PROVIDER_FEE'; end if;
 select * into v_order from public.orders where id=p_order_id for update;
 if not found or v_order.metadata->>'product_type'<>'premium_subscription' then raise exception 'PREMIUM_ORDER_NOT_FOUND'; end if;
 select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
 if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
 select * into v_subscription from public.pecatho_customer_premium_subscriptions where order_id=p_order_id for update;
 if not found then raise exception 'PREMIUM_SUBSCRIPTION_NOT_FOUND'; end if;
 v_duration:=coalesce(nullif(v_order.metadata->>'duration_days','')::integer,v_subscription.duration_days,30);
 if v_duration not in(30,90,180,365) then raise exception 'PREMIUM_DURATION_INVALID'; end if;
 if v_payment.status in('refunded','chargeback') and p_payment_status not in('refunded','chargeback') then raise exception 'INVALID_PAYMENT_STATE_TRANSITION'; end if;
 if v_payment.status='paid' and p_payment_status not in('refunded','chargeback') then return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,'subscription_id',v_subscription.id,'ends_at',v_subscription.ends_at); end if;
 if p_payment_status='paid' then
  select greatest(now(),coalesce(max(ends_at),now())) into v_start from public.pecatho_customer_premium_subscriptions where user_id=v_subscription.user_id and status='active' and ends_at>now();
  v_end:=v_start+make_interval(days=>v_duration);
  update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
  update public.orders set status='paid',updated_at=now() where id=v_order.id;
  update public.pecatho_customer_premium_subscriptions set status='active',starts_at=v_start,ends_at=v_end,duration_days=v_duration,updated_at=now() where id=v_subscription.id;
  return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,'subscription_id',v_subscription.id,'starts_at',v_start,'ends_at',v_end);
 end if;
 if p_payment_status in('refunded','chargeback') then
  update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
  update public.orders set status='refunded',updated_at=now() where id=v_order.id;
  update public.pecatho_customer_premium_subscriptions set status=p_payment_status,updated_at=now() where id=v_subscription.id;
 else
  update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
  update public.orders set status=case when p_payment_status='failed' then 'failed' when p_payment_status='cancelled' then 'cancelled' else 'awaiting_payment' end,updated_at=now() where id=v_order.id;
  update public.pecatho_customer_premium_subscriptions set status=case when p_payment_status in('failed','cancelled') then 'cancelled' else 'pending' end,updated_at=now() where id=v_subscription.id;
 end if;
 return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id,'subscription_id',v_subscription.id);
end;$function$;
revoke all on function public.settle_pecatho_customer_premium_checkout(uuid,text,text,payment_status,text,numeric) from public,anon,authenticated;
grant execute on function public.settle_pecatho_customer_premium_checkout(uuid,text,text,payment_status,text,numeric) to service_role;
