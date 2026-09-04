begin;

-- A buyer may purchase a paid post again only after a previous purchase was
-- refunded/cancelled. This partial uniqueness constraint prevents concurrent
-- paid entitlements for the same buyer/post without blocking repurchase after
-- a refund.
create unique index if not exists fans_purchases_paid_post_uq
  on public.fans_purchases(buyer_user_id, post_id)
  where post_id is not null and status='paid';

-- Keep checkout intent and settlement on the same canonical product metadata
-- contract. kind is retained for compatibility with existing consumers.
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
    select creator_id, price, currency
      into v_creator, v_amount, v_currency
      from public.fans_posts
     where id=p_post_id
       and status='published'
       and access_type='paid';
    if v_creator is null then raise exception 'POST_NOT_AVAILABLE'; end if;
    if v_amount<=0 then raise exception 'INVALID_AMOUNT'; end if;
  else
    if p_plan_id is null then raise exception 'PLAN_REQUIRED'; end if;
    select creator_id, price, currency
      into v_creator, v_amount, v_currency
      from public.fans_plans
     where id=p_plan_id
       and status='active';
    if v_creator is null then raise exception 'PLAN_NOT_AVAILABLE'; end if;
    if v_amount<=0 then raise exception 'INVALID_AMOUNT'; end if;
  end if;

  if exists(select 1 from public.fans_creators where id=v_creator and user_id=v_user) then
    raise exception 'SELF_PURCHASE';
  end if;

  if p_kind='post'
     and exists(select 1 from public.fans_purchases where buyer_user_id=v_user and post_id=p_post_id and status='paid') then
    raise exception 'ALREADY_PURCHASED';
  end if;

  if p_kind='subscription'
     and exists(
       select 1 from public.fans_subscriptions
        where subscriber_user_id=v_user
          and creator_id=v_creator
          and plan_id=p_plan_id
          and status='active'
          and (ends_at is null or ends_at>=pg_catalog.now())
     ) then
    raise exception 'ALREADY_SUBSCRIBED';
  end if;

  v_order_number := 'FAN-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));

  insert into public.orders(
    order_number,user_id,subtotal,discount,fee,total,currency,metadata
  ) values(
    v_order_number,v_user,v_amount,0,0,v_amount,v_currency,
    jsonb_build_object(
      'source','fans',
      'kind',p_kind,
      'product_type',p_kind,
      'product_id',case when p_kind='post' then p_post_id else p_plan_id end,
      'creator_id',v_creator,
      'post_id',p_post_id,
      'plan_id',p_plan_id
    )
  ) returning id into v_order;

  insert into public.payments(
    order_id,user_id,provider,amount,currency,status,payment_method,raw_reference
  ) values(
    v_order,v_user,'pending',v_amount,v_currency,'pending','pending','{}'::jsonb
  );

  if p_kind='post' then
    insert into public.fans_purchases(
      buyer_user_id,creator_id,post_id,amount,platform_fee,creator_amount,currency,status
    ) values(
      v_user,v_creator,p_post_id,v_amount,0,v_amount,v_currency,'pending'
    ) returning id into v_purchase;
  end if;

  return jsonb_build_object(
    'order_id',v_order,
    'order_number',v_order_number,
    'amount',v_amount,
    'currency',v_currency,
    'kind',p_kind,
    'product_type',p_kind,
    'product_id',case when p_kind='post' then p_post_id else p_plan_id end,
    'post_id',p_post_id,
    'plan_id',p_plan_id
  );
end;
$$;

revoke all on function private.create_fans_checkout_intent(text,uuid,uuid) from public, anon, authenticated;
revoke all on function public.create_fans_checkout_intent(text,uuid,uuid) from public, anon, authenticated;
grant execute on function public.create_fans_checkout_intent(text,uuid,uuid) to authenticated;

-- Settlement is the financial authority. Locking the creator serializes
-- entitlement creation and balance-affecting operations for that creator.
-- The metadata fallback keeps already-created pre-fix orders processable.
create or replace function public.settle_fans_checkout(
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
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_existing public.payments%rowtype;
  v_meta jsonb;
  v_product_type text;
  v_product_id uuid;
  v_creator_id uuid;
  v_amount numeric;
  v_provider_fee numeric := greatest(coalesce(p_provider_fee,0),0);
  v_platform_fee numeric := 0;
  v_creator_amount numeric;
  v_rule public.fans_fee_rules%rowtype;
  v_purchase_id uuid;
  v_subscription_id uuid;
  v_previous_purchase public.fans_purchases%rowtype;
begin
  if p_order_id is null
     or nullif(trim(p_provider),'') is null
     or nullif(trim(p_provider_payment_id),'') is null then
    raise exception 'invalid settlement request';
  end if;
  if p_provider_fee < 0 then raise exception 'invalid provider fee'; end if;

  select * into v_order
    from public.orders
   where id=p_order_id
   for update;
  if not found then raise exception 'order not found'; end if;

  select * into v_payment
    from public.payments
   where order_id=p_order_id
   order by created_at desc
   limit 1
   for update;
  if not found then raise exception 'payment not found'; end if;

  select * into v_existing
    from public.payments
   where provider=p_provider
     and provider_payment_id=p_provider_payment_id
     and order_id<>p_order_id
   order by created_at desc
   limit 1;
  if found then raise exception 'provider payment already linked to another order'; end if;

  if v_payment.status='paid' then
    return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id);
  end if;

  v_meta := coalesce(v_order.metadata,'{}'::jsonb);
  v_product_type := coalesce(v_meta->>'product_type',v_meta->>'kind');
  v_product_id := coalesce(
    nullif(v_meta->>'product_id','')::uuid,
    case
      when v_product_type='post' then nullif(v_meta->>'post_id','')::uuid
      when v_product_type='subscription' then nullif(v_meta->>'plan_id','')::uuid
      else null
    end
  );
  v_creator_id := nullif(v_meta->>'creator_id','')::uuid;
  v_amount := v_order.total;

  if v_product_type not in ('post','subscription')
     or v_product_id is null
     or v_creator_id is null then
    raise exception 'invalid Fans order metadata';
  end if;

  -- Serialize all entitlement/ledger settlement work for this creator.
  perform 1 from public.fans_creators where id=v_creator_id for update;
  if not found then raise exception 'creator not found'; end if;

  if p_payment_status='paid' then
    select * into v_rule
      from public.fans_fee_rules
     where active=true
       and effective_from <= pg_catalog.now()
       and (effective_until is null or effective_until > pg_catalog.now())
     order by effective_from desc
     limit 1;

    v_platform_fee := round(
      (v_amount * coalesce(v_rule.platform_percent,0) / 100)
      + coalesce(v_rule.fixed_fee,0),2
    );
    v_platform_fee := least(v_platform_fee,v_amount);
    v_creator_amount := greatest(round(v_amount-v_provider_fee-v_platform_fee,2),0);

    update public.payments
       set provider=p_provider,
           provider_payment_id=p_provider_payment_id,
           status='paid',
           payment_method=p_payment_method,
           paid_at=coalesce(paid_at,pg_catalog.now()),
           updated_at=pg_catalog.now()
     where id=v_payment.id;

    update public.orders
       set status='paid',updated_at=pg_catalog.now()
     where id=v_order.id;

    if v_product_type='post' then
      -- Re-check entitlement after creator lock so concurrent checkout intents
      -- cannot create two paid entitlements for the same buyer/post.
      if exists(
        select 1 from public.fans_purchases
         where buyer_user_id=v_order.user_id
           and post_id=v_product_id
           and status='paid'
      ) then
        raise exception 'ALREADY_PURCHASED';
      end if;

      insert into public.fans_purchases(
        buyer_user_id,creator_id,post_id,subscription_id,amount,platform_fee,
        creator_amount,currency,status,provider,provider_reference,paid_at
      ) values(
        v_order.user_id,v_creator_id,v_product_id,null,v_amount,v_platform_fee,
        v_creator_amount,v_order.currency,'paid',p_provider,p_provider_payment_id,pg_catalog.now()
      ) returning id into v_purchase_id;
    else
      -- An existing active subscription for this creator/plan is reused for a
      -- repeated payment callback/order rather than granting a second access
      -- row. The sale remains represented by its own purchase/ledger entries.
      select id into v_subscription_id
        from public.fans_subscriptions
       where creator_id=v_creator_id
         and subscriber_user_id=v_order.user_id
         and plan_id=v_product_id
         and status='active'
         and (ends_at is null or ends_at>=pg_catalog.now())
       order by starts_at desc
       limit 1
       for update;

      if v_subscription_id is null then
        insert into public.fans_subscriptions(
          creator_id,subscriber_user_id,plan_id,status,starts_at,ends_at,auto_renew
        )
        select v_creator_id,v_order.user_id,v_product_id,'active',pg_catalog.now(),
               pg_catalog.now()+(duration_days*interval '1 day'),false
          from public.fans_plans
         where id=v_product_id
           and status='active'
        returning id into v_subscription_id;
      end if;

      if v_subscription_id is null then
        raise exception 'PLAN_NOT_AVAILABLE';
      end if;

      insert into public.fans_purchases(
        buyer_user_id,creator_id,post_id,subscription_id,amount,platform_fee,
        creator_amount,currency,status,provider,provider_reference,paid_at
      ) values(
        v_order.user_id,v_creator_id,null,v_subscription_id,v_amount,v_platform_fee,
        v_creator_amount,v_order.currency,'paid',p_provider,p_provider_payment_id,pg_catalog.now()
      ) returning id into v_purchase_id;
    end if;

    insert into public.fans_financial_ledger(
      order_id,payment_id,purchase_id,subscription_id,creator_id,entry_type,
      direction,amount,currency,status,provider,provider_reference,metadata
    ) values
    (v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,
      'sale_gross','credit',v_amount,v_order.currency,'posted',p_provider,
      p_provider_payment_id,jsonb_build_object('fee_rule_id',v_rule.id)),
    (v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,
      'provider_fee','debit',v_provider_fee,v_order.currency,'posted',p_provider,
      p_provider_payment_id,'{}'::jsonb),
    (v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,
      'platform_fee','credit',v_platform_fee,v_order.currency,'posted',p_provider,
      p_provider_payment_id,jsonb_build_object('fee_rule_id',v_rule.id)),
    (v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,
      'creator_credit','credit',v_creator_amount,v_order.currency,'posted',p_provider,
      p_provider_payment_id,jsonb_build_object('fee_rule_id',v_rule.id));

    return jsonb_build_object(
      'ok',true,'idempotent',false,'status','paid','order_id',p_order_id,
      'purchase_id',v_purchase_id,'subscription_id',v_subscription_id,
      'gross_amount',v_amount,'provider_fee',v_provider_fee,
      'platform_fee',v_platform_fee,'creator_amount',v_creator_amount
    );
  end if;

  if p_payment_status in ('refunded','chargeback') then
    update public.payments
       set provider=p_provider,
           provider_payment_id=p_provider_payment_id,
           status=p_payment_status,
           payment_method=p_payment_method,
           updated_at=pg_catalog.now()
     where id=v_payment.id;

    update public.orders
       set status='refunded',updated_at=pg_catalog.now()
     where id=v_order.id;

    select * into v_previous_purchase
      from public.fans_purchases
     where provider=p_provider
       and provider_reference=p_provider_payment_id
       and status='paid'
     order by created_at desc
     limit 1
     for update;

    if found then
      update public.fans_purchases
         set status='refunded',updated_at=pg_catalog.now()
       where id=v_previous_purchase.id;

      if v_previous_purchase.subscription_id is not null then
        update public.fans_subscriptions
           set status='refunded',updated_at=pg_catalog.now()
         where id=v_previous_purchase.subscription_id;
      end if;

      if not exists(
        select 1 from public.fans_financial_ledger
         where purchase_id=v_previous_purchase.id
           and entry_type='refund_creator_credit'
           and status='posted'
      ) then
        insert into public.fans_financial_ledger(
          order_id,payment_id,purchase_id,subscription_id,creator_id,entry_type,
          direction,amount,currency,status,provider,provider_reference,metadata
        ) values
        (v_order.id,v_payment.id,v_previous_purchase.id,v_previous_purchase.subscription_id,
          v_previous_purchase.creator_id,'refund_gross','debit',v_previous_purchase.amount,
          v_previous_purchase.currency,'posted',p_provider,p_provider_payment_id,
          jsonb_build_object('reason',p_payment_status)),
        (v_order.id,v_payment.id,v_previous_purchase.id,v_previous_purchase.subscription_id,
          v_previous_purchase.creator_id,'refund_platform_fee','debit',v_previous_purchase.platform_fee,
          v_previous_purchase.currency,'posted',p_provider,p_provider_payment_id,
          jsonb_build_object('reason',p_payment_status)),
        (v_order.id,v_payment.id,v_previous_purchase.id,v_previous_purchase.subscription_id,
          v_previous_purchase.creator_id,'refund_creator_credit','debit',v_previous_purchase.creator_amount,
          v_previous_purchase.currency,'posted',p_provider,p_provider_payment_id,
          jsonb_build_object('reason',p_payment_status));
      end if;
    end if;

    return jsonb_build_object(
      'ok',true,'idempotent',false,'status',p_payment_status,
      'order_id',p_order_id,'refunded_purchase_id',v_previous_purchase.id
    );
  end if;

  if p_payment_status='failed' then
    update public.payments
       set provider=p_provider,provider_payment_id=p_provider_payment_id,
           status='failed',payment_method=p_payment_method,updated_at=pg_catalog.now()
     where id=v_payment.id;
    update public.orders set status='failed',updated_at=pg_catalog.now() where id=v_order.id;
    return jsonb_build_object('ok',true,'idempotent',false,'status','failed','order_id',p_order_id);
  end if;

  if p_payment_status='cancelled' then
    update public.payments
       set provider=p_provider,provider_payment_id=p_provider_payment_id,
           status='cancelled',payment_method=p_payment_method,updated_at=pg_catalog.now()
     where id=v_payment.id;
    update public.orders set status='cancelled',updated_at=pg_catalog.now() where id=v_order.id;
    return jsonb_build_object('ok',true,'idempotent',false,'status','cancelled','order_id',p_order_id);
  end if;

  update public.payments
     set provider=p_provider,provider_payment_id=p_provider_payment_id,
         status=p_payment_status,payment_method=p_payment_method,updated_at=pg_catalog.now()
   where id=v_payment.id;

  return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id);
end;
$$;

revoke all on function public.settle_fans_checkout(uuid,text,text,payment_status,text,numeric) from public, anon, authenticated;

commit;
