begin;

-- Renewal is an explicit checkout operation. It must create a new order/payment
-- while preserving the existing paid subscription period until settlement.
create or replace function public.create_fans_checkout_intent(
  p_kind text,
  p_post_id uuid default null,
  p_plan_id uuid default null,
  p_renewal boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user uuid := auth.uid();
  v_creator uuid;
  v_amount numeric;
  v_currency char(3);
  v_order uuid;
  v_order_number text;
  v_existing uuid;
  v_product_id uuid;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_kind not in ('post','subscription') then raise exception 'INVALID_KIND'; end if;
  if p_renewal and p_kind <> 'subscription' then raise exception 'INVALID_RENEWAL'; end if;

  if p_kind='post' then
    select creator_id,price,currency into v_creator,v_amount,v_currency
      from public.fans_posts
     where id=p_post_id and status='published' and access_type='paid';
    if v_creator is null then raise exception 'POST_NOT_AVAILABLE'; end if;
    v_product_id := p_post_id;
  else
    select creator_id,price,currency into v_creator,v_amount,v_currency
      from public.fans_plans
     where id=p_plan_id and status='active';
    if v_creator is null then raise exception 'PLAN_NOT_AVAILABLE'; end if;
    v_product_id := p_plan_id;
  end if;
  if v_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;

  perform 1 from public.fans_creators where id=v_creator for update;
  if not found then raise exception 'CREATOR_NOT_AVAILABLE'; end if;
  if exists(select 1 from public.fans_creators where id=v_creator and user_id=v_user) then
    raise exception 'SELF_PURCHASE';
  end if;

  if p_kind='post' and exists(
    select 1 from public.fans_purchases
     where buyer_user_id=v_user and post_id=p_post_id and status='paid'
  ) then raise exception 'ALREADY_PURCHASED'; end if;

  if p_kind='subscription' then
    select id into v_existing
      from public.fans_subscriptions
     where subscriber_user_id=v_user and creator_id=v_creator and plan_id=p_plan_id
       and status='pending'
     order by created_at desc limit 1;
    if v_existing is not null then raise exception 'CHECKOUT_ALREADY_PENDING'; end if;
    if not p_renewal and exists(
      select 1 from public.fans_subscriptions
       where subscriber_user_id=v_user and creator_id=v_creator and plan_id=p_plan_id
         and status='active' and (ends_at is null or ends_at>=pg_catalog.now())
    ) then raise exception 'ALREADY_SUBSCRIBED'; end if;
  end if;

  v_order_number := 'FAN-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  insert into public.orders(order_number,user_id,subtotal,discount,fee,total,currency,metadata)
  values(v_order_number,v_user,v_amount,0,0,v_amount,v_currency,
    jsonb_build_object('source','fans','kind',p_kind,'product_type',p_kind,
      'product_id',v_product_id,'creator_id',v_creator,'post_id',p_post_id,
      'plan_id',p_plan_id,'renewal',p_renewal)) returning id into v_order;

  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',v_amount,v_currency,'pending','pending','{}'::jsonb);

  return jsonb_build_object('order_id',v_order,'order_number',v_order_number,
    'amount',v_amount,'currency',v_currency,'kind',p_kind,'product_type',p_kind,
    'product_id',v_product_id,'post_id',p_post_id,'plan_id',p_plan_id,
    'renewal',p_renewal);
end;
$$;

revoke all on function public.create_fans_checkout_intent(text,uuid,uuid,boolean) from public,anon;
grant execute on function public.create_fans_checkout_intent(text,uuid,uuid,boolean) to authenticated;

commit;
