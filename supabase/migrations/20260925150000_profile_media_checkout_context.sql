-- Preserve advertiser profile context through paid profile-media checkout.
create or replace function public.create_profile_media_checkout_intent(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public
as $$
declare
  v_user uuid := auth.uid();
  v_media public.profile_media%rowtype;
  v_profile public.advertiser_profiles%rowtype;
  v_purchase public.profile_media_purchases%rowtype;
  v_order public.orders%rowtype;
  v_order_id uuid;
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
    return jsonb_build_object('already_owned',true,'purchase_id',v_purchase.id,'media_id',v_media.id,'profile_slug',v_profile.slug);
  end if;

  select * into v_purchase
  from public.profile_media_purchases
  where media_id=v_media.id and buyer_user_id=v_user and status='pending'
  order by created_at desc
  limit 1;

  if found and v_purchase.order_id is not null then
    select * into v_order from public.orders where id=v_purchase.order_id;
    if found and v_order.status='awaiting_payment' then
      return jsonb_build_object(
        'already_owned',false,
        'existing_order',true,
        'order_id',v_order.id,
        'order_number',v_order.order_number,
        'media_id',v_media.id,
        'amount',v_media.price,
        'currency',v_media.currency,
        'profile_slug',v_profile.slug
      );
    end if;
  end if;

  v_order_number := 'PEC-MEDIA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));

  insert into public.orders(
    order_number,user_id,profile_id,subtotal,discount,fee,total,currency,status,metadata
  )
  values(
    v_order_number,v_user,v_profile.id,v_media.price,0,0,v_media.price,v_media.currency,'awaiting_payment',
    jsonb_build_object(
      'source','pecatho',
      'kind','profile_media',
      'product_type','profile_media',
      'media_id',v_media.id,
      'profile_id',v_profile.id,
      'owner_user_id',v_profile.user_id,
      'profile_slug',v_profile.slug,
      'title',coalesce(v_media.original_filename,'Conteúdo exclusivo'),
      'media_kind',v_media.kind
    )
  )
  returning id into v_order_id;

  insert into public.payments(
    order_id,user_id,provider,amount,currency,status,payment_method,raw_reference
  )
  values(
    v_order_id,v_user,'pending',v_media.price,v_media.currency,'pending','pending','{}'::jsonb
  )
  returning id into v_payment;

  insert into public.profile_media_purchases(
    media_id,buyer_user_id,amount,currency,status,order_id
  )
  values(v_media.id,v_user,v_media.price,v_media.currency,'pending',v_order_id);

  return jsonb_build_object(
    'already_owned',false,
    'existing_order',false,
    'order_id',v_order_id,
    'order_number',v_order_number,
    'media_id',v_media.id,
    'amount',v_media.price,
    'currency',v_media.currency,
    'profile_slug',v_profile.slug
  );
end;
$$;

grant execute on function public.create_profile_media_checkout_intent(uuid) to authenticated;
