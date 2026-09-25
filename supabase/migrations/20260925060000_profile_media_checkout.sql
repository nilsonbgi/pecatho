create or replace function public.create_profile_media_checkout_intent(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_user uuid := auth.uid();
  v_media public.profile_media%rowtype;
  v_profile public.advertiser_profiles%rowtype;
  v_purchase public.profile_media_purchases%rowtype;
  v_order uuid;
  v_order_number text;
  v_payment uuid;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_media
  from public.profile_media
  where id=p_media_id and access_type='paid' and moderation_status='approved'
  for update;
  if not found then raise exception 'MEDIA_NOT_AVAILABLE'; end if;

  select * into v_profile
  from public.advertiser_profiles
  where id=v_media.profile_id and status='published';
  if not found then raise exception 'PROFILE_NOT_AVAILABLE'; end if;

  if v_profile.user_id=v_user then raise exception 'SELF_PURCHASE'; end if;

  select * into v_purchase
  from public.profile_media_purchases
  where media_id=v_media.id and buyer_user_id=v_user and status='paid'
  order by purchased_at desc nulls last, created_at desc
  limit 1;

  if found and (v_purchase.expires_at is null or v_purchase.expires_at > now()) then
    return jsonb_build_object('already_owned',true,'purchase_id',v_purchase.id,'media_id',v_media.id);
  end if;

  v_order_number := 'PEC-MEDIA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));

  insert into public.orders(order_number,user_id,profile_id,subtotal,discount,fee,total,currency,status,metadata)
  values(
    v_order_number,v_user,v_profile.id,v_media.price,0,0,v_media.price,v_media.currency,'awaiting_payment',
    jsonb_build_object(
      'source','pecatho','kind','profile_media','product_type','profile_media',
      'media_id',v_media.id,'profile_id',v_profile.id,'owner_user_id',v_profile.user_id,
      'title',coalesce(v_media.original_filename,'Conteúdo exclusivo'),'media_kind',v_media.kind
    )
  )
  returning id into v_order;

  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',v_media.price,v_media.currency,'pending','pending','{}'::jsonb)
  returning id into v_payment;

  insert into public.profile_media_purchases(media_id,buyer_user_id,amount,currency,status,order_id)
  values(v_media.id,v_user,v_media.price,v_media.currency,'pending',v_order);

  return jsonb_build_object('already_owned',false,'order_id',v_order,'order_number',v_order_number,'media_id',v_media.id,'amount',v_media.price,'currency',v_media.currency);
end;
$$;

create or replace function public.settle_profile_media_checkout(
  p_order_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_payment_status payment_status,
  p_payment_method text default null,
  p_provider_fee numeric default 0
)
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_meta jsonb;
  v_purchase public.profile_media_purchases%rowtype;
begin
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;

  v_meta := coalesce(v_order.metadata,'{}'::jsonb);
  if coalesce(v_meta->>'product_type',v_meta->>'kind') <> 'profile_media' then raise exception 'INVALID_PROFILE_MEDIA_ORDER'; end if;

  select * into v_purchase from public.profile_media_purchases where order_id=v_order.id for update;
  if not found then raise exception 'PURCHASE_NOT_FOUND'; end if;

  if p_payment_status='paid' then
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',
      payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
    update public.orders set status='paid',updated_at=now() where id=v_order.id;
    update public.profile_media_purchases set status='paid',provider=p_provider,provider_reference=p_provider_payment_id,
      purchased_at=coalesce(purchased_at,now()),expires_at=null,updated_at=now() where id=v_purchase.id;
    return jsonb_build_object('ok',true,'status','paid','purchase_id',v_purchase.id,'media_id',v_purchase.media_id);
  end if;

  if p_payment_status in ('refunded','chargeback') then
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,updated_at=now() where id=v_payment.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;
    update public.profile_media_purchases set status=p_payment_status,updated_at=now() where id=v_purchase.id;
    return jsonb_build_object('ok',true,'status',p_payment_status,'purchase_id',v_purchase.id);
  end if;

  update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,updated_at=now() where id=v_payment.id;
  return jsonb_build_object('ok',true,'status',p_payment_status,'purchase_id',v_purchase.id);
end;
$$;

revoke all on function public.create_profile_media_checkout_intent(uuid) from public,anon,authenticated;
grant execute on function public.create_profile_media_checkout_intent(uuid) to authenticated;

revoke all on function public.settle_profile_media_checkout(uuid,text,text,payment_status,text,numeric) from public,anon,authenticated;
grant execute on function public.settle_profile_media_checkout(uuid,text,text,payment_status,text,numeric) to service_role;
