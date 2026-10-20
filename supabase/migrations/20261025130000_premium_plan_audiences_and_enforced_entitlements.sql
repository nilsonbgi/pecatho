-- Segmented Premium catalog with paid, time-bound professional entitlements.
alter table public.pecatho_customer_premium_plans
  add column if not exists audience text not null default 'customer',
  add column if not exists feature_flags jsonb not null default '{}'::jsonb,
  add column if not exists card_style text not null default 'standard',
  add column if not exists badge_label text;

alter table public.pecatho_customer_premium_plans
  drop constraint if exists pecatho_customer_premium_plans_audience_check;
alter table public.pecatho_customer_premium_plans
  add constraint pecatho_customer_premium_plans_audience_check
  check (audience in ('customer','companion','content_creator'));
alter table public.pecatho_customer_premium_plans
  drop constraint if exists pecatho_customer_premium_plans_feature_flags_object_check;
alter table public.pecatho_customer_premium_plans
  add constraint pecatho_customer_premium_plans_feature_flags_object_check
  check (jsonb_typeof(feature_flags) = 'object');
alter table public.pecatho_customer_premium_plans
  drop constraint if exists pecatho_customer_premium_plans_card_style_check;
alter table public.pecatho_customer_premium_plans
  add constraint pecatho_customer_premium_plans_card_style_check
  check (card_style in ('standard','gold','obsidian','signature'));

-- Existing customer Premium plans keep their established private-contact entitlement.
update public.pecatho_customer_premium_plans
set feature_flags = coalesce(feature_flags,'{}'::jsonb) || '{"private_seller_contact":true}'::jsonb,
    audience = 'customer'
where audience = 'customer';

-- Freeze each customer's paid feature set at purchase time.
alter table public.pecatho_customer_premium_subscriptions
  add column if not exists feature_flags jsonb not null default '{}'::jsonb,
  add column if not exists card_style text not null default 'standard',
  add column if not exists badge_label text,
  add column if not exists plan_name text,
  add column if not exists duration_days integer not null default 30,
  add column if not exists benefits jsonb not null default '[]'::jsonb,
  add column if not exists plan_description text;

update public.pecatho_customer_premium_subscriptions s
set feature_flags=pl.feature_flags, card_style=pl.card_style, badge_label=pl.badge_label,
    plan_name=pl.name, duration_days=pl.duration_days, benefits=pl.benefits,
    plan_description=pl.description
from public.pecatho_customer_premium_plans pl
where pl.id=s.plan_id and s.plan_name is null;

create index if not exists pecatho_premium_plan_audience_active_idx
  on public.pecatho_customer_premium_plans(audience, active, sort_order, price);

create table if not exists public.pecatho_professional_premium_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  audience text not null check (audience in ('companion','content_creator')),
  plan_id uuid not null references public.pecatho_customer_premium_plans(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending','active','expired','cancelled','refunded','chargeback')),
  starts_at timestamptz,
  ends_at timestamptz,
  paid_amount numeric(12,2) not null check (paid_amount > 0),
  currency char(3) not null default 'BRL' check (currency = 'BRL'),
  feature_flags jsonb not null default '{}'::jsonb,
  card_style text not null default 'standard',
  badge_label text,
  plan_name text,
  duration_days integer not null check (duration_days in (30,90,180,365)),
  benefits jsonb not null default '[]'::jsonb,
  plan_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status <> 'active') or (starts_at is not null and ends_at is not null and ends_at > starts_at))
);

create index if not exists pecatho_professional_premium_user_status_idx
  on public.pecatho_professional_premium_subscriptions(user_id,audience,status,ends_at desc);
create index if not exists pecatho_professional_premium_plan_idx
  on public.pecatho_professional_premium_subscriptions(plan_id,status,ends_at desc);

alter table public.pecatho_professional_premium_subscriptions enable row level security;
revoke all on public.pecatho_professional_premium_subscriptions from anon, authenticated;
grant select on public.pecatho_professional_premium_subscriptions to authenticated;
drop policy if exists pecatho_professional_premium_owner_select on public.pecatho_professional_premium_subscriptions;
create policy pecatho_professional_premium_owner_select
  on public.pecatho_professional_premium_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

-- Extended admin save function: validates entitlements and prevents changing a plan's audience
-- after the plan has been used by a subscription.
create or replace function public.admin_save_pecatho_customer_premium_plan(
  p_plan_id uuid,
  p_plan_key text,
  p_name text,
  p_description text,
  p_price numeric,
  p_duration_days integer,
  p_benefits jsonb,
  p_active boolean,
  p_audience text,
  p_feature_flags jsonb,
  p_card_style text,
  p_badge_label text,
  p_sort_order integer
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_key text := lower(trim(coalesce(p_plan_key,'')));
  v_name text := trim(coalesce(p_name,''));
  v_benefits jsonb := coalesce(p_benefits,'[]'::jsonb);
  v_features jsonb := coalesce(p_feature_flags,'{}'::jsonb);
  v_audience text := lower(trim(coalesce(p_audience,'')));
  v_style text := lower(trim(coalesce(p_card_style,'standard')));
  v_badge text := nullif(trim(coalesce(p_badge_label,'')),'');
begin
  if v_user is null or not exists (
    select 1 from public.user_roles ur where ur.user_id=v_user and ur.role in ('super_admin','admin')
  ) then raise exception 'ADMIN_REQUIRED'; end if;
  if v_key !~ '^[a-z0-9][a-z0-9_-]{1,49}$' then raise exception 'INVALID_PLAN_KEY'; end if;
  if char_length(v_name) not between 3 and 100 then raise exception 'INVALID_PLAN_NAME'; end if;
  if p_price is null or p_price <= 0 or p_price > 10000 then raise exception 'INVALID_PLAN_PRICE'; end if;
  if v_audience not in ('customer','companion','content_creator') then raise exception 'INVALID_PLAN_AUDIENCE'; end if;
  if p_duration_days is null or p_duration_days not in (30,90,180,365) then raise exception 'INVALID_PLAN_DURATION'; end if;
  if jsonb_typeof(v_benefits) <> 'array' or jsonb_array_length(v_benefits) > 20 then raise exception 'INVALID_PLAN_BENEFITS'; end if;
  if exists(select 1 from jsonb_array_elements(v_benefits) as item(value)
    where jsonb_typeof(item.value) <> 'string' or char_length(trim(item.value #>> '{}')) not between 1 and 240) then
    raise exception 'INVALID_PLAN_BENEFIT_ITEM';
  end if;
  if jsonb_typeof(v_features) <> 'object' then raise exception 'INVALID_PLAN_FEATURE_FLAGS'; end if;
  if exists (
    select 1 from jsonb_each(v_features) f(key,value)
    where f.key not in ('private_seller_contact','featured_card','search_priority','premium_profile','profile_badge')
       or jsonb_typeof(f.value) <> 'boolean'
  ) then raise exception 'INVALID_PLAN_FEATURE_FLAGS'; end if;
  if v_style not in ('standard','gold','obsidian','signature') then raise exception 'INVALID_PLAN_CARD_STYLE'; end if;
  if v_badge is not null and char_length(v_badge) not between 2 and 32 then raise exception 'INVALID_PLAN_BADGE_LABEL'; end if;
  if coalesce((v_features->>'profile_badge')::boolean,false) and v_badge is null then raise exception 'PREMIUM_BADGE_LABEL_REQUIRED'; end if;
  if v_audience <> 'customer' and coalesce((v_features->>'private_seller_contact')::boolean,false) then raise exception 'CUSTOMER_FEATURE_ONLY'; end if;
  if v_audience = 'customer' and (coalesce((v_features->>'featured_card')::boolean,false) or coalesce((v_features->>'search_priority')::boolean,false) or coalesce((v_features->>'premium_profile')::boolean,false) or coalesce((v_features->>'profile_badge')::boolean,false)) then
    raise exception 'PROFESSIONAL_FEATURE_ONLY';
  end if;
  if coalesce(p_active,false) and v_audience='customer' and not coalesce((v_features->>'private_seller_contact')::boolean,false) then
    raise exception 'PREMIUM_PLAN_NEEDS_OPERATIONAL_FEATURE';
  end if;
  if coalesce(p_active,false) and v_audience in ('companion','content_creator')
    and not (coalesce((v_features->>'featured_card')::boolean,false)
      or coalesce((v_features->>'search_priority')::boolean,false)
      or coalesce((v_features->>'premium_profile')::boolean,false)
      or coalesce((v_features->>'profile_badge')::boolean,false)) then
    raise exception 'PREMIUM_PLAN_NEEDS_OPERATIONAL_FEATURE';
  end if;

  if p_plan_id is not null then
    select * into v_plan from public.pecatho_customer_premium_plans where id=p_plan_id for update;
    if not found then raise exception 'PREMIUM_PLAN_NOT_FOUND'; end if;
    if v_plan.audience <> v_audience and (
      exists(select 1 from public.pecatho_customer_premium_subscriptions where plan_id=p_plan_id)
      or exists(select 1 from public.pecatho_professional_premium_subscriptions where plan_id=p_plan_id)
    ) then raise exception 'PLAN_AUDIENCE_LOCKED'; end if;
  end if;

  if p_plan_id is null then
    insert into public.pecatho_customer_premium_plans
      (plan_key,name,description,price,currency,duration_days,benefits,active,sort_order,audience,feature_flags,card_style,badge_label,updated_at)
    values(v_key,v_name,nullif(trim(coalesce(p_description,'')),''),round(p_price,2),'BRL',p_duration_days,v_benefits,
      coalesce(p_active,false),greatest(coalesce(p_sort_order,0),0),v_audience,v_features,v_style,v_badge,now())
    returning * into v_plan;
  else
    update public.pecatho_customer_premium_plans set
      plan_key=v_key,name=v_name,description=nullif(trim(coalesce(p_description,'')),''),price=round(p_price,2),
      duration_days=p_duration_days,benefits=v_benefits,active=coalesce(p_active,false),
      sort_order=greatest(coalesce(p_sort_order,0),0),audience=v_audience,feature_flags=v_features,
      card_style=v_style,badge_label=v_badge,updated_at=now()
    where id=p_plan_id returning * into v_plan;
  end if;

  return jsonb_build_object('id',v_plan.id,'plan_key',v_plan.plan_key,'name',v_plan.name,
    'audience',v_plan.audience,'price',v_plan.price,'duration_days',v_plan.duration_days,
    'active',v_plan.active,'feature_flags',v_plan.feature_flags);
end;
$function$;

revoke all on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,jsonb,boolean,text,jsonb,text,text,integer) from public, anon;
grant execute on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,jsonb,boolean,text,jsonb,text,text,integer) to authenticated;

create or replace function public.create_pecatho_professional_premium_checkout(p_plan_id uuid)
returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_order uuid;
  v_order_number text;
  v_payment uuid;
  v_subscription uuid;
  v_has_profile boolean := false;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select * into v_plan from public.pecatho_customer_premium_plans
    where id=p_plan_id and active=true and audience in ('companion','content_creator') for share;
  if not found then raise exception 'PROFESSIONAL_PREMIUM_PLAN_UNAVAILABLE'; end if;

  if v_plan.audience='companion' then
    select exists(select 1 from public.advertiser_profiles where user_id=v_user and status::text='published') into v_has_profile;
  else
    select exists(select 1 from public.fans_creators where user_id=v_user and status='active') into v_has_profile;
  end if;
  if not v_has_profile then raise exception 'ACTIVE_PROFILE_REQUIRED'; end if;

  if exists(select 1 from public.pecatho_professional_premium_subscriptions
    where user_id=v_user and audience=v_plan.audience and status='pending') then
    raise exception 'PROFESSIONAL_PREMIUM_CHECKOUT_PENDING';
  end if;

  v_order_number := 'PEC-PRO-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  insert into public.orders(order_number,user_id,status,subtotal,discount,fee,total,currency,metadata)
  values(v_order_number,v_user,'awaiting_payment',v_plan.price,0,0,v_plan.price,'BRL',
    jsonb_build_object('source','pecatho','kind','professional_premium','product_type','professional_premium_subscription',
      'product_id',v_plan.id,'plan_id',v_plan.id,'plan_key',v_plan.plan_key,'audience',v_plan.audience,
      'title',v_plan.name,'duration_days',v_plan.duration_days))
  returning id into v_order;

  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',v_plan.price,'BRL','pending','pending',
    jsonb_build_object('channel','pecatho_professional_premium','audience',v_plan.audience,'plan_id',v_plan.id))
  returning id into v_payment;

  insert into public.pecatho_professional_premium_subscriptions(
    user_id,audience,plan_id,order_id,paid_amount,currency,status,feature_flags,card_style,badge_label,plan_name,duration_days,benefits,plan_description
  ) values(v_user,v_plan.audience,v_plan.id,v_order,v_plan.price,'BRL','pending',
    v_plan.feature_flags,v_plan.card_style,v_plan.badge_label,v_plan.name,v_plan.duration_days,v_plan.benefits,v_plan.description) returning id into v_subscription;

  return jsonb_build_object('subscription_id',v_subscription,'order_id',v_order,'order_number',v_order_number,
    'plan_id',v_plan.id,'audience',v_plan.audience,'amount',v_plan.price,'currency','BRL','status','pending');
end;
$function$;

revoke all on function public.create_pecatho_professional_premium_checkout(uuid) from public, anon;
grant execute on function public.create_pecatho_professional_premium_checkout(uuid) to authenticated;

create or replace function public.settle_pecatho_professional_premium_checkout(
  p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status,
  p_payment_method text default null, p_provider_fee numeric default 0
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_subscription public.pecatho_professional_premium_subscriptions%rowtype;
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_start timestamptz;
  v_end timestamptz;
begin
  if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null then
    raise exception 'INVALID_PROFESSIONAL_PREMIUM_SETTLEMENT';
  end if;
  if coalesce(p_provider_fee,0) < 0 then raise exception 'INVALID_PROVIDER_FEE'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.metadata->>'product_type' <> 'professional_premium_subscription' then raise exception 'PROFESSIONAL_PREMIUM_ORDER_NOT_FOUND'; end if;
  select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  select * into v_subscription from public.pecatho_professional_premium_subscriptions where order_id=p_order_id for update;
  if not found then raise exception 'PROFESSIONAL_PREMIUM_SUBSCRIPTION_NOT_FOUND'; end if;
  select * into v_plan from public.pecatho_customer_premium_plans where id=v_subscription.plan_id and audience=v_subscription.audience;
  if not found then raise exception 'PROFESSIONAL_PREMIUM_PLAN_NOT_FOUND'; end if;
  if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then raise exception 'INVALID_PAYMENT_STATE_TRANSITION'; end if;
  if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then
    return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,'subscription_id',v_subscription.id,'ends_at',v_subscription.ends_at);
  end if;
  if p_payment_status='paid' then
    select greatest(now(),coalesce(max(ends_at),now())) into v_start
      from public.pecatho_professional_premium_subscriptions
      where user_id=v_subscription.user_id and audience=v_subscription.audience and status='active' and ends_at>now();
    v_end := v_start + make_interval(days => v_subscription.duration_days);
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',
      payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,0),2),paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
    update public.orders set status='paid',updated_at=now() where id=v_order.id;
    update public.pecatho_professional_premium_subscriptions set status='active',starts_at=v_start,ends_at=v_end,updated_at=now()
      where id=v_subscription.id;
    return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,'subscription_id',v_subscription.id,'starts_at',v_start,'ends_at',v_end);
  end if;
  if p_payment_status in ('refunded','chargeback') then
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,provider_fee,0),2),updated_at=now() where id=v_payment.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;
    update public.pecatho_professional_premium_subscriptions set status=p_payment_status,updated_at=now() where id=v_subscription.id;
  else
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,provider_fee,0),2),updated_at=now() where id=v_payment.id;
    update public.orders set status=case when p_payment_status='failed' then 'failed' when p_payment_status='cancelled' then 'cancelled' else 'awaiting_payment' end,
      updated_at=now() where id=v_order.id;
    update public.pecatho_professional_premium_subscriptions set status=case when p_payment_status in ('failed','cancelled') then 'cancelled' else 'pending' end,
      updated_at=now() where id=v_subscription.id;
  end if;
  return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id,'subscription_id',v_subscription.id);
end;
$function$;

revoke all on function public.settle_pecatho_professional_premium_checkout(uuid,text,text,payment_status,text,numeric) from public, anon, authenticated;
grant execute on function public.settle_pecatho_professional_premium_checkout(uuid,text,text,payment_status,text,numeric) to service_role;

-- Only the currently effective, public-facing feature set is exposed to visitors.
create or replace function public.get_public_professional_plan_features(p_entity_ids uuid[], p_audience text)
returns table (
  entity_id uuid,
  featured_card boolean,
  search_priority boolean,
  premium_profile boolean,
  profile_badge boolean,
  card_style text,
  badge_label text
)
language sql stable security definer set search_path = pg_catalog, public
as $function$
  with candidates as (
    select ap.id as entity_id, s.feature_flags, s.card_style, s.badge_label, s.ends_at
    from public.advertiser_profiles ap
    join public.pecatho_professional_premium_subscriptions s on s.user_id=ap.user_id
      and s.audience='companion' and s.status='active' and s.starts_at<=now() and s.ends_at>now()
    join public.pecatho_customer_premium_plans pl on pl.id=s.plan_id and pl.audience='companion'
    where p_audience='companion' and ap.id=any(coalesce(p_entity_ids,'{}'::uuid[])) and ap.status::text='published'
    union all
    select c.id as entity_id, s.feature_flags, s.card_style, s.badge_label, s.ends_at
    from public.fans_creators c
    join public.pecatho_professional_premium_subscriptions s on s.user_id=c.user_id
      and s.audience='content_creator' and s.status='active' and s.starts_at<=now() and s.ends_at>now()
    join public.pecatho_customer_premium_plans pl on pl.id=s.plan_id and pl.audience='content_creator'
    where p_audience='content_creator' and c.id=any(coalesce(p_entity_ids,'{}'::uuid[])) and c.status='active'
  ), latest as (
    select distinct on (entity_id) * from candidates order by entity_id, ends_at desc
  )
  select l.entity_id,
    coalesce((l.feature_flags->>'featured_card')::boolean,false),
    coalesce((l.feature_flags->>'search_priority')::boolean,false),
    coalesce((l.feature_flags->>'premium_profile')::boolean,false),
    coalesce((l.feature_flags->>'profile_badge')::boolean,false),
    l.card_style, l.badge_label
  from latest l;
$function$;

revoke all on function public.get_public_professional_plan_features(uuid[],text) from public;
grant execute on function public.get_public_professional_plan_features(uuid[],text) to anon, authenticated;

-- Keep the current public search result contract while ranking paid search priority first
-- whenever the visitor uses the default/recent ordering.
-- Align the public advertiser search RPC with the current catalog UI.
-- Preserve the existing overload for compatibility; the frontend calls this exact
-- 14-argument signature and needs location, pricing and total-count fields.
drop function if exists public.search_public_advertisers(
  bigint, bigint, bigint, text, jsonb, text[],
  integer, integer, numeric, numeric, integer, integer
);

drop function if exists public.search_public_advertisers(
  bigint, bigint, bigint, text, jsonb, text[],
  integer, integer, numeric, numeric, integer, text, integer, integer
);

create function public.search_public_advertisers(
  p_category_id bigint default null,
  p_state_id bigint default null,
  p_city_id bigint default null,
  p_query text default null,
  p_attribute_filters jsonb default '{}'::jsonb,
  p_service_slugs text[] default '{}',
  p_age_min integer default null,
  p_age_max integer default null,
  p_price_min numeric default null,
  p_price_max numeric default null,
  p_duration_minutes integer default null,
  p_sort text default 'recent',
  p_limit integer default 48,
  p_offset integer default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  display_name text,
  summary text,
  city_id bigint,
  state_id bigint,
  category_id bigint,
  verification_status text,
  pricing jsonb,
  city_name text,
  state_uf text,
  total_count bigint
)
language sql
security definer
set search_path = pg_catalog, public
stable
as $$
  with matching_profiles as (
    select
      ap.id,
      ap.slug::text as slug,
      ap.title,
      ap.display_name,
      ap.summary,
      ap.city_id::bigint as city_id,
      ap.state_id::bigint as state_id,
      ap.category_id::bigint as category_id,
      ap.verification_status::text as verification_status,
      ap.pricing,
      c.name::text as city_name,
      s.uf::text as state_uf,
      ap.created_at,
      prices.minimum_price
    from public.advertiser_profiles ap
    left join public.cities c on c.id = ap.city_id
    left join public.states s on s.id = ap.state_id
    left join lateral (
      select min((period.value->>'price')::numeric) as minimum_price
      from jsonb_array_elements(
        case when jsonb_typeof(ap.pricing->'periods') = 'array'
          then ap.pricing->'periods' else '[]'::jsonb end
      ) as period(value)
      where jsonb_typeof(period.value->'price') in ('number', 'string')
        and (period.value->>'price') ~ '^([0-9]+([.][0-9]+)?|[.][0-9]+)$'
    ) prices on true
    where ap.status::text = 'published'
      and (p_category_id is null or ap.category_id = p_category_id)
      and (p_state_id is null or ap.state_id = p_state_id)
      and (p_city_id is null or ap.city_id = p_city_id)
      and (
        nullif(trim(coalesce(p_query, '')), '') is null
        or ap.title ilike '%' || replace(replace(trim(p_query), '%', '\\%'), '_', '\\_') || '%' escape '\\'
        or ap.display_name ilike '%' || replace(replace(trim(p_query), '%', '\\%'), '_', '\\_') || '%' escape '\\'
        or ap.summary ilike '%' || replace(replace(trim(p_query), '%', '\\%'), '_', '\\_') || '%' escape '\\'
      )
      and (p_age_min is null or (p_age_min between 18 and 120 and ap.birth_date <= (current_date - make_interval(years => p_age_min))::date))
      and (p_age_max is null or (p_age_max between 18 and 120 and ap.birth_date > (current_date - make_interval(years => p_age_max + 1))::date))
      and (p_age_min is null or p_age_max is null or p_age_min <= p_age_max)
      and (p_price_min is null or p_price_min >= 0)
      and (p_price_max is null or p_price_max >= 0)
      and (
        p_price_min is null or exists (
          select 1
          from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods') = 'array' then ap.pricing->'periods' else '[]'::jsonb end) as period(value)
          where jsonb_typeof(period.value->'price') in ('number', 'string')
            and (period.value->>'price') ~ '^([0-9]+([.][0-9]+)?|[.][0-9]+)$'
            and (period.value->>'price')::numeric >= p_price_min
        )
      )
      and (
        p_price_max is null or exists (
          select 1
          from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods') = 'array' then ap.pricing->'periods' else '[]'::jsonb end) as period(value)
          where jsonb_typeof(period.value->'price') in ('number', 'string')
            and (period.value->>'price') ~ '^([0-9]+([.][0-9]+)?|[.][0-9]+)$'
            and (period.value->>'price')::numeric <= p_price_max
        )
      )
      and (
        p_duration_minutes is null or exists (
          select 1
          from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods') = 'array' then ap.pricing->'periods' else '[]'::jsonb end) as period(value)
          where (period.value->>'minutes') ~ '^[0-9]+$'
            and (period.value->>'minutes')::integer = p_duration_minutes
        )
      )
      and not exists (
        select 1
        from jsonb_each(case when jsonb_typeof(p_attribute_filters) = 'object' then p_attribute_filters else '{}'::jsonb end) as filter(slug, wanted)
        where not exists (
          select 1
          from public.profile_attribute_values pav
          join public.category_attributes ca on ca.id = pav.attribute_id
          where pav.profile_id = ap.id
            and ca.category_id = ap.category_id
            and ca.slug = filter.slug
            and ca.display_public = true
            and (
              pav.value = filter.wanted
              or (jsonb_typeof(filter.wanted) = 'array' and jsonb_typeof(pav.value) = 'array' and pav.value @> filter.wanted)
              or (jsonb_typeof(pav.value) = 'array' and pav.value @> jsonb_build_array(filter.wanted))
            )
        )
      )
      and not exists (
        select 1
        from unnest(coalesce(p_service_slugs, '{}'::text[])) as wanted(slug)
        where not exists (
          select 1
          from public.profile_services ps
          join public.category_services cs on cs.id = ps.service_id
          where ps.profile_id = ap.id
            and ps.selected = true
            and cs.category_id = ap.category_id
            and cs.slug = wanted.slug
            and cs.display_public = true
        )
      )
  )
  select
    mp.id, mp.slug, mp.title, mp.display_name, mp.summary,
    mp.city_id, mp.state_id, mp.category_id, mp.verification_status,
    mp.pricing, mp.city_name, mp.state_uf,
    count(*) over () as total_count
  from matching_profiles mp
  order by
    case when coalesce(p_sort, 'recent') not in ('price_asc','price_desc','name') and exists (
      select 1
      from public.advertiser_profiles premium_profile
      join public.pecatho_professional_premium_subscriptions premium_sub
        on premium_sub.user_id = premium_profile.user_id
       and premium_sub.audience = 'companion'
       and premium_sub.status = 'active'
       and premium_sub.starts_at <= now()
       and premium_sub.ends_at > now()
      join public.pecatho_customer_premium_plans premium_plan
        on premium_plan.id = premium_sub.plan_id
       and premium_plan.audience = 'companion'
      where premium_sub.feature_flags @> '{"search_priority":true}'::jsonb
        and premium_profile.id = mp.id and premium_profile.status::text = 'published'
    ) then 0 else 1 end,
    case when p_sort = 'price_asc' then mp.minimum_price end asc nulls last,
    case when p_sort = 'price_desc' then mp.minimum_price end desc nulls last,
    case when p_sort = 'name' then lower(coalesce(mp.display_name, mp.title, '')) end asc nulls last,
    mp.created_at desc
  limit greatest(1, least(coalesce(p_limit, 48), 100))
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.search_public_advertisers(
  bigint, bigint, bigint, text, jsonb, text[],
  integer, integer, numeric, numeric, integer, text, integer, integer
) from public, anon, authenticated;
grant execute on function public.search_public_advertisers(
  bigint, bigint, bigint, text, jsonb, text[],
  integer, integer, numeric, numeric, integer, text, integer, integer
) to anon, authenticated;


-- Paid professional subscriptions receive top placement in the Fans creator discovery ranking.
-- Public, aggregated Fans leaderboard. Never exposes reaction/comment identities.
create or replace function public.get_public_fans_creator_leaderboard(p_limit integer default 24)
returns table (
  id uuid,
  slug text,
  display_name text,
  bio text,
  avatar_url text,
  reputation_score bigint,
  reputation_level text,
  positive_likes bigint,
  visible_comments bigint,
  positive_reactions bigint
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  with eligible_creators as (
    select c.id, c.user_id, c.slug, c.display_name, c.bio, c.avatar_url, c.created_at
    from public.fans_creators c
    where c.status = 'active'
  ),
  published_posts as (
    select p.id, p.creator_id
    from public.fans_posts p
    join eligible_creators c on c.id = p.creator_id
    where p.status = 'published'
  ),
  likes_by_creator as (
    select p.creator_id, count(*)::bigint as total
    from published_posts p
    join public.fans_likes l on l.post_id = p.id
    join eligible_creators c on c.id = p.creator_id
    where c.user_id is null or l.user_id <> c.user_id
    group by p.creator_id
  ),
  comments_by_creator as (
    select p.creator_id, count(*)::bigint as total
    from published_posts p
    join public.fans_comments cm on cm.post_id = p.id
    join eligible_creators c on c.id = p.creator_id
    where cm.status = 'visible'
      and (c.user_id is null or cm.user_id <> c.user_id)
    group by p.creator_id
  ),
  reactions_by_creator as (
    select p.creator_id, count(*)::bigint as total
    from published_posts p
    join public.fans_post_reactions r on r.post_id = p.id
    join eligible_creators c on c.id = p.creator_id
    where c.user_id is null or r.user_id <> c.user_id
    group by p.creator_id
  ),
  scored as (
    select c.id, c.slug, c.display_name, c.bio, c.avatar_url, c.created_at,
      coalesce(l.total, 0)::bigint as likes,
      coalesce(cm.total, 0)::bigint as comments,
      coalesce(r.total, 0)::bigint as reactions,
      (coalesce(l.total, 0) + coalesce(cm.total, 0) * 2 + coalesce(r.total, 0))::bigint as score
    from eligible_creators c
    left join likes_by_creator l on l.creator_id = c.id
    left join comments_by_creator cm on cm.creator_id = c.id
    left join reactions_by_creator r on r.creator_id = c.id
  )
  select s.id, s.slug, s.display_name, s.bio, s.avatar_url, s.score,
    case
      when s.score >= 1000 then 'Ícone'
      when s.score >= 300 then 'Destaque'
      when s.score >= 100 then 'Popular'
      when s.score >= 25 then 'Em ascensão'
      else 'Iniciante'
    end,
    s.likes, s.comments, s.reactions
  from scored s
  order by
    case when exists (
      select 1
      from public.pecatho_professional_premium_subscriptions premium_sub
      join public.pecatho_customer_premium_plans premium_plan
        on premium_plan.id = premium_sub.plan_id
       and premium_plan.audience = 'content_creator'
      where premium_sub.feature_flags @> '{"search_priority":true}'::jsonb
        and premium_sub.user_id = (select c2.user_id from public.fans_creators c2 where c2.id = s.id)
        and premium_sub.audience = 'content_creator'
        and premium_sub.status = 'active'
        and premium_sub.starts_at <= now()
        and premium_sub.ends_at > now()
    ) then 0 else 1 end,
    s.score desc, (s.likes + s.comments + s.reactions) desc, s.created_at desc
  limit greatest(1, least(coalesce(p_limit, 24), 100))
$function$;

revoke all on function public.get_public_fans_creator_leaderboard(integer) from public;
grant execute on function public.get_public_fans_creator_leaderboard(integer) to anon, authenticated;



-- Prevent professional plans from being purchased through the customer Premium checkout.
create or replace function public.create_pecatho_customer_premium_checkout(
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
  if not exists(select 1 from public.profiles where id=v_user and account_type in ('customer','both')) then
    raise exception 'CUSTOMER_ACCOUNT_REQUIRED';
  end if;
  select * into v_plan from public.pecatho_customer_premium_plans
    where id=p_plan_id and active=true and audience='customer' for share;
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
    user_id,plan_id,order_id,paid_amount,currency,status,attributed_creator_id,feature_flags,card_style,badge_label,plan_name,duration_days,benefits,plan_description
  ) values(v_user,v_plan.id,v_order,v_plan.price,'BRL','pending',p_creator_id,
    v_plan.feature_flags,v_plan.card_style,v_plan.badge_label,v_plan.name,v_plan.duration_days,v_plan.benefits,v_plan.description)
  returning id into v_subscription;

  return jsonb_build_object('subscription_id',v_subscription,'order_id',v_order,'order_number',v_order_number,
    'plan_id',v_plan.id,'amount',v_plan.price,'currency','BRL','status','pending',
    'attributed_creator_id',p_creator_id);
end;
$function$;

revoke all on function public.create_pecatho_customer_premium_checkout(uuid,uuid) from public, anon;
grant execute on function public.create_pecatho_customer_premium_checkout(uuid,uuid) to authenticated;

-- Retire the legacy admin RPC so all plan edits pass audience, period and feature validation.
-- Keep the deployed editor compatible during the migration/deployment window, while routing
-- every legacy save through the new validation and entitlement rules.
create or replace function public.admin_save_pecatho_customer_premium_plan(
  p_plan_id uuid,
  p_plan_key text,
  p_name text,
  p_description text,
  p_price numeric,
  p_duration_days integer,
  p_benefits jsonb,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_existing public.pecatho_customer_premium_plans%rowtype;
  v_audience text;
  v_features jsonb;
  v_card_style text;
  v_badge_label text;
  v_sort_order integer;
begin
  if p_plan_id is not null then
    select * into v_existing
    from public.pecatho_customer_premium_plans
    where id=p_plan_id
    for update;
    if not found then raise exception 'PLAN_NOT_FOUND'; end if;
    v_audience:=v_existing.audience;
    v_features:=v_existing.feature_flags;
    v_card_style:=v_existing.card_style;
    v_badge_label:=v_existing.badge_label;
    v_sort_order:=v_existing.sort_order;
  else
    v_audience:='customer';
    v_features:='{"private_seller_contact":true,"featured_card":false,"search_priority":false,"premium_profile":false,"profile_badge":false}'::jsonb;
    v_card_style:='standard';
    v_badge_label:=null;
    v_sort_order:=0;
  end if;

  return public.admin_save_pecatho_customer_premium_plan(
    p_plan_id,v_audience,p_plan_key,p_name,p_description,p_price,p_duration_days,
    p_benefits,p_active,v_features,v_card_style,v_badge_label,v_sort_order
  );
end;
$function$;

revoke all on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,jsonb,boolean) from public, anon;
grant execute on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,jsonb,boolean) to authenticated;
notify pgrst, 'reload schema';


-- Use the period snapshot captured at checkout; later plan edits never change a paid order.
create or replace function public.settle_pecatho_customer_premium_checkout(
  p_order_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_payment_status public.payment_status,
  p_payment_method text DEFAULT NULL,
  p_provider_fee numeric DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_subscription public.pecatho_customer_premium_subscriptions%rowtype;
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  IF p_order_id IS NULL OR nullif(trim(p_provider),'') IS NULL OR nullif(trim(p_provider_payment_id),'') IS NULL THEN
    RAISE EXCEPTION 'INVALID_PREMIUM_SETTLEMENT_REQUEST';
  END IF;
  IF coalesce(p_provider_fee,0) < 0 THEN RAISE EXCEPTION 'INVALID_PROVIDER_FEE'; END IF;

  SELECT * INTO v_order FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.metadata->>'product_type' <> 'premium_subscription' THEN RAISE EXCEPTION 'PREMIUM_ORDER_NOT_FOUND'; END IF;
  SELECT * INTO v_payment FROM public.payments WHERE order_id=p_order_id ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PAYMENT_NOT_FOUND'; END IF;
  SELECT * INTO v_subscription FROM public.pecatho_customer_premium_subscriptions WHERE order_id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PREMIUM_SUBSCRIPTION_NOT_FOUND'; END IF;
  SELECT * INTO v_plan FROM public.pecatho_customer_premium_plans WHERE id=v_subscription.plan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'PREMIUM_PLAN_NOT_FOUND'; END IF;

  IF v_payment.status IN ('refunded','chargeback') AND p_payment_status <> v_payment.status THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_STATE_TRANSITION';
  END IF;
  IF v_payment.status='paid' AND p_payment_status NOT IN ('refunded','chargeback') THEN
    RETURN jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,
      'subscription_id',v_subscription.id,'ends_at',v_subscription.ends_at);
  END IF;

  IF p_payment_status='paid' THEN
    SELECT greatest(now(),coalesce(max(ends_at),now())) INTO v_start
      FROM public.pecatho_customer_premium_subscriptions
      WHERE user_id=v_subscription.user_id AND status='active' AND ends_at > now();
    v_end := v_start + make_interval(days => v_subscription.duration_days);
    UPDATE public.payments SET provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',
      payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,0),2),
      paid_at=coalesce(paid_at,now()),updated_at=now() WHERE id=v_payment.id;
    UPDATE public.orders SET status='paid',updated_at=now() WHERE id=v_order.id;
    UPDATE public.pecatho_customer_premium_subscriptions SET status='active',starts_at=v_start,ends_at=v_end,
      updated_at=now() WHERE id=v_subscription.id;
    RETURN jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,
      'subscription_id',v_subscription.id,'starts_at',v_start,'ends_at',v_end);
  END IF;

  IF p_payment_status IN ('refunded','chargeback') THEN
    UPDATE public.payments SET provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,provider_fee,0),2),updated_at=now()
      WHERE id=v_payment.id;
    UPDATE public.orders SET status='refunded',updated_at=now() WHERE id=v_order.id;
    UPDATE public.pecatho_customer_premium_subscriptions SET status=p_payment_status,updated_at=now()
      WHERE id=v_subscription.id;
  ELSE
    UPDATE public.payments SET provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,provider_fee,0),2),updated_at=now()
      WHERE id=v_payment.id;
    UPDATE public.orders SET status=CASE WHEN p_payment_status='failed' THEN 'failed' WHEN p_payment_status='cancelled' THEN 'cancelled' ELSE 'awaiting_payment' END,
      updated_at=now() WHERE id=v_order.id;
    UPDATE public.pecatho_customer_premium_subscriptions SET status=CASE WHEN p_payment_status IN ('failed','cancelled') THEN 'cancelled' ELSE 'pending' END,
      updated_at=now() WHERE id=v_subscription.id;
  END IF;
  RETURN jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id,
    'subscription_id',v_subscription.id);
END;
$function$;

revoke all on function public.settle_pecatho_customer_premium_checkout(uuid,text,text,payment_status,text,numeric) from public, anon, authenticated;
grant execute on function public.settle_pecatho_customer_premium_checkout(uuid,text,text,payment_status,text,numeric) to service_role;


-- Include professional profile plans in the existing idempotent 10% affiliate settlement.
CREATE OR REPLACE FUNCTION public.post_pecatho_affiliate_commission()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_order public.orders%rowtype;
  v_referral public.pecatho_affiliate_referrals%rowtype;
  v_creator_user_id uuid;
  v_revenue_base numeric(12,2) := 0;
  v_commission numeric(12,2) := 0;
  v_existing public.pecatho_affiliate_commissions%rowtype;
  v_key text;
  v_entry_type public.ledger_entry_type;
  v_balance numeric(12,2);
  v_target_reversed numeric(12,2) := 0;
  v_reversal_delta numeric(12,2) := 0;
BEGIN
  IF NEW.status NOT IN ('paid','partially_refunded','refunded','chargeback') OR
     (TG_OP='UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status AND NEW.refunded_amount IS NOT DISTINCT FROM OLD.refunded_amount) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id=NEW.order_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT * INTO v_referral FROM public.pecatho_affiliate_referrals
   WHERE referred_user_id=NEW.user_id AND status IN ('registered','qualified')
   FOR UPDATE;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT c.user_id INTO v_creator_user_id FROM public.fans_creators c
   WHERE c.id=v_referral.creator_id AND c.status='active';
  IF v_creator_user_id IS NULL OR v_creator_user_id=NEW.user_id THEN RETURN NEW; END IF;

  IF NEW.status='paid' THEN
    IF v_order.metadata->>'product_type'='premium_subscription' THEN
      -- Premium revenue is net of the existing 30% creator attribution and
      -- the provider fee explicitly supplied to the settlement RPC.
      v_revenue_base := greatest(round(NEW.amount - round(NEW.amount * 0.30,2) - coalesce(NEW.provider_fee,0),2),0);
    ELSIF v_order.metadata->>'product_type'='professional_premium_subscription' THEN
      -- Professional profile plans are Pecatho platform revenue, net of the payment provider fee.
      v_revenue_base := greatest(round(NEW.amount - coalesce(NEW.provider_fee,0),2),0);
    ELSIF v_order.metadata->>'product_type'='digital_content' THEN
      SELECT greatest(coalesce(s.platform_fee,0),0) INTO v_revenue_base
        FROM public.digital_content_sales s WHERE s.payment_id=NEW.id OR s.order_id=NEW.order_id
        ORDER BY s.created_at DESC LIMIT 1;
      v_revenue_base := coalesce(v_revenue_base,0);
    ELSIF v_order.metadata->>'product_type'='profile_media' THEN
      SELECT greatest(coalesce((le.metadata->>'platform_fee')::numeric,0),0)
        INTO v_revenue_base FROM public.ledger_entries le
        WHERE le.payment_id=NEW.id AND le.idempotency_key LIKE 'profile-media-sale:%'
        ORDER BY le.created_at DESC LIMIT 1;
      v_revenue_base := coalesce(v_revenue_base,0);
    ELSIF v_order.metadata->>'product_type' IN ('fans_purchase','fans_subscription','fans_tip','fans_live_session') THEN
      SELECT greatest(coalesce(s.platform_fee,0),0) INTO v_revenue_base
        FROM public.fans_purchases s WHERE s.payment_id=NEW.id OR s.order_id=NEW.order_id
        ORDER BY s.created_at DESC LIMIT 1;
      IF coalesce(v_revenue_base,0)=0 THEN
        SELECT greatest(coalesce(t.platform_fee,0),0) INTO v_revenue_base
          FROM public.fans_tips t WHERE t.payment_id=NEW.id OR t.order_id=NEW.order_id
          ORDER BY t.created_at DESC LIMIT 1;
      END IF;
      v_revenue_base := coalesce(v_revenue_base,0);
    ELSE
      -- Do not issue commission on products whose net Pecatho revenue cannot
      -- be established from persisted settlement data.
      RETURN NEW;
    END IF;

    v_commission := round(v_revenue_base * 0.10,2);
    IF v_commission <= 0 THEN RETURN NEW; END IF;

    INSERT INTO public.pecatho_affiliate_commissions(
      referral_id,payment_id,order_id,affiliate_user_id,currency,revenue_base,commission_amount,status
    ) VALUES (
      v_referral.id,NEW.id,NEW.order_id,v_creator_user_id,NEW.currency,v_revenue_base,v_commission,'credited'
    ) ON CONFLICT (payment_id) DO NOTHING;

    IF NOT FOUND THEN RETURN NEW; END IF;

    SELECT coalesce(sum(CASE WHEN le.entry_type IN ('credit','adjustment') THEN le.amount ELSE -le.amount END),0)
      INTO v_balance FROM public.ledger_entries le WHERE le.user_id=v_creator_user_id;
    INSERT INTO public.ledger_entries(
      user_id,order_id,payment_id,entry_type,amount,currency,balance_after,description,idempotency_key,metadata
    ) VALUES (
      v_creator_user_id,NEW.order_id,NEW.id,'credit'::public.ledger_entry_type,v_commission,NEW.currency,
      v_balance+v_commission,'Comissão de afiliado de 10% sobre a receita líquida do Pecatho',
      'pecatho-affiliate-commission:'||NEW.id::text,
      jsonb_build_object('source','pecatho','kind','affiliate_commission','referral_id',v_referral.id,
        'creator_id',v_referral.creator_id,'referred_user_id',NEW.user_id,'payment_id',NEW.id,
        'revenue_base',v_revenue_base,'commission_percent',10,'commission_amount',v_commission)
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    UPDATE public.pecatho_affiliate_referrals SET status='qualified',first_paid_at=coalesce(first_paid_at,now()),updated_at=now()
      WHERE id=v_referral.id;
    RETURN NEW;
  END IF;

  SELECT * INTO v_existing FROM public.pecatho_affiliate_commissions WHERE payment_id=NEW.id FOR UPDATE;
  IF NOT FOUND OR v_existing.reversed_amount >= v_existing.commission_amount THEN RETURN NEW; END IF;

  IF NEW.status IN ('refunded','chargeback') THEN
    v_target_reversed := v_existing.commission_amount;
  ELSIF NEW.status='partially_refunded' THEN
    IF coalesce(NEW.refunded_amount,0) <= 0 OR coalesce(NEW.amount,0) <= 0 THEN RETURN NEW; END IF;
    v_target_reversed := least(v_existing.commission_amount,
      round(v_existing.commission_amount * least(NEW.refunded_amount / NEW.amount,1),2));
  ELSE
    RETURN NEW;
  END IF;

  v_reversal_delta := round(v_target_reversed - v_existing.reversed_amount,2);
  IF v_reversal_delta <= 0 THEN RETURN NEW; END IF;

  v_entry_type := CASE WHEN NEW.status='chargeback' THEN 'chargeback'::public.ledger_entry_type ELSE 'refund'::public.ledger_entry_type END;
  v_key := 'pecatho-affiliate-reversal:'||NEW.id::text||':'||to_char(v_target_reversed,'FM999999999990.00');
  SELECT coalesce(sum(CASE WHEN le.entry_type IN ('credit','adjustment') THEN le.amount ELSE -le.amount END),0)
    INTO v_balance FROM public.ledger_entries le WHERE le.user_id=v_existing.affiliate_user_id;
  INSERT INTO public.ledger_entries(
    user_id,order_id,payment_id,entry_type,amount,currency,balance_after,description,idempotency_key,metadata
  ) VALUES (
    v_existing.affiliate_user_id,NEW.order_id,NEW.id,v_entry_type,v_reversal_delta,NEW.currency,
    v_balance-v_reversal_delta,
    CASE WHEN NEW.status='chargeback' THEN 'Estorno de comissão de afiliado por chargeback'
      ELSE CASE WHEN NEW.status='partially_refunded' THEN 'Ajuste proporcional da comissão de afiliado por reembolso parcial'
        ELSE 'Estorno de comissão de afiliado por reembolso' END END,
    v_key,jsonb_build_object('source','pecatho','kind','affiliate_commission_reversal',
      'commission_id',v_existing.id,'referral_id',v_existing.referral_id,
      'commission_amount_reversed_total',v_target_reversed,'commission_amount_reversed_delta',v_reversal_delta,
      'refunded_amount',NEW.refunded_amount,'payment_amount',NEW.amount,'payment_status',NEW.status)
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  UPDATE public.pecatho_affiliate_commissions
    SET reversed_amount=v_target_reversed,
        status=CASE WHEN v_target_reversed >= commission_amount THEN 'reversed' ELSE 'credited' END,
        reversal_status=CASE WHEN v_target_reversed >= commission_amount THEN NEW.status ELSE NULL END,
        updated_at=now()
    WHERE id=v_existing.id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS pecatho_affiliate_commission_payment_trigger ON public.payments;
CREATE CONSTRAINT TRIGGER pecatho_affiliate_commission_payment_trigger
AFTER INSERT OR UPDATE ON public.payments
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.post_pecatho_affiliate_commission();


REVOKE ALL ON FUNCTION public.post_pecatho_affiliate_commission() FROM PUBLIC, anon, authenticated;
