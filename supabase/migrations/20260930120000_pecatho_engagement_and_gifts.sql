-- Pecatho: gifts and message reactions
-- This migration mirrors the production schema/function layer introduced for the engagement and gift cycle.

create table if not exists public.pecatho_gifts (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references auth.users(id) on delete restrict,
  recipient_user_id uuid not null references auth.users(id) on delete restrict,
  recipient_type text not null check (recipient_type in ('advertiser','creator')),
  recipient_id uuid not null,
  order_id uuid unique references public.orders(id) on delete restrict,
  payment_id uuid references public.payments(id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 10 and amount <= 10000),
  platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0),
  provider_fee numeric(12,2) not null default 0 check (provider_fee >= 0),
  recipient_amount numeric(12,2) not null default 0 check (recipient_amount >= 0),
  currency char(3) not null default 'BRL',
  message text,
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','refunded','chargeback')),
  provider text,
  provider_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_user_id <> recipient_user_id),
  check (message is null or char_length(message) <= 300)
);

create index if not exists pecatho_gifts_recipient_idx on public.pecatho_gifts(recipient_user_id, status, created_at desc);
create index if not exists pecatho_gifts_buyer_idx on public.pecatho_gifts(buyer_user_id, status, created_at desc);
create unique index if not exists pecatho_gifts_order_uidx on public.pecatho_gifts(order_id) where order_id is not null;

alter table public.pecatho_gifts enable row level security;
revoke all on public.pecatho_gifts from anon, authenticated;
grant select on public.pecatho_gifts to authenticated;

drop policy if exists "gifts buyer or recipient select" on public.pecatho_gifts;
create policy "gifts buyer or recipient select"
on public.pecatho_gifts for select to authenticated
using ((select auth.uid()) = buyer_user_id or (select auth.uid()) = recipient_user_id);

create or replace function public.create_pecatho_gift_checkout_intent(
  p_recipient_type text, p_recipient_id uuid, p_amount numeric, p_message text default null
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_user uuid := auth.uid();
  v_recipient_user_id uuid;
  v_recipient_name text;
  v_order uuid;
  v_order_number text;
  v_gift uuid;
  v_amount numeric(12,2);
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.profiles where id=v_user and account_type in ('customer','both')) then
    raise exception 'CUSTOMER_ACCOUNT_REQUIRED';
  end if;
  v_amount := round(coalesce(p_amount,0),2);
  if v_amount < 10 or v_amount > 10000 then raise exception 'INVALID_GIFT_AMOUNT'; end if;

  if p_recipient_type = 'advertiser' then
    select ap.user_id, coalesce(ap.display_name, ap.title, 'Anunciante')
      into v_recipient_user_id, v_recipient_name
      from public.advertiser_profiles ap where ap.id=p_recipient_id and ap.status='published';
  elsif p_recipient_type = 'creator' then
    select fc.user_id, coalesce(fc.display_name, 'Vendedor de conteúdo')
      into v_recipient_user_id, v_recipient_name
      from public.fans_creators fc where fc.id=p_recipient_id and fc.status='active';
  else
    raise exception 'INVALID_RECIPIENT_TYPE';
  end if;

  if v_recipient_user_id is null then raise exception 'RECIPIENT_NOT_FOUND'; end if;
  if v_recipient_user_id = v_user then raise exception 'SELF_GIFT_NOT_ALLOWED'; end if;

  v_order_number := 'PEC-GIFT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));

  insert into public.orders(order_number,user_id,status,subtotal,discount,fee,total,currency,metadata)
  values (
    v_order_number,v_user,'awaiting_payment',v_amount,0,0,v_amount,'BRL',
    jsonb_build_object('source','pecatho','kind','gift','product_type','gift',
      'recipient_type',p_recipient_type,'recipient_id',p_recipient_id,
      'recipient_user_id',v_recipient_user_id,'title','Presente Pecatho',
      'recipient_name',v_recipient_name)
  ) returning id into v_order;

  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',v_amount,'BRL','pending','pending','{}'::jsonb);

  insert into public.pecatho_gifts(
    buyer_user_id,recipient_user_id,recipient_type,recipient_id,order_id,amount,currency,message,status
  ) values (
    v_user,v_recipient_user_id,p_recipient_type,p_recipient_id,v_order,v_amount,'BRL',
    nullif(left(trim(coalesce(p_message,'')),300),''),'pending'
  ) returning id into v_gift;

  return jsonb_build_object('gift_id',v_gift,'order_id',v_order,'order_number',v_order_number,
    'amount',v_amount,'currency','BRL','recipient_type',p_recipient_type,
    'recipient_id',p_recipient_id,'recipient_name',v_recipient_name,'status','pending');
end;
$function$;

revoke all on function public.create_pecatho_gift_checkout_intent(text,uuid,numeric,text) from public, anon;
grant execute on function public.create_pecatho_gift_checkout_intent(text,uuid,numeric,text) to authenticated;

create or replace function public.settle_pecatho_gift_checkout(
  p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status,
  p_payment_method text default null, p_provider_fee numeric default 0
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_gift public.pecatho_gifts%rowtype;
  v_platform_fee numeric := 0;
  v_recipient_amount numeric := 0;
  v_provider_fee numeric := greatest(coalesce(p_provider_fee,0),0);
  v_rule public.fans_fee_rules%rowtype;
  v_recipient_creator_id uuid;
begin
  if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null then
    raise exception 'invalid gift settlement request';
  end if;
  if p_provider_fee < 0 then raise exception 'invalid provider fee'; end if;

  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
  if not found then raise exception 'payment not found'; end if;
  select * into v_gift from public.pecatho_gifts where order_id=p_order_id for update;
  if not found then raise exception 'gift not found'; end if;

  if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then
    return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,'gift_id',v_gift.id);
  end if;

  if p_payment_status='paid' then
    select * into v_rule from public.fans_fee_rules
     where active=true and effective_from <= now()
       and (effective_until is null or effective_until > now())
     order by effective_from desc limit 1;

    v_platform_fee := round((v_gift.amount * coalesce(v_rule.platform_percent,0) / 100) + coalesce(v_rule.fixed_fee,0),2);
    v_platform_fee := least(v_platform_fee,v_gift.amount);
    v_recipient_amount := greatest(round(v_gift.amount-v_provider_fee-v_platform_fee,2),0);

    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',
      payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
    update public.orders set status='paid',updated_at=now() where id=v_order.id;
    update public.pecatho_gifts set platform_fee=v_platform_fee,provider_fee=v_provider_fee,
      recipient_amount=v_recipient_amount,status='paid',provider=p_provider,
      provider_reference=p_provider_payment_id,payment_id=v_payment.id,paid_at=coalesce(paid_at,now()),updated_at=now()
      where id=v_gift.id;

    if v_gift.recipient_type='creator' then
      select id into v_recipient_creator_id from public.fans_creators
       where id=v_gift.recipient_id and user_id=v_gift.recipient_user_id for update;
      if v_recipient_creator_id is null then raise exception 'creator recipient not found'; end if;

      insert into public.fans_financial_ledger(
        order_id,payment_id,creator_id,entry_type,direction,amount,currency,status,provider,provider_reference,metadata
      ) values
      (v_order.id,v_payment.id,v_recipient_creator_id,'sale_gross','credit',v_gift.amount,v_order.currency,'posted',p_provider,p_provider_payment_id,
       jsonb_build_object('gift_id',v_gift.id,'product_type','gift')),
      (v_order.id,v_payment.id,v_recipient_creator_id,'provider_fee','debit',v_provider_fee,v_order.currency,'posted',p_provider,p_provider_payment_id,
       jsonb_build_object('gift_id',v_gift.id)),
      (v_order.id,v_payment.id,v_recipient_creator_id,'platform_fee','debit',v_platform_fee,v_order.currency,'posted',p_provider,p_provider_payment_id,
       jsonb_build_object('gift_id',v_gift.id));
    else
      insert into public.ledger_entries(
        user_id,order_id,payment_id,entry_type,amount,currency,description,idempotency_key,metadata
      ) values
      (v_gift.recipient_user_id,v_order.id,v_payment.id,'credit',v_recipient_amount,v_order.currency,
       'Presente recebido pelo Pecatho','gift-recipient:'||v_gift.id,
       jsonb_build_object('gift_id',v_gift.id,'gross_amount',v_gift.amount,'platform_fee',v_platform_fee,
         'provider_fee',v_provider_fee,'recipient_type',v_gift.recipient_type)),
      (v_gift.recipient_user_id,v_order.id,v_payment.id,'fee',v_platform_fee+v_provider_fee,v_order.currency,
       'Taxas do presente Pecatho','gift-fees:'||v_gift.id,
       jsonb_build_object('gift_id',v_gift.id,'platform_fee',v_platform_fee,'provider_fee',v_provider_fee));
    end if;

    return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',v_order.id,
      'gift_id',v_gift.id,'recipient_amount',v_recipient_amount);
  end if;

  if p_payment_status in ('refunded','chargeback') then
    if v_payment.status in ('refunded','chargeback') then
      return jsonb_build_object('ok',true,'idempotent',true,'status',v_payment.status,'order_id',v_order.id,'gift_id',v_gift.id);
    end if;

    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;
    update public.pecatho_gifts set status=p_payment_status,updated_at=now() where id=v_gift.id;

    if v_gift.recipient_type='creator' then
      if not exists(select 1 from public.fans_financial_ledger where order_id=v_order.id and metadata->>'gift_id'=v_gift.id::text and entry_type='refund_creator_credit') then
        insert into public.fans_financial_ledger(order_id,payment_id,creator_id,entry_type,direction,amount,currency,status,provider,provider_reference,metadata)
        values(v_order.id,v_payment.id,v_gift.recipient_id,'refund_gross','debit',v_gift.amount,v_order.currency,'posted',p_provider,p_provider_payment_id,
          jsonb_build_object('gift_id',v_gift.id,'reason',p_payment_status)),
        (v_order.id,v_payment.id,v_gift.recipient_id,'refund_creator_credit','debit',v_gift.recipient_amount,v_order.currency,'posted',p_provider,p_provider_payment_id,
          jsonb_build_object('gift_id',v_gift.id,'reason',p_payment_status));
      end if;
    else
      if not exists(select 1 from public.ledger_entries where idempotency_key='gift-refund:'||v_gift.id) then
        insert into public.ledger_entries(user_id,order_id,payment_id,entry_type,amount,currency,description,idempotency_key,metadata)
        values(v_gift.recipient_user_id,v_order.id,v_payment.id,'refund',v_gift.recipient_amount,v_order.currency,
          'Estorno de presente Pecatho','gift-refund:'||v_gift.id,jsonb_build_object('gift_id',v_gift.id,'reason',p_payment_status));
      end if;
    end if;

    return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',v_order.id,'gift_id',v_gift.id);
  end if;

  update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
    payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
  update public.orders set status=case when p_payment_status='failed' then 'failed' when p_payment_status='cancelled' then 'cancelled' else 'pending' end,
    updated_at=now() where id=v_order.id;
  update public.pecatho_gifts set status=case when p_payment_status='failed' then 'failed' when p_payment_status='cancelled' then 'cancelled' else 'pending' end,
    updated_at=now() where id=v_gift.id;

  return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',v_order.id,'gift_id',v_gift.id);
end;
$function$;

revoke all on function public.settle_pecatho_gift_checkout(uuid,text,text,payment_status,text,numeric) from public, anon, authenticated;
grant execute on function public.settle_pecatho_gift_checkout(uuid,text,text,payment_status,text,numeric) to service_role;

create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  unique(message_id,user_id,emoji)
);

create index if not exists message_reactions_message_idx on public.message_reactions(message_id,created_at);
alter table public.message_reactions enable row level security;
revoke all on public.message_reactions from anon, authenticated;
grant select,insert,delete on public.message_reactions to authenticated;

drop policy if exists "conversation members can read reactions" on public.message_reactions;
create policy "conversation members can read reactions" on public.message_reactions for select to authenticated
using (exists(select 1 from public.messages m join public.conversation_members cm on cm.conversation_id=m.conversation_id
  where m.id=message_reactions.message_id and cm.user_id=(select auth.uid())));

drop policy if exists "conversation members can react" on public.message_reactions;
create policy "conversation members can react" on public.message_reactions for insert to authenticated
with check (user_id=(select auth.uid()) and exists(select 1 from public.messages m join public.conversation_members cm on cm.conversation_id=m.conversation_id
  where m.id=message_reactions.message_id and cm.user_id=(select auth.uid())));

drop policy if exists "users can remove own reactions" on public.message_reactions;
create policy "users can remove own reactions" on public.message_reactions for delete to authenticated using (user_id=(select auth.uid()));

create or replace function public.notify_pecatho_gift_status()
returns trigger language plpgsql security definer set search_path=pg_catalog,public
as $function$
begin
  if new.status is distinct from old.status then
    if new.status='paid' then
      insert into public.fans_notifications(user_id,type,title,body,data,event_key)
      values
      (new.buyer_user_id,'gift_sent','Presente enviado','Seu presente foi confirmado pelo Pecatho.',
       jsonb_build_object('gift_id',new.id,'recipient_type',new.recipient_type,'recipient_id',new.recipient_id,'amount',new.amount),
       'pecatho-gift:'||new.id||':buyer:paid'),
      (new.recipient_user_id,'gift_received','Você recebeu um presente','Um cliente enviou um presente pelo Pecatho.',
       jsonb_build_object('gift_id',new.id,'amount',new.amount,'recipient_amount',new.recipient_amount,'message',new.message),
       'pecatho-gift:'||new.id||':recipient:paid')
      on conflict do nothing;
    elsif new.status in ('refunded','chargeback') then
      insert into public.fans_notifications(user_id,type,title,body,data,event_key)
      values
      (new.buyer_user_id,'gift_refunded','Presente estornado','O pagamento do presente foi estornado.',
       jsonb_build_object('gift_id',new.id,'status',new.status),
       'pecatho-gift:'||new.id||':buyer:'||new.status),
      (new.recipient_user_id,'gift_refunded','Presente estornado','Um presente recebido foi estornado.',
       jsonb_build_object('gift_id',new.id,'status',new.status),
       'pecatho-gift:'||new.id||':recipient:'||new.status)
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists pecatho_gift_status_notify on public.pecatho_gifts;
create trigger pecatho_gift_status_notify after update of status on public.pecatho_gifts
for each row execute function public.notify_pecatho_gift_status();

revoke all on function public.notify_pecatho_gift_status() from public, anon, authenticated;
grant execute on function public.notify_pecatho_gift_status() to service_role;
