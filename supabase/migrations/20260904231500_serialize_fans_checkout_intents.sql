begin;

-- Serialize checkout intent creation per creator. This closes the race where
-- two simultaneous clicks could both pass the entitlement checks and create
-- two orders before either payment is confirmed.
create or replace function private.create_fans_checkout_intent(
  p_kind text,
  p_post_id uuid default null,
  p_plan_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user uuid := auth.uid();
  v_creator uuid;
  v_amount numeric;
  v_currency char(3);
  v_order uuid;
  v_purchase uuid;
  v_order_number text;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_kind not in ('post','subscription') then raise exception 'INVALID_KIND'; end if;

  if p_kind='post' then
    if p_post_id is null then raise exception 'POST_REQUIRED'; end if;
    select creator_id,price,currency into v_creator,v_amount,v_currency
      from public.fans_posts
     where id=p_post_id and status='published' and access_type='paid';
    if v_creator is null then raise exception 'POST_NOT_AVAILABLE'; end if;
    if v_amount<=0 then raise exception 'INVALID_AMOUNT'; end if;
  else
    if p_plan_id is null then raise exception 'PLAN_REQUIRED'; end if;
    select creator_id,price,currency into v_creator,v_amount,v_currency
      from public.fans_plans
     where id=p_plan_id and status='active';
    if v_creator is null then raise exception 'PLAN_NOT_AVAILABLE'; end if;
    if v_amount<=0 then raise exception 'INVALID_AMOUNT'; end if;
  end if;

  -- The creator row is the serialization point shared with settlement.
  perform 1 from public.fans_creators where id=v_creator for update;
  if not found then raise exception 'CREATOR_NOT_AVAILABLE'; end if;

  if exists(select 1 from public.fans_creators where id=v_creator and user_id=v_user) then
    raise exception 'SELF_PURCHASE';
  end if;
  if p_kind='post' and exists(select 1 from public.fans_purchases where buyer_user_id=v_user and post_id=p_post_id and status='paid') then
    raise exception 'ALREADY_PURCHASED';
  end if;
  if p_kind='subscription' and exists(select 1 from public.fans_subscriptions where subscriber_user_id=v_user and creator_id=v_creator and plan_id=p_plan_id and status='active' and (ends_at is null or ends_at>=pg_catalog.now())) then
    raise exception 'ALREADY_SUBSCRIBED';
  end if;

  v_order_number:='FAN-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  insert into public.orders(order_number,user_id,subtotal,discount,fee,total,currency,metadata)
  values(v_order_number,v_user,v_amount,0,0,v_amount,v_currency,
    jsonb_build_object('source','fans','kind',p_kind,'product_type',p_kind,
      'product_id',case when p_kind='post' then p_post_id else p_plan_id end,
      'creator_id',v_creator,'post_id',p_post_id,'plan_id',p_plan_id))
  returning id into v_order;

  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',v_amount,v_currency,'pending','pending','{}'::jsonb);

  if p_kind='post' then
    insert into public.fans_purchases(buyer_user_id,creator_id,post_id,amount,platform_fee,creator_amount,currency,status)
    values(v_user,v_creator,p_post_id,v_amount,0,v_amount,v_currency,'pending') returning id into v_purchase;
  end if;

  return jsonb_build_object('order_id',v_order,'order_number',v_order_number,'amount',v_amount,'currency',v_currency,
    'kind',p_kind,'product_type',p_kind,'product_id',case when p_kind='post' then p_post_id else p_plan_id end,
    'post_id',p_post_id,'plan_id',p_plan_id);
end;
$$;

revoke all on function private.create_fans_checkout_intent(text,uuid,uuid) from public,anon,authenticated;
revoke all on function public.create_fans_checkout_intent(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.create_fans_checkout_intent(text,uuid,uuid) to authenticated;

commit;
