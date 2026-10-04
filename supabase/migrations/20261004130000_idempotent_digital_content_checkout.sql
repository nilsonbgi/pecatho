-- Make digital-content checkout idempotent per authenticated buyer/product pair.
-- Paid ownership wins over stale pending rows, and valid pending orders are reused.
create or replace function public.create_digital_content_checkout_intent(p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_product public.digital_content_products%rowtype;
  v_order uuid;
  v_order_number text;
  v_payment uuid;
  v_sale uuid;
  v_existing_sale_id uuid;
  v_existing_order_id uuid;
  v_existing_order_number text;
  v_existing_amount numeric;
  v_existing_currency text;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
    into v_product
    from public.digital_content_products
   where id = p_product_id
     and status = 'published';

  if not found then
    raise exception 'PRODUCT_NOT_AVAILABLE';
  end if;

  if v_product.owner_type = 'advertiser' then
    if not exists (
      select 1 from public.advertiser_profiles ap
       where ap.id = v_product.owner_id and ap.status = 'published'
    ) then
      raise exception 'PRODUCT_NOT_AVAILABLE';
    end if;
  elsif v_product.owner_type = 'creator' then
    if not exists (
      select 1 from public.fans_creators fc
       where fc.id = v_product.owner_id and fc.status = 'active'
    ) then
      raise exception 'PRODUCT_NOT_AVAILABLE';
    end if;
  else
    raise exception 'PRODUCT_NOT_AVAILABLE';
  end if;

  if v_product.owner_user_id = v_user then
    raise exception 'SELF_PURCHASE';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user::text || ':' || v_product.id::text, 0)
  );

  select s.id
    into v_existing_sale_id
    from public.digital_content_sales s
   where s.product_id = v_product.id
     and s.buyer_user_id = v_user
     and s.status = 'paid'
   order by s.paid_at desc nulls last, s.created_at desc
   limit 1;

  if v_existing_sale_id is not null then
    return pg_catalog.jsonb_build_object('already_owned', true, 'sale_id', v_existing_sale_id);
  end if;

  select s.id, o.id, o.order_number, s.amount, s.currency
    into v_existing_sale_id, v_existing_order_id, v_existing_order_number,
         v_existing_amount, v_existing_currency
    from public.digital_content_sales s
    join public.orders o on o.id = s.order_id
    join public.payments p on p.id = s.payment_id and p.order_id = o.id
   where s.product_id = v_product.id
     and s.buyer_user_id = v_user
     and s.status = 'pending'
     and o.user_id = v_user
     and o.status = 'awaiting_payment'
     and p.status = 'pending'
     and p.provider_payment_id is null
   order by s.created_at desc
   limit 1
   for update of s, o, p;

  if v_existing_sale_id is not null then
    return pg_catalog.jsonb_build_object(
      'already_owned', false, 'existing_order', true,
      'sale_id', v_existing_sale_id, 'order_id', v_existing_order_id,
      'order_number', v_existing_order_number, 'amount', v_existing_amount,
      'currency', v_existing_currency
    );
  end if;

  v_order_number := 'PEC-CONT-' || pg_catalog.upper(
    pg_catalog.substr(pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 20)
  );

  insert into public.orders(
    order_number, user_id, subtotal, discount, fee, total, currency, status, metadata
  ) values (
    v_order_number, v_user, v_product.price, 0, 0, v_product.price,
    v_product.currency, 'awaiting_payment',
    pg_catalog.jsonb_build_object(
      'source', 'pecatho', 'kind', 'digital_content', 'product_type', 'digital_content',
      'product_id', v_product.id, 'owner_type', v_product.owner_type,
      'owner_id', v_product.owner_id, 'owner_user_id', v_product.owner_user_id,
      'title', v_product.title
    )
  ) returning id into v_order;

  insert into public.payments(
    order_id, user_id, provider, amount, currency, status, payment_method, raw_reference
  ) values (
    v_order, v_user, 'pending', v_product.price, v_product.currency,
    'pending', 'pending', '{}'::jsonb
  ) returning id into v_payment;

  insert into public.digital_content_sales(
    product_id, buyer_user_id, owner_type, owner_id, owner_user_id,
    order_id, payment_id, amount, platform_fee, owner_amount, currency, status
  ) values (
    v_product.id, v_user, v_product.owner_type, v_product.owner_id,
    v_product.owner_user_id, v_order, v_payment, v_product.price, 0,
    v_product.price, v_product.currency, 'pending'
  ) returning id into v_sale;

  return pg_catalog.jsonb_build_object(
    'already_owned', false, 'sale_id', v_sale, 'order_id', v_order,
    'order_number', v_order_number, 'amount', v_product.price, 'currency', v_product.currency
  );
end;
$function$;
