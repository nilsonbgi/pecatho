-- Prevent professional Premium plans from being purchased through the customer checkout RPC.
-- The customer and professional catalogs share pecatho_customer_premium_plans;
-- audience must therefore be checked server-side, not only by the UI.
create or replace function public.create_pecatho_customer_premium_checkout(
  p_plan_id uuid,
  p_creator_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_creator public.fans_creators%rowtype;
  v_order uuid;
  v_order_number text;
  v_subscription uuid;
begin
  if v_user is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_user and account_type = 'customer'
  ) then
    raise exception 'CUSTOMER_ACCOUNT_REQUIRED';
  end if;

  select * into v_plan
  from public.pecatho_customer_premium_plans
  where id = p_plan_id
    and active = true
    and audience = 'customer'
  for share;

  if not found then
    raise exception 'PREMIUM_PLAN_UNAVAILABLE';
  end if;

  if p_creator_id is not null then
    select * into v_creator
    from public.fans_creators
    where id = p_creator_id
      and status = 'active'
      and user_id <> v_user;

    if not found then
      raise exception 'PREMIUM_ATTRIBUTION_CREATOR_INVALID';
    end if;
  end if;

  v_order_number := 'PEC-PREM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));

  insert into public.orders (
    order_number, user_id, status, subtotal, discount, fee, total, currency, metadata
  )
  values (
    v_order_number, v_user, 'awaiting_payment', v_plan.price, 0, 0, v_plan.price, 'BRL',
    jsonb_build_object(
      'source', 'pecatho',
      'kind', 'customer_premium',
      'product_type', 'premium_subscription',
      'product_id', v_plan.id,
      'plan_key', v_plan.plan_key,
      'title', v_plan.name,
      'duration_days', v_plan.duration_days,
      'attribution_source', case when p_creator_id is not null then 'creator_profile' else null end,
      'attributed_creator_id', p_creator_id
    )
  )
  returning id into v_order;

  insert into public.payments (
    order_id, user_id, provider, amount, currency, status, payment_method, raw_reference
  )
  values (
    v_order, v_user, 'pending', v_plan.price, 'BRL', 'pending', 'pending', '{}'::jsonb
  );

  insert into public.pecatho_customer_premium_subscriptions (
    user_id, plan_id, order_id, paid_amount, currency, status, attributed_creator_id
  )
  values (
    v_user, v_plan.id, v_order, v_plan.price, 'BRL', 'pending', p_creator_id
  )
  returning id into v_subscription;

  return jsonb_build_object(
    'subscription_id', v_subscription,
    'order_id', v_order,
    'order_number', v_order_number,
    'plan_id', v_plan.id,
    'amount', v_plan.price,
    'currency', 'BRL',
    'status', 'pending',
    'attributed_creator_id', p_creator_id
  );
end;
$function$;

revoke all on function public.create_pecatho_customer_premium_checkout(uuid, uuid) from public, anon;
grant execute on function public.create_pecatho_customer_premium_checkout(uuid, uuid) to authenticated, service_role;
