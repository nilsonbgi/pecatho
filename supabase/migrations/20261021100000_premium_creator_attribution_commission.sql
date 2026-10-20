-- Attribute Premium conversions to the creator whose profile sent the visitor.
-- Commission is posted atomically with entitlement activation and reversed idempotently
-- when the Premium payment is refunded or charged back.

alter table public.pecatho_customer_premium_subscriptions
  add column if not exists attributed_creator_id uuid
  references public.fans_creators(id) on delete set null;

create index if not exists pecatho_customer_premium_creator_attribution_idx
  on public.pecatho_customer_premium_subscriptions(attributed_creator_id, status, created_at desc)
  where attributed_creator_id is not null;

drop function if exists public.create_pecatho_customer_premium_checkout(uuid);

create function public.create_pecatho_customer_premium_checkout(
  p_plan_id uuid,
  p_creator_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_creator public.fans_creators%rowtype;
  v_order uuid;
  v_order_number text;
  v_subscription uuid;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not exists(select 1 from public.profiles where id=v_user and account_type='customer') then
    raise exception 'CUSTOMER_ACCOUNT_REQUIRED';
  end if;
  select * into v_plan from public.pecatho_customer_premium_plans
    where id=p_plan_id and active=true for share;
  if not found then raise exception 'PREMIUM_PLAN_UNAVAILABLE'; end if;

  if p_creator_id is not null then
    select * into v_creator from public.fans_creators
      where id=p_creator_id and status='active' and user_id<>v_user;
    if not found then raise exception 'PREMIUM_ATTRIBUTION_CREATOR_INVALID'; end if;
  end if;

  v_order_number := 'PEC-PREM-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  insert into public.orders(order_number,user_id,status,subtotal,discount,fee,total,currency,metadata)
  values(v_order_number,v_user,'awaiting_payment',v_plan.price,0,0,v_plan.price,'BRL',
    jsonb_build_object('source','pecatho','kind','customer_premium','product_type','premium_subscription',
      'product_id',v_plan.id,'plan_key',v_plan.plan_key,'title',v_plan.name,'duration_days',v_plan.duration_days,
      'attribution_source',case when p_creator_id is not null then 'creator_profile' else null end,
      'attributed_creator_id',p_creator_id))
  returning id into v_order;

  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',v_plan.price,'BRL','pending','pending','{}'::jsonb);

  insert into public.pecatho_customer_premium_subscriptions(
    user_id,plan_id,order_id,paid_amount,currency,status,attributed_creator_id
  ) values(v_user,v_plan.id,v_order,v_plan.price,'BRL','pending',p_creator_id)
  returning id into v_subscription;

  return jsonb_build_object('subscription_id',v_subscription,'order_id',v_order,'order_number',v_order_number,
    'plan_id',v_plan.id,'amount',v_plan.price,'currency','BRL','status','pending',
    'attributed_creator_id',p_creator_id);
end;
$function$;

revoke all on function public.create_pecatho_customer_premium_checkout(uuid,uuid) from public, anon;
grant execute on function public.create_pecatho_customer_premium_checkout(uuid,uuid) to authenticated;

create or replace function public.post_pecatho_premium_creator_commission()
returns trigger
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_creator_user_id uuid;
  v_payment_id uuid;
  v_commission numeric(12,2);
  v_entry_type public.ledger_entry_type;
  v_key text;
  v_description text;
  v_metadata jsonb;
begin
  if new.attributed_creator_id is null then return new; end if;

  if new.status='active' and old.status is distinct from 'active' then
    select c.user_id into v_creator_user_id
      from public.fans_creators c
      where c.id=new.attributed_creator_id and c.user_id is not null;
    if v_creator_user_id is null then return new; end if;
    select p.id into v_payment_id from public.payments p
      where p.order_id=new.order_id and p.status='paid'
      order by p.created_at desc limit 1;
    v_commission := round(new.paid_amount * 0.30, 2);
    if v_commission > 0 then
      insert into public.ledger_entries(
        user_id,order_id,payment_id,entry_type,amount,currency,balance_after,
        description,idempotency_key,metadata
      )
      select v_creator_user_id,new.order_id,v_payment_id,'credit'::public.ledger_entry_type,
        v_commission,new.currency,
        coalesce(sum(case when le.entry_type in ('credit','adjustment') then le.amount else -le.amount end),0)+v_commission,
        'Comissão de 30% por conversão Premium originada no perfil',
        'premium-creator-commission:'||new.id::text,
        jsonb_build_object('source','pecatho','kind','premium_creator_commission',
          'subscription_id',new.id,'creator_id',new.attributed_creator_id,
          'gross_amount',new.paid_amount,'commission_percent',30,'commission_amount',v_commission)
      from public.ledger_entries le where le.user_id=v_creator_user_id
      on conflict (idempotency_key) do nothing;
    end if;
  elsif old.status='active' and new.status in ('refunded','chargeback') then
    select c.user_id into v_creator_user_id
      from public.fans_creators c
      where c.id=new.attributed_creator_id and c.user_id is not null;
    if v_creator_user_id is null then return new; end if;
    v_commission := round(new.paid_amount * 0.30, 2);
    v_entry_type := case when new.status='chargeback'
      then 'chargeback'::public.ledger_entry_type else 'refund'::public.ledger_entry_type end;
    v_key := 'premium-creator-commission-reversal:'||new.id::text||':'||new.status;
    v_description := case when new.status='chargeback'
      then 'Estorno da comissão Premium por chargeback'
      else 'Estorno da comissão Premium por reembolso' end;
    v_metadata := jsonb_build_object('source','pecatho','kind','premium_creator_commission_reversal',
      'subscription_id',new.id,'creator_id',new.attributed_creator_id,
      'commission_amount_reversed',v_commission,'payment_status',new.status);
    select p.id into v_payment_id from public.payments p
      where p.order_id=new.order_id order by p.created_at desc limit 1;
    insert into public.ledger_entries(
      user_id,order_id,payment_id,entry_type,amount,currency,balance_after,
      description,idempotency_key,metadata
    )
    select v_creator_user_id,new.order_id,v_payment_id,v_entry_type,
      v_commission,new.currency,
      coalesce(sum(case when le.entry_type in ('credit','adjustment') then le.amount else -le.amount end),0)-v_commission,
      v_description,v_key,v_metadata
    from public.ledger_entries le where le.user_id=v_creator_user_id
    on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$function$;

drop trigger if exists pecatho_premium_creator_commission_trigger
  on public.pecatho_customer_premium_subscriptions;
create trigger pecatho_premium_creator_commission_trigger
  after update of status on public.pecatho_customer_premium_subscriptions
  for each row execute function public.post_pecatho_premium_creator_commission();

revoke all on function public.post_pecatho_premium_creator_commission() from public, anon, authenticated;
