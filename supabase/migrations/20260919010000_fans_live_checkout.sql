-- Pecatho Fans: ciclo comercial de videochamadas pagas
-- A sessão só fica disponível para acesso após confirmação do pagamento.

create table if not exists public.fans_live_sessions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.fans_live_offers(id) on delete restrict,
  creator_id uuid not null references public.fans_creators(id) on delete restrict,
  buyer_user_id uuid not null references auth.users(id) on delete restrict,
  order_id uuid unique references public.orders(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  title text not null,
  duration_minutes integer not null,
  amount numeric(12,2) not null,
  currency char(3) not null default 'BRL',
  status text not null default 'pending_payment',
  paid_at timestamptz,
  scheduled_for timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  cancelled_at timestamptz,
  room_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fans_live_sessions_status_check check (
    status in ('pending_payment','paid','scheduled','active','completed','cancelled','refunded','expired')
  ),
  constraint fans_live_sessions_currency_check check (currency = 'BRL'),
  constraint fans_live_sessions_duration_check check (duration_minutes in (10,15,20,30,45,60)),
  constraint fans_live_sessions_amount_check check (amount > 0 and amount <= 100000)
);

create index if not exists fans_live_sessions_buyer_idx
  on public.fans_live_sessions (buyer_user_id, status, created_at desc);

create index if not exists fans_live_sessions_creator_idx
  on public.fans_live_sessions (creator_id, status, created_at desc);

create index if not exists fans_live_sessions_offer_idx
  on public.fans_live_sessions (offer_id, created_at desc);

create index if not exists fans_live_sessions_order_idx
  on public.fans_live_sessions (order_id);

alter table public.fans_live_sessions enable row level security;

drop policy if exists fans_live_sessions_participant_select on public.fans_live_sessions;
create policy fans_live_sessions_participant_select
on public.fans_live_sessions
for select
to authenticated
using (
  buyer_user_id = (select auth.uid())
  or exists (
    select 1
    from public.fans_creators fc
    where fc.id = creator_id
      and fc.user_id = (select auth.uid())
  )
);

create or replace function public.touch_fans_live_session()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_fans_live_sessions_updated_at on public.fans_live_sessions;
create trigger trg_fans_live_sessions_updated_at
before update on public.fans_live_sessions
for each row execute function public.touch_fans_live_session();

-- Apenas o servidor pode criar pedidos de videochamada.
revoke all on function public.create_fans_live_checkout_intent(uuid) from public;
revoke all on function public.create_fans_live_checkout_intent(uuid) from anon;
revoke all on function public.create_fans_live_checkout_intent(uuid) from authenticated;

create or replace function public.create_fans_live_checkout_intent(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user uuid := auth.uid();
  v_offer public.fans_live_offers%rowtype;
  v_creator public.fans_creators%rowtype;
  v_existing public.fans_live_sessions%rowtype;
  v_order uuid;
  v_order_number text;
  v_payment uuid;
  v_session uuid;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
    into v_offer
    from public.fans_live_offers
   where id = p_offer_id
     and status = 'active';

  if not found then
    raise exception 'OFFER_NOT_AVAILABLE';
  end if;

  select *
    into v_creator
    from public.fans_creators
   where id = v_offer.creator_id
     and status = 'active';

  if not found then
    raise exception 'CREATOR_NOT_AVAILABLE';
  end if;

  if v_creator.user_id = v_user then
    raise exception 'SELF_PURCHASE';
  end if;

  select *
    into v_existing
    from public.fans_live_sessions
   where offer_id = v_offer.id
     and buyer_user_id = v_user
     and status in ('pending_payment','paid','scheduled','active')
   order by created_at desc
   limit 1
   for update;

  if found then
    if v_existing.status = 'pending_payment' and v_existing.order_id is not null then
      select id into v_payment
        from public.payments
       where order_id = v_existing.order_id
       order by created_at desc
       limit 1;

      select id, order_number
        into v_order, v_order_number
        from public.orders
       where id = v_existing.order_id;

      if v_order is not null then
        return jsonb_build_object(
          'session_id', v_existing.id,
          'order_id', v_order,
          'order_number', v_order_number,
          'amount', v_existing.amount,
          'currency', v_existing.currency,
          'status', v_existing.status,
          'idempotent', true
        );
      end if;
    else
      raise exception 'LIVE_CHECKOUT_ALREADY_EXISTS';
    end if;
  end if;

  v_order_number := 'FAN-LIVE-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));

  insert into public.orders(
    order_number,
    user_id,
    subtotal,
    discount,
    fee,
    total,
    currency,
    metadata
  )
  values (
    v_order_number,
    v_user,
    v_offer.price,
    0,
    0,
    v_offer.price,
    v_offer.currency,
    jsonb_build_object(
      'source','fans',
      'kind','live_call',
      'product_type','live_call',
      'product_id',v_offer.id,
      'offer_id',v_offer.id,
      'creator_id',v_offer.creator_id,
      'title',v_offer.title,
      'duration_minutes',v_offer.duration_minutes
    )
  )
  returning id into v_order;

  insert into public.payments(
    order_id,
    user_id,
    provider,
    amount,
    currency,
    status,
    payment_method,
    raw_reference
  )
  values (
    v_order,
    v_user,
    'pending',
    v_offer.price,
    v_offer.currency,
    'pending',
    'pending',
    '{}'::jsonb
  )
  returning id into v_payment;

  insert into public.fans_live_sessions(
    offer_id,
    creator_id,
    buyer_user_id,
    order_id,
    payment_id,
    title,
    duration_minutes,
    amount,
    currency,
    status
  )
  values (
    v_offer.id,
    v_offer.creator_id,
    v_user,
    v_order,
    v_payment,
    v_offer.title,
    v_offer.duration_minutes,
    v_offer.price,
    v_offer.currency,
    'pending_payment'
  )
  returning id into v_session;

  return jsonb_build_object(
    'session_id', v_session,
    'order_id', v_order,
    'order_number', v_order_number,
    'amount', v_offer.price,
    'currency', v_offer.currency,
    'status', 'pending_payment',
    'idempotent', false
  );
end;
$$;

grant execute on function public.create_fans_live_checkout_intent(uuid) to authenticated;

-- Atualiza o settlement existente para tratar videochamadas como produto comercial.
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
  v_renewal boolean := false;
  v_plan_duration integer;
  v_live_session_id uuid;
begin
  if p_order_id is null
     or nullif(trim(p_provider),'') is null
     or nullif(trim(p_provider_payment_id),'') is null then
    raise exception 'invalid settlement request';
  end if;

  if p_provider_fee < 0 then
    raise exception 'invalid provider fee';
  end if;

  select * into v_order
    from public.orders
   where id = p_order_id
   for update;

  if not found then
    raise exception 'order not found';
  end if;

  select * into v_payment
    from public.payments
   where order_id = p_order_id
   order by created_at desc
   limit 1
   for update;

  if not found then
    raise exception 'payment not found';
  end if;

  select * into v_existing
    from public.payments
   where provider = p_provider
     and provider_payment_id = p_provider_payment_id
     and order_id <> p_order_id
   order by created_at desc
   limit 1;

  if found then
    raise exception 'provider payment already linked to another order';
  end if;

  if v_payment.status = 'paid'
     and p_payment_status not in ('refunded','chargeback') then
    return jsonb_build_object(
      'ok',true,
      'idempotent',true,
      'status','paid',
      'order_id',p_order_id
    );
  end if;

  v_meta := coalesce(v_order.metadata,'{}'::jsonb);
  v_product_type := coalesce(v_meta->>'product_type',v_meta->>'kind');
  v_product_id := case
    when v_product_type = 'post' then nullif(v_meta->>'post_id','')::uuid
    when v_product_type = 'subscription' then nullif(v_meta->>'plan_id','')::uuid
    when v_product_type = 'live_call' then nullif(v_meta->>'offer_id','')::uuid
    else null
  end;
  v_creator_id := nullif(v_meta->>'creator_id','')::uuid;
  v_amount := v_order.total;
  v_renewal := coalesce((v_meta->>'renewal')::boolean,false);
  v_live_session_id := nullif(v_meta->>'session_id','')::uuid;

  if v_product_type not in ('post','subscription','live_call')
     or v_product_id is null
     or v_creator_id is null then
    raise exception 'invalid Fans order metadata';
  end if;

  if v_product_type = 'live_call' and v_live_session_id is null then
    select id into v_live_session_id
      from public.fans_live_sessions
     where order_id = v_order.id
     limit 1
     for update;
  end if;

  perform 1
    from public.fans_creators
   where id = v_creator_id
   for update;

  if not found then
    raise exception 'creator not found';
  end if;

  if p_payment_status = 'paid' then
    select *
      into v_rule
      from public.fans_fee_rules
     where active = true
       and effective_from <= now()
       and (effective_until is null or effective_until > now())
     order by effective_from desc
     limit 1;

    v_platform_fee := round(
      (v_amount * coalesce(v_rule.platform_percent,0) / 100)
      + coalesce(v_rule.fixed_fee,0),
      2
    );
    v_platform_fee := least(v_platform_fee,v_amount);
    v_creator_amount := greatest(
      round(v_amount-v_provider_fee-v_platform_fee,2),
      0
    );

    update public.payments
       set provider = p_provider,
           provider_payment_id = p_provider_payment_id,
           status = 'paid',
           payment_method = p_payment_method,
           paid_at = coalesce(paid_at,now()),
           updated_at = now()
     where id = v_payment.id;

    update public.orders
       set status = 'paid',
           updated_at = now()
     where id = v_order.id;

    if v_product_type = 'post' then
      if exists (
        select 1
          from public.fans_purchases
         where buyer_user_id = v_order.user_id
           and post_id = v_product_id
           and status = 'paid'
      ) then
        raise exception 'ALREADY_PURCHASED';
      end if;

      insert into public.fans_purchases(
        buyer_user_id,creator_id,post_id,subscription_id,
        amount,platform_fee,creator_amount,currency,status,
        provider,provider_reference,paid_at
      )
      values (
        v_order.user_id,v_creator_id,v_product_id,null,
        v_amount,v_platform_fee,v_creator_amount,v_order.currency,'paid',
        p_provider,p_provider_payment_id,now()
      )
      returning id into v_purchase_id;

    elsif v_product_type = 'subscription' then
      select duration_days into v_plan_duration
        from public.fans_plans
       where id = v_product_id
         and status = 'active';

      if v_plan_duration is null then
        raise exception 'PLAN_NOT_AVAILABLE';
      end if;

      if v_renewal then
        select id into v_subscription_id
          from public.fans_subscriptions
         where creator_id = v_creator_id
           and subscriber_user_id = v_order.user_id
           and plan_id = v_product_id
           and status = 'active'
         order by starts_at desc
         limit 1
         for update;

        if v_subscription_id is null then
          raise exception 'SUBSCRIPTION_NOT_FOUND';
        end if;

        update public.fans_subscriptions
           set status='active',
               ends_at=greatest(coalesce(ends_at,now()),now())
                 +(v_plan_duration*interval '1 day'),
               updated_at=now()
         where id=v_subscription_id;
      else
        select id into v_subscription_id
          from public.fans_subscriptions
         where creator_id=v_creator_id
           and subscriber_user_id=v_order.user_id
           and plan_id=v_product_id
           and status='active'
           and (ends_at is null or ends_at>=now())
         order by starts_at desc
         limit 1
         for update;

        if v_subscription_id is null then
          insert into public.fans_subscriptions(
            creator_id,subscriber_user_id,plan_id,status,
            starts_at,ends_at,auto_renew
          )
          values (
            v_creator_id,v_order.user_id,v_product_id,'active',
            now(),now()+(v_plan_duration*interval '1 day'),false
          )
          returning id into v_subscription_id;
        end if;
      end if;

      insert into public.fans_purchases(
        buyer_user_id,creator_id,post_id,subscription_id,
        amount,platform_fee,creator_amount,currency,status,
        provider,provider_reference,paid_at
      )
      values (
        v_order.user_id,v_creator_id,null,v_subscription_id,
        v_amount,v_platform_fee,v_creator_amount,v_order.currency,'paid',
        p_provider,p_provider_payment_id,now()
      )
      returning id into v_purchase_id;

    else
      if v_live_session_id is null then
        raise exception 'LIVE_SESSION_NOT_FOUND';
      end if;

      update public.fans_live_sessions
         set status = 'paid',
             paid_at = coalesce(paid_at,now()),
             payment_id = v_payment.id,
             order_id = v_order.id,
             updated_at = now()
       where id = v_live_session_id
         and buyer_user_id = v_order.user_id
         and creator_id = v_creator_id
         and offer_id = v_product_id
         and status = 'pending_payment';

      if not found then
        if exists (
          select 1 from public.fans_live_sessions
           where id=v_live_session_id
             and order_id=v_order.id
             and status in ('paid','scheduled','active','completed')
        ) then
          null;
        else
          raise exception 'LIVE_SESSION_NOT_PENDING';
        end if;
      end if;
    end if;

    insert into public.fans_financial_ledger(
      order_id,payment_id,purchase_id,subscription_id,creator_id,
      entry_type,direction,amount,currency,status,provider,
      provider_reference,metadata
    )
    values (
      v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,
      'sale_gross','credit',v_amount,v_order.currency,'posted',
      p_provider,p_provider_payment_id,
      jsonb_build_object(
        'fee_rule_id',v_rule.id,
        'renewal',v_renewal,
        'product_type',v_product_type,
        'live_session_id',v_live_session_id
      )
    ),
    (
      v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,
      'provider_fee','debit',v_provider_fee,v_order.currency,'posted',
      p_provider,p_provider_payment_id,'{}'::jsonb
    ),
    (
      v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,
      'platform_fee','debit',v_platform_fee,v_order.currency,'posted',
      p_provider,p_provider_payment_id,
      jsonb_build_object('fee_rule_id',v_rule.id)
    );

    return jsonb_build_object(
      'ok',true,
      'idempotent',false,
      'status','paid',
      'order_id',p_order_id,
      'purchase_id',v_purchase_id,
      'subscription_id',v_subscription_id,
      'live_session_id',v_live_session_id,
      'gross_amount',v_amount,
      'provider_fee',v_provider_fee,
      'platform_fee',v_platform_fee,
      'creator_amount',v_creator_amount,
      'renewal',v_renewal
    );
  end if;

  if p_payment_status in ('refunded','chargeback') then
    if v_payment.status in ('refunded','chargeback') then
      select * into v_previous_purchase
        from public.fans_purchases
       where provider=p_provider
         and provider_reference=p_provider_payment_id
       order by created_at desc
       limit 1;

      return jsonb_build_object(
        'ok',true,
        'idempotent',true,
        'status',v_payment.status,
        'order_id',p_order_id,
        'refunded_purchase_id',v_previous_purchase.id,
        'live_session_id',v_live_session_id
      );
    end if;

    update public.payments
       set provider=p_provider,
           provider_payment_id=p_provider_payment_id,
           status=p_payment_status,
           payment_method=p_payment_method,
           updated_at=now()
     where id=v_payment.id;

    update public.orders
       set status='refunded',
           updated_at=now()
     where id=v_order.id;

    if v_product_type = 'live_call' then
      update public.fans_live_sessions
         set status='refunded',
             updated_at=now()
       where id=v_live_session_id
         and status in ('pending_payment','paid','scheduled','active');
    else
      select * into v_previous_purchase
        from public.fans_purchases
       where provider=p_provider
         and provider_reference=p_provider_payment_id
       order by created_at desc
       limit 1
       for update;

      if found then
        update public.fans_purchases
           set status='refunded',
               updated_at=now()
         where id=v_previous_purchase.id;

        if v_previous_purchase.subscription_id is not null then
          perform public.fans_recalculate_subscription_after_refund(v_previous_purchase.subscription_id);
        end if;

        if not exists (
          select 1
            from public.fans_financial_ledger
           where purchase_id=v_previous_purchase.id
             and entry_type='refund_creator_credit'
             and status='posted'
        ) then
          insert into public.fans_financial_ledger(
            order_id,payment_id,purchase_id,subscription_id,creator_id,
            entry_type,direction,amount,currency,status,provider,
            provider_reference,metadata
          )
          values
          (
            v_order.id,v_payment.id,v_previous_purchase.id,
            v_previous_purchase.subscription_id,v_previous_purchase.creator_id,
            'refund_gross','debit',v_previous_purchase.amount,
            v_previous_purchase.currency,'posted',p_provider,
            p_provider_payment_id,jsonb_build_object('reason',p_payment_status)
          ),
          (
            v_order.id,v_payment.id,v_previous_purchase.id,
            v_previous_purchase.subscription_id,v_previous_purchase.creator_id,
            'refund_platform_fee','debit',v_previous_purchase.platform_fee,
            v_previous_purchase.currency,'posted',p_provider,
            p_provider_payment_id,jsonb_build_object('reason',p_payment_status)
          ),
          (
            v_order.id,v_payment.id,v_previous_purchase.id,
            v_previous_purchase.subscription_id,v_previous_purchase.creator_id,
            'refund_creator_credit','debit',v_previous_purchase.creator_amount,
            v_previous_purchase.currency,'posted',p_provider,
            p_provider_payment_id,jsonb_build_object('reason',p_payment_status)
          );
        end if;
      end if;
    end if;

    return jsonb_build_object(
      'ok',true,
      'idempotent',false,
      'status',p_payment_status,
      'order_id',p_order_id,
      'refunded_purchase_id',v_previous_purchase.id,
      'live_session_id',v_live_session_id
    );
  end if;

  if p_payment_status='failed' then
    update public.payments
       set provider=p_provider,
           provider_payment_id=p_provider_payment_id,
           status='failed',
           payment_method=p_payment_method,
           updated_at=now()
     where id=v_payment.id;

    update public.orders set status='failed',updated_at=now() where id=v_order.id;

    if v_product_type='live_call' then
      update public.fans_live_sessions
         set status='expired',updated_at=now()
       where id=v_live_session_id
         and status='pending_payment';
    end if;

    return jsonb_build_object(
      'ok',true,'idempotent',false,'status','failed','order_id',p_order_id,
      'live_session_id',v_live_session_id
    );
  end if;

  if p_payment_status='cancelled' then
    update public.payments
       set provider=p_provider,
           provider_payment_id=p_provider_payment_id,
           status='cancelled',
           payment_method=p_payment_method,
           updated_at=now()
     where id=v_payment.id;

    update public.orders set status='cancelled',updated_at=now() where id=v_order.id;

    if v_product_type='live_call' then
      update public.fans_live_sessions
         set status='cancelled',cancelled_at=now(),updated_at=now()
       where id=v_live_session_id
         and status='pending_payment';
    end if;

    return jsonb_build_object(
      'ok',true,'idempotent',false,'status','cancelled','order_id',p_order_id,
      'live_session_id',v_live_session_id
    );
  end if;

  update public.payments
     set provider=p_provider,
         provider_payment_id=p_provider_payment_id,
         status=p_payment_status,
         payment_method=p_payment_method,
         updated_at=now()
   where id=v_payment.id;

  return jsonb_build_object(
    'ok',true,
    'idempotent',false,
    'status',p_payment_status,
    'order_id',p_order_id,
    'live_session_id',v_live_session_id
  );
end;
$$;

grant execute on function public.settle_fans_checkout(uuid,text,text,payment_status,text,numeric) to service_role;

alter publication supabase_realtime add table public.fans_live_sessions;
