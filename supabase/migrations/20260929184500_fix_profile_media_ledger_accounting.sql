-- Correct seller ledger accounting: gross credit minus explicit fees equals owner balance.
create or replace function public.settle_profile_media_checkout(
  p_order_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_payment_status payment_status,
  p_payment_method text default null,
  p_provider_fee numeric default 0
) returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public
as $function$
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
  if coalesce(v_meta->>'product_type',v_meta->>'kind') <> 'profile_media' then
    raise exception 'INVALID_PROFILE_MEDIA_ORDER';
  end if;

  select * into v_purchase from public.profile_media_purchases where order_id=v_order.id for update;
  if not found then raise exception 'PURCHASE_NOT_FOUND'; end if;

  if p_payment_status='paid' then
    update public.payments
       set provider=p_provider,
           provider_payment_id=p_provider_payment_id,
           status='paid',
           payment_method=p_payment_method,
           paid_at=coalesce(paid_at,now()),
           updated_at=now()
     where id=v_payment.id;

    update public.orders
       set status='paid',
           updated_at=now()
     where id=v_order.id
       and status in ('awaiting_payment','paid');

    update public.profile_media_purchases
       set status='paid',
           provider=p_provider,
           provider_reference=p_provider_payment_id,
           purchased_at=coalesce(purchased_at,now()),
           expires_at=null,
           updated_at=now()
     where id=v_purchase.id
       and status in ('pending','paid');

    return jsonb_build_object('ok',true,'status','paid','purchase_id',v_purchase.id,'media_id',v_purchase.media_id);
  end if;

  if p_payment_status in ('refunded','chargeback') then
    update public.payments
       set provider=p_provider,
           provider_payment_id=p_provider_payment_id,
           status=p_payment_status,
           updated_at=now()
     where id=v_payment.id;

    update public.orders
       set status='refunded',
           updated_at=now()
     where id=v_order.id;

    update public.profile_media_purchases
       set status=p_payment_status,
           updated_at=now()
     where id=v_purchase.id;

    return jsonb_build_object('ok',true,'status',p_payment_status,'purchase_id',v_purchase.id);
  end if;

  update public.payments
     set provider=p_provider,
         provider_payment_id=p_provider_payment_id,
         status=p_payment_status,
         payment_method=coalesce(p_payment_method,payment_method),
         updated_at=now()
   where id=v_payment.id;

  if p_payment_status in ('failed','cancelled') then
    update public.orders
       set status=p_payment_status,
           updated_at=now()
     where id=v_order.id
       and status='awaiting_payment';

    update public.profile_media_purchases
       set status=p_payment_status,
           updated_at=now()
     where id=v_purchase.id
       and status='pending';
  end if;

  return jsonb_build_object('ok',true,'status',p_payment_status,'purchase_id',v_purchase.id);
end;
$function$;
