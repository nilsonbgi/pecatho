-- Checkout and verified settlement for creator-only publication plans.
create or replace function public.create_pecatho_creator_publication_checkout(p_plan_id uuid,p_creator_id uuid)
returns jsonb
language plpgsql security definer set search_path=pg_catalog,public
as $function$
declare
  v_user uuid:=auth.uid();
  v_creator public.fans_creators%rowtype;
  v_plan public.publication_plans%rowtype;
  v_order uuid;
  v_order_number text;
  v_snapshot jsonb;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select * into v_creator from public.fans_creators where id=p_creator_id and user_id=v_user and status='active' for share;
  if not found then raise exception 'CREATOR_PROFILE_NOT_OWNED'; end if;
  select * into v_plan from public.publication_plans where id=p_plan_id and active=true for share;
  if not found then raise exception 'PUBLICATION_PLAN_UNAVAILABLE'; end if;
  if v_plan.free then raise exception 'FREE_PLAN_USE_ACTIVATION'; end if;
  if v_plan.audience not in ('content_seller','both') then raise exception 'PUBLICATION_PLAN_AUDIENCE_MISMATCH'; end if;
  if exists(select 1 from public.orders o where o.user_id=v_user and o.status='awaiting_payment'
    and o.metadata->>'product_type'='creator_publication_plan' and o.metadata->>'creator_id'=p_creator_id::text) then
    raise exception 'PUBLICATION_CHECKOUT_ALREADY_PENDING';
  end if;
  v_snapshot:=jsonb_build_object('audience',v_plan.audience,'featured_card',v_plan.featured_card,
    'search_priority',v_plan.search_priority,'show_premium_badge',v_plan.show_premium_badge,
    'profile_theme',v_plan.profile_theme,'has_video',v_plan.has_video,'duration_days',v_plan.duration_days,'plan_name',v_plan.name);
  v_order_number:='PEC-CRT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  insert into public.orders(order_number,user_id,status,subtotal,discount,fee,total,currency,metadata)
  values(v_order_number,v_user,'awaiting_payment',v_plan.price,0,0,v_plan.price,'BRL',
    jsonb_build_object('source','pecatho','kind','creator_publication_plan','product_type','creator_publication_plan',
      'product_id',v_plan.id,'plan_id',v_plan.id,'creator_id',p_creator_id,'title',v_plan.name,
      'duration_days',v_plan.duration_days,'plan_features_snapshot',v_snapshot))
  returning id into v_order;
  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',v_plan.price,'BRL','pending','pending','{}'::jsonb);
  return jsonb_build_object('order_id',v_order,'order_number',v_order_number,'plan_id',v_plan.id,'creator_id',p_creator_id,'amount',v_plan.price,'currency','BRL','status','pending');
end;
$function$;
revoke all on function public.create_pecatho_creator_publication_checkout(uuid,uuid) from public,anon;
grant execute on function public.create_pecatho_creator_publication_checkout(uuid,uuid) to authenticated;

create or replace function public.activate_free_pecatho_creator_publication_plan(p_plan_id uuid,p_creator_id uuid)
returns jsonb
language plpgsql security definer set search_path=pg_catalog,public
as $function$
declare
  v_user uuid:=auth.uid();
  v_plan public.publication_plans%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_snapshot jsonb;
  v_publication uuid;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not exists(select 1 from public.fans_creators where id=p_creator_id and user_id=v_user and status='active') then raise exception 'CREATOR_PROFILE_NOT_OWNED'; end if;
  select * into v_plan from public.publication_plans where id=p_plan_id and active=true and free=true and price=0 for share;
  if not found then raise exception 'FREE_PUBLICATION_PLAN_UNAVAILABLE'; end if;
  if v_plan.audience not in ('content_seller','both') then raise exception 'PUBLICATION_PLAN_AUDIENCE_MISMATCH'; end if;
  if exists(select 1 from public.pecatho_creator_publications where creator_id=p_creator_id and status='published' and ends_at>now()) then
    raise exception 'PUBLICATION_ALREADY_ACTIVE';
  end if;
  select greatest(now(),coalesce(max(ends_at),now())) into v_start from public.pecatho_creator_publications
    where creator_id=p_creator_id and status='published' and ends_at>now();
  v_end:=v_start+make_interval(days=>v_plan.duration_days);
  v_snapshot:=jsonb_build_object('audience',v_plan.audience,'featured_card',v_plan.featured_card,
    'search_priority',v_plan.search_priority,'show_premium_badge',v_plan.show_premium_badge,
    'profile_theme',v_plan.profile_theme,'has_video',v_plan.has_video,'duration_days',v_plan.duration_days,'plan_name',v_plan.name);
  insert into public.pecatho_creator_publications(creator_id,plan_id,status,starts_at,ends_at,paid,plan_features_snapshot,paid_amount)
  values(p_creator_id,v_plan.id,'published',v_start,v_end,false,v_snapshot,0) returning id into v_publication;
  return jsonb_build_object('ok',true,'publication_id',v_publication,'starts_at',v_start,'ends_at',v_end);
end;
$function$;
revoke all on function public.activate_free_pecatho_creator_publication_plan(uuid,uuid) from public,anon;
grant execute on function public.activate_free_pecatho_creator_publication_plan(uuid,uuid) to authenticated;

create or replace function public.settle_pecatho_creator_publication_checkout(
  p_order_id uuid,p_provider text,p_provider_payment_id text,p_payment_status payment_status,
  p_payment_method text default null,p_provider_fee numeric default 0
) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public
as $function$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_creator_id uuid;
  v_plan_id uuid;
  v_snapshot jsonb;
  v_duration integer;
  v_start timestamptz;
  v_end timestamptz;
  v_publication public.pecatho_creator_publications%rowtype;
begin
  if p_order_id is null or nullif(trim(coalesce(p_provider,'')),'') is null or nullif(trim(coalesce(p_provider_payment_id,'')),'') is null then raise exception 'INVALID_PUBLICATION_SETTLEMENT_REQUEST'; end if;
  if coalesce(p_provider_fee,0)<0 then raise exception 'INVALID_PROVIDER_FEE'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.metadata->>'product_type'<>'creator_publication_plan' then raise exception 'CREATOR_PUBLICATION_ORDER_NOT_FOUND'; end if;
  select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  select * into v_publication from public.pecatho_creator_publications where order_id=p_order_id;
  if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then raise exception 'INVALID_PAYMENT_STATE_TRANSITION'; end if;
  if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,'publication_id',v_publication.id); end if;
  if p_payment_status='paid' then
    v_creator_id:=nullif(v_order.metadata->>'creator_id','')::uuid;
    v_plan_id:=nullif(v_order.metadata->>'plan_id','')::uuid;
    v_snapshot:=coalesce(v_order.metadata->'plan_features_snapshot','{}'::jsonb);
    v_duration:=coalesce(nullif(v_order.metadata->>'duration_days','')::integer,0);
    if v_creator_id is null or v_plan_id is null or v_duration not between 1 and 365 then raise exception 'CREATOR_PUBLICATION_SNAPSHOT_INVALID'; end if;
    if exists(select 1 from public.pecatho_creator_publications where order_id=p_order_id) then return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id); end if;
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',payment_method=p_payment_method,provider_fee=coalesce(p_provider_fee,0),paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
    update public.orders set status='paid',updated_at=now() where id=v_order.id;
    select greatest(now(),coalesce(max(ends_at),now())) into v_start from public.pecatho_creator_publications where creator_id=v_creator_id and status='published' and ends_at>now();
    v_end:=v_start+make_interval(days=>v_duration);
    insert into public.pecatho_creator_publications(creator_id,plan_id,status,starts_at,ends_at,paid,order_id,plan_features_snapshot,paid_amount)
    values(v_creator_id,v_plan_id,'published',v_start,v_end,true,p_order_id,v_snapshot,round(v_order.total,2)) returning * into v_publication;
    return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,'publication_id',v_publication.id,'starts_at',v_start,'ends_at',v_end);
  end if;
  if p_payment_status in ('refunded','chargeback') then
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=p_payment_method,provider_fee=coalesce(p_provider_fee,0),updated_at=now() where id=v_payment.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;
    update public.pecatho_creator_publications set status='paused',ends_at=least(coalesce(ends_at,now()),now()) where order_id=p_order_id;
  else
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=p_payment_method,provider_fee=coalesce(p_provider_fee,0),updated_at=now() where id=v_payment.id;
    update public.orders set status=case when p_payment_status='failed' then 'failed' when p_payment_status='cancelled' then 'cancelled' else 'awaiting_payment' end,updated_at=now() where id=v_order.id;
  end if;
  return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id);
end;
$function$;
revoke all on function public.settle_pecatho_creator_publication_checkout(uuid,text,text,payment_status,text,numeric) from public,anon,authenticated;
grant execute on function public.settle_pecatho_creator_publication_checkout(uuid,text,text,payment_status,text,numeric) to service_role;
