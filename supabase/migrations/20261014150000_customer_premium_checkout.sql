-- Customer Premium: paid entitlement is granted only by the verified Mercado Pago webhook.
create table if not exists public.pecatho_customer_premium_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null unique,
  name text not null,
  description text,
  price numeric(12,2) not null check (price > 0),
  currency char(3) not null default 'BRL' check (currency = 'BRL'),
  duration_days integer not null check (duration_days > 0),
  benefits jsonb not null default '[]'::jsonb,
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pecatho_customer_premium_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.pecatho_customer_premium_plans(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled','refunded','chargeback')),
  starts_at timestamptz,
  ends_at timestamptz,
  paid_amount numeric(12,2) not null check (paid_amount > 0),
  currency char(3) not null default 'BRL' check (currency = 'BRL'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status <> 'active') or (starts_at is not null and ends_at is not null and ends_at > starts_at))
);

create index if not exists pecatho_customer_premium_user_status_idx
  on public.pecatho_customer_premium_subscriptions(user_id,status,ends_at desc);
create index if not exists pecatho_customer_premium_plan_active_idx
  on public.pecatho_customer_premium_plans(active,sort_order,price);

alter table public.pecatho_customer_premium_plans enable row level security;
alter table public.pecatho_customer_premium_subscriptions enable row level security;
revoke all on public.pecatho_customer_premium_plans from anon, authenticated;
revoke all on public.pecatho_customer_premium_subscriptions from anon, authenticated;
grant select on public.pecatho_customer_premium_plans to authenticated;
grant select on public.pecatho_customer_premium_subscriptions to authenticated;
create policy pecatho_premium_active_plans_select on public.pecatho_customer_premium_plans
  for select to authenticated using (active = true);
create policy pecatho_premium_owner_select on public.pecatho_customer_premium_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.create_pecatho_customer_premium_checkout(p_plan_id uuid)
returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_order uuid;
  v_order_number text;
  v_subscription uuid;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not exists(select 1 from public.profiles where id=v_user and account_type='customer') then
    raise exception 'CUSTOMER_ACCOUNT_REQUIRED';
  end if;
  select * into v_plan from public.pecatho_customer_premium_plans
    where id=p_plan_id and active=true for share;
  if not found then raise exception 'PREMIUM_PLAN_UNAVAILABLE'; end if;

  v_order_number := 'PEC-PREM-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  insert into public.orders(order_number,user_id,status,subtotal,discount,fee,total,currency,metadata)
  values(v_order_number,v_user,'awaiting_payment',v_plan.price,0,0,v_plan.price,'BRL',
    jsonb_build_object('source','pecatho','kind','customer_premium','product_type','premium_subscription',
      'product_id',v_plan.id,'plan_key',v_plan.plan_key,'title',v_plan.name,'duration_days',v_plan.duration_days))
  returning id into v_order;

  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',v_plan.price,'BRL','pending','pending','{}'::jsonb);

  insert into public.pecatho_customer_premium_subscriptions(user_id,plan_id,order_id,paid_amount,currency,status)
  values(v_user,v_plan.id,v_order,v_plan.price,'BRL','pending') returning id into v_subscription;

  return jsonb_build_object('subscription_id',v_subscription,'order_id',v_order,'order_number',v_order_number,
    'plan_id',v_plan.id,'amount',v_plan.price,'currency','BRL','status','pending');
end;
$function$;

revoke all on function public.create_pecatho_customer_premium_checkout(uuid) from public, anon;
grant execute on function public.create_pecatho_customer_premium_checkout(uuid) to authenticated;

create or replace function public.settle_pecatho_customer_premium_checkout(
  p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status,
  p_payment_method text default null, p_provider_fee numeric default 0
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_subscription public.pecatho_customer_premium_subscriptions%rowtype;
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_start timestamptz;
  v_end timestamptz;
begin
  if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null then
    raise exception 'INVALID_PREMIUM_SETTLEMENT_REQUEST';
  end if;
  if coalesce(p_provider_fee,0) < 0 then raise exception 'INVALID_PROVIDER_FEE'; end if;

  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.metadata->>'product_type' <> 'premium_subscription' then raise exception 'PREMIUM_ORDER_NOT_FOUND'; end if;
  select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  select * into v_subscription from public.pecatho_customer_premium_subscriptions where order_id=p_order_id for update;
  if not found then raise exception 'PREMIUM_SUBSCRIPTION_NOT_FOUND'; end if;
  select * into v_plan from public.pecatho_customer_premium_plans where id=v_subscription.plan_id;
  if not found then raise exception 'PREMIUM_PLAN_NOT_FOUND'; end if;

  if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then
    raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
  end if;
  if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then
    return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,
      'subscription_id',v_subscription.id,'ends_at',v_subscription.ends_at);
  end if;

  if p_payment_status='paid' then
    select greatest(now(),coalesce(max(ends_at),now())) into v_start
      from public.pecatho_customer_premium_subscriptions
      where user_id=v_subscription.user_id and status='active' and ends_at > now();
    v_end := v_start + make_interval(days => v_plan.duration_days);
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',
      payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
    update public.orders set status='paid',updated_at=now() where id=v_order.id;
    update public.pecatho_customer_premium_subscriptions set status='active',starts_at=v_start,ends_at=v_end,
      updated_at=now() where id=v_subscription.id;
    return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,
      'subscription_id',v_subscription.id,'starts_at',v_start,'ends_at',v_end);
  end if;

  if p_payment_status in ('refunded','chargeback') then
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;
    update public.pecatho_customer_premium_subscriptions set status=p_payment_status,updated_at=now()
      where id=v_subscription.id;
  else
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
    update public.orders set status=case when p_payment_status='failed' then 'failed' when p_payment_status='cancelled' then 'cancelled' else 'awaiting_payment' end,
      updated_at=now() where id=v_order.id;
    update public.pecatho_customer_premium_subscriptions set status=case when p_payment_status='failed' then 'cancelled' when p_payment_status='cancelled' then 'cancelled' else 'pending' end,
      updated_at=now() where id=v_subscription.id;
  end if;
  return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id,
    'subscription_id',v_subscription.id);
end;
$function$;

revoke all on function public.settle_pecatho_customer_premium_checkout(uuid,text,text,payment_status,text,numeric) from public, anon, authenticated;
grant execute on function public.settle_pecatho_customer_premium_checkout(uuid,text,text,payment_status,text,numeric) to service_role;
