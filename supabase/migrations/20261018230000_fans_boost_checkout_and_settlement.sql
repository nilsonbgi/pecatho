-- Bind each paid Fans boost to its originating order and payment.
alter table public.fans_boosts
  add column if not exists order_id uuid references public.orders(id) on delete restrict,
  add column if not exists payment_id uuid references public.payments(id) on delete restrict;

create unique index if not exists fans_boosts_order_id_unique
  on public.fans_boosts(order_id) where order_id is not null;
create unique index if not exists fans_boosts_payment_id_unique
  on public.fans_boosts(payment_id) where payment_id is not null;

create or replace function public.create_fans_boost_checkout_intent(p_post_id uuid, p_plan_id uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_user uuid := auth.uid();
  v_creator public.fans_creators%rowtype;
  v_post public.fans_posts%rowtype;
  v_plan public.fans_boost_plans%rowtype;
  v_order uuid;
  v_order_number text;
  v_payment uuid;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_post_id is null or p_plan_id is null then raise exception 'BOOST_DETAILS_REQUIRED'; end if;
  select * into v_creator from public.fans_creators
   where user_id = v_user and status = 'active' for update;
  if not found then raise exception 'ACTIVE_CREATOR_REQUIRED'; end if;
  select * into v_post from public.fans_posts
   where id = p_post_id and creator_id = v_creator.id and status = 'published' for update;
  if not found then raise exception 'PUBLISHED_OWN_POST_REQUIRED'; end if;
  select * into v_plan from public.fans_boost_plans
   where id = p_plan_id and status = 'active' for share;
  if not found or v_plan.price <= 0 then raise exception 'BOOST_PLAN_NOT_AVAILABLE'; end if;
  if exists (select 1 from public.fans_boosts where post_id = p_post_id and status = 'active' and ends_at > now()) then
    raise exception 'POST_ALREADY_BOOSTED';
  end if;
  v_order_number := 'FBOOST-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));
  insert into public.orders(order_number,user_id,subtotal,discount,fee,total,currency,status,metadata)
  values(v_order_number,v_user,v_plan.price,0,0,v_plan.price,'BRL','awaiting_payment',
    jsonb_build_object('source','fans','kind','fans_boost','product_type','fans_boost',
      'product_id',p_post_id,'post_id',p_post_id,'plan_id',p_plan_id,'creator_id',v_creator.id,
      'title','Impulsionamento Pecatho Fans - ' || v_plan.name))
  returning id into v_order;
  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',v_plan.price,'BRL','pending','pending',
    jsonb_build_object('channel','pecatho_fans_boost','order_id',v_order))
  returning id into v_payment;
  return jsonb_build_object('order_id',v_order,'order_number',v_order_number,'payment_id',v_payment,
    'amount',v_plan.price,'currency','BRL','product_type','fans_boost','post_id',p_post_id,'plan_id',p_plan_id);
end;
$$;

create or replace function public.settle_fans_boost_checkout(
  p_order_id uuid, p_provider text, p_provider_payment_id text,
  p_payment_status public.payment_status, p_payment_method text default null, p_provider_fee numeric default 0
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_meta jsonb;
  v_creator uuid;
  v_post uuid;
  v_plan_id uuid;
  v_plan public.fans_boost_plans%rowtype;
  v_boost uuid;
begin
  if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null
     or coalesce(p_provider_fee,0) < 0 then raise exception 'INVALID_BOOST_SETTLEMENT'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  v_meta := coalesce(v_order.metadata,'{}'::jsonb);
  if v_meta->>'product_type' <> 'fans_boost' then raise exception 'NOT_A_FANS_BOOST_ORDER'; end if;
  select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if exists(select 1 from public.payments where provider=p_provider and provider_payment_id=p_provider_payment_id and order_id<>p_order_id) then
    raise exception 'PROVIDER_PAYMENT_ALREADY_LINKED';
  end if;
  if v_payment.status='paid' and p_payment_status='paid' then
    select id into v_boost from public.fans_boosts where order_id=p_order_id;
    return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,'boost_id',v_boost);
  end if;
  if v_payment.status in ('refunded','chargeback') and p_payment_status <> v_payment.status then
    raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
  end if;
  v_creator := nullif(v_meta->>'creator_id','')::uuid;
  v_post := nullif(v_meta->>'post_id','')::uuid;
  v_plan_id := nullif(v_meta->>'plan_id','')::uuid;
  if v_creator is null or v_post is null or v_plan_id is null then raise exception 'INVALID_BOOST_ORDER_METADATA'; end if;

  if p_payment_status='paid' then
    if v_order.currency <> 'BRL' or abs(v_order.total-v_payment.amount)>0.01 then raise exception 'BOOST_ORDER_AMOUNT_MISMATCH'; end if;
    select * into v_plan from public.fans_boost_plans where id=v_plan_id and status='active' for share;
    if not found or v_plan.price<=0 or abs(v_plan.price-v_order.total)>0.01 then raise exception 'BOOST_PLAN_PRICE_MISMATCH'; end if;
    perform 1 from public.fans_creators where id=v_creator and status='active' for update;
    if not found then raise exception 'CREATOR_NOT_AVAILABLE'; end if;
    perform 1 from public.fans_posts where id=v_post and creator_id=v_creator and status='published' for update;
    if not found then raise exception 'PUBLISHED_OWN_POST_REQUIRED'; end if;
    if exists(select 1 from public.fans_boosts where post_id=v_post and status='active' and ends_at>now()) then
      raise exception 'POST_ALREADY_BOOSTED';
    end if;
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',
      payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
    update public.orders set status='paid',updated_at=now() where id=v_order.id;
    insert into public.fans_boosts(creator_id,post_id,plan_id,starts_at,ends_at,status,order_id,payment_id)
    values(v_creator,v_post,v_plan_id,now(),now()+(v_plan.duration_hours*interval '1 hour'),'active',v_order.id,v_payment.id)
    returning id into v_boost;
    return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,'boost_id',v_boost);
  end if;
  update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
    payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
  if p_payment_status in ('refunded','chargeback','cancelled','failed') then
    update public.orders set status=case when p_payment_status in ('refunded','chargeback') then 'refunded' else 'cancelled' end,
      updated_at=now() where id=v_order.id;
    update public.fans_boosts set status='cancelled' where order_id=v_order.id and status in ('pending','active');
  end if;
  return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status::text,'order_id',p_order_id);
end;
$$;

revoke all on function public.create_fans_boost_checkout_intent(uuid,uuid) from public, anon;
grant execute on function public.create_fans_boost_checkout_intent(uuid,uuid) to authenticated;
revoke all on function public.settle_fans_boost_checkout(uuid,text,text,public.payment_status,text,numeric) from public, anon, authenticated;
grant execute on function public.settle_fans_boost_checkout(uuid,text,text,public.payment_status,text,numeric) to service_role;
