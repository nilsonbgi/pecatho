-- Configurable publication-plan differentiators and effective search priority.
-- No existing plans, publication assignments, prices, or payment records are rewritten.
alter table public.publication_plans
  add column if not exists audience text not null default 'companion',
  add column if not exists featured_card boolean not null default false,
  add column if not exists search_priority integer not null default 0,
  add column if not exists show_premium_badge boolean not null default false,
  add column if not exists profile_theme text not null default 'standard',
  add column if not exists max_gallery_items integer;

do $migration$
begin
  if not exists (select 1 from pg_constraint where conname='publication_plans_audience_check') then
    alter table public.publication_plans add constraint publication_plans_audience_check check (audience in ('companion','content_seller','both'));
  end if;
  if not exists (select 1 from pg_constraint where conname='publication_plans_search_priority_check') then
    alter table public.publication_plans add constraint publication_plans_search_priority_check check (search_priority between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname='publication_plans_profile_theme_check') then
    alter table public.publication_plans add constraint publication_plans_profile_theme_check check (profile_theme in ('standard','highlighted','premium'));
  end if;
  if not exists (select 1 from pg_constraint where conname='publication_plans_max_gallery_items_check') then
    alter table public.publication_plans add constraint publication_plans_max_gallery_items_check check (max_gallery_items is null or max_gallery_items between 1 and 500);
  end if;
end
$migration$;

alter table public.profile_publications
  add column if not exists order_id uuid unique references public.orders(id) on delete restrict,
  add column if not exists plan_features_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists paid_amount numeric(12,2);

create index if not exists profile_publications_active_plan_idx on public.profile_publications(profile_id,status,ends_at desc);

grant select on public.publication_plans to authenticated;

drop policy if exists publication_plans_admin_select on public.publication_plans;
create policy publication_plans_admin_select on public.publication_plans for select to authenticated using (
  exists (select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role in ('super_admin','admin'))
);

create or replace function public.admin_save_pecatho_publication_plan(
  p_plan_id uuid, p_name text, p_description text, p_duration_days integer, p_price numeric,
  p_active boolean, p_free boolean, p_audience text, p_has_video boolean, p_featured_card boolean,
  p_search_priority integer, p_show_premium_badge boolean, p_profile_theme text,
  p_max_gallery_items integer, p_features jsonb
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.publication_plans%rowtype;
  v_name text := trim(coalesce(p_name,''));
  v_audience text := lower(trim(coalesce(p_audience,'')));
  v_theme text := lower(trim(coalesce(p_profile_theme,'standard')));
  v_features jsonb := coalesce(p_features,'{}'::jsonb);
begin
  if v_user is null or not exists (select 1 from public.user_roles ur where ur.user_id=v_user and ur.role in ('super_admin','admin')) then
    raise exception 'ADMIN_REQUIRED';
  end if;
  if char_length(v_name) not between 3 and 100 then raise exception 'INVALID_PLAN_NAME'; end if;
  if p_duration_days is null or p_duration_days not between 1 and 365 then raise exception 'INVALID_PLAN_DURATION'; end if;
  if p_price is null or p_price < 0 or p_price > 100000 then raise exception 'INVALID_PLAN_PRICE'; end if;
  if coalesce(p_free,false) and p_price <> 0 then raise exception 'FREE_PLAN_PRICE_MUST_BE_ZERO'; end if;
  if not coalesce(p_free,false) and p_price <= 0 then raise exception 'PAID_PLAN_PRICE_REQUIRED'; end if;
  if v_audience not in ('companion','content_seller','both') then raise exception 'INVALID_PLAN_AUDIENCE'; end if;
  if p_search_priority is null or p_search_priority not between 0 and 100 then raise exception 'INVALID_SEARCH_PRIORITY'; end if;
  if v_theme not in ('standard','highlighted','premium') then raise exception 'INVALID_PROFILE_THEME'; end if;
  if p_max_gallery_items is not null and p_max_gallery_items not between 1 and 500 then raise exception 'INVALID_MAX_GALLERY_ITEMS'; end if;
  if jsonb_typeof(v_features) <> 'object' then raise exception 'INVALID_PLAN_FEATURES'; end if;

  if p_plan_id is null then
    insert into public.publication_plans
      (name,description,duration_days,price,currency,active,free,has_video,features,audience,featured_card,search_priority,show_premium_badge,profile_theme,max_gallery_items,updated_at)
    values
      (v_name,nullif(trim(coalesce(p_description,'')),''),p_duration_days,round(p_price,2),'BRL',coalesce(p_active,false),coalesce(p_free,false),
       coalesce(p_has_video,false),v_features,v_audience,coalesce(p_featured_card,false),p_search_priority,
       coalesce(p_show_premium_badge,false),v_theme,p_max_gallery_items,now())
    returning * into v_plan;
  else
    select * into v_plan from public.publication_plans where id=p_plan_id for update;
    if not found then raise exception 'PUBLICATION_PLAN_NOT_FOUND'; end if;
    update public.publication_plans set
      name=v_name,description=nullif(trim(coalesce(p_description,'')),''),
      duration_days=p_duration_days,price=round(p_price,2),currency='BRL',
      active=coalesce(p_active,false),free=coalesce(p_free,false),has_video=coalesce(p_has_video,false),
      features=v_features,audience=v_audience,featured_card=coalesce(p_featured_card,false),
      search_priority=p_search_priority,show_premium_badge=coalesce(p_show_premium_badge,false),
      profile_theme=v_theme,max_gallery_items=p_max_gallery_items,updated_at=now()
    where id=p_plan_id returning * into v_plan;
  end if;
  return jsonb_build_object('id',v_plan.id,'name',v_plan.name,'audience',v_plan.audience,
    'price',v_plan.price,'duration_days',v_plan.duration_days,'active',v_plan.active,
    'featured_card',v_plan.featured_card,'search_priority',v_plan.search_priority,'profile_theme',v_plan.profile_theme);
end;
$function$;

revoke all on function public.admin_save_pecatho_publication_plan(uuid,text,text,integer,numeric,boolean,boolean,text,boolean,boolean,integer,boolean,text,integer,jsonb) from public,anon;
grant execute on function public.admin_save_pecatho_publication_plan(uuid,text,text,integer,numeric,boolean,boolean,text,boolean,boolean,integer,boolean,text,integer,jsonb) to authenticated;

create or replace function public.get_public_profile_plan_features(p_profile_ids uuid[])
returns table(profile_id uuid,featured_card boolean,show_premium_badge boolean,profile_theme text,search_priority integer)
language sql stable security definer set search_path = 'pg_catalog'
as $function$
  select ap.id,
    coalesce(bool_or(case when pub.plan_features_snapshot ? 'featured_card' then coalesce((pub.plan_features_snapshot->>'featured_card')::boolean,false) else false end),false),
    coalesce(bool_or(case when pub.plan_features_snapshot ? 'show_premium_badge' then coalesce((pub.plan_features_snapshot->>'show_premium_badge')::boolean,false) else false end),false),
    case when coalesce(bool_or(pub.plan_features_snapshot ? 'profile_theme' and pub.plan_features_snapshot->>'profile_theme'='premium'),false) then 'premium'
         when coalesce(bool_or(pub.plan_features_snapshot ? 'profile_theme' and pub.plan_features_snapshot->>'profile_theme'='highlighted'),false) then 'highlighted'
         else 'standard' end,
    coalesce(max(case when pub.plan_features_snapshot ? 'search_priority' then coalesce((pub.plan_features_snapshot->>'search_priority')::integer,0) else 0 end),0)
  from public.advertiser_profiles ap
  join public.profile_publications pub on pub.profile_id=ap.id
  join public.publication_plans pp on pp.id=pub.plan_id
  where ap.id=any(coalesce(p_profile_ids,'{}'::uuid[]))
    and ap.status::text='published'
    and pub.status::text='published' and pub.starts_at<=now() and pub.ends_at>now()
    and coalesce(pub.plan_features_snapshot->>'audience',pp.audience) in ('both',
      case when exists(select 1 from public.fans_creators fc where fc.advertiser_profile_id=ap.id and fc.status='active') then 'content_seller' else 'companion' end)
  group by ap.id;
$function$;
revoke all on function public.get_public_profile_plan_features(uuid[]) from public;
grant execute on function public.get_public_profile_plan_features(uuid[]) to anon,authenticated;

create or replace function public.enforce_publication_video_entitlement()
returns trigger
language plpgsql security definer set search_path = pg_catalog, public
as $function$
begin
  if new.kind='video' and not exists (
    select 1
    from public.profile_publications pub
    join public.publication_plans pp on pp.id=pub.plan_id
    where pub.profile_id=new.profile_id and pub.status::text='published'
      and pub.starts_at<=now() and pub.ends_at>now()
      and coalesce(nullif(pub.plan_features_snapshot->>'has_video','')::boolean,pp.has_video)=true
      and coalesce(pub.plan_features_snapshot->>'audience',pp.audience) in ('both',
        case when exists(select 1 from public.fans_creators fc where fc.advertiser_profile_id=new.profile_id and fc.status='active') then 'content_seller' else 'companion' end)
  ) then
    raise exception 'VIDEO_REQUIRES_ELIGIBLE_PUBLICATION_PLAN';
  end if;
  return new;
end;
$function$;
drop trigger if exists profile_media_video_plan_entitlement on public.profile_media;
create trigger profile_media_video_plan_entitlement
before insert or update of kind,profile_id on public.profile_media
for each row execute function public.enforce_publication_video_entitlement();

create or replace function public.search_public_advertisers(
  p_category_id bigint DEFAULT NULL, p_state_id bigint DEFAULT NULL, p_city_id bigint DEFAULT NULL,
  p_query text DEFAULT NULL, p_attribute_filters jsonb DEFAULT '{}'::jsonb, p_service_slugs text[] DEFAULT '{}'::text[],
  p_age_min integer DEFAULT NULL, p_age_max integer DEFAULT NULL, p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL, p_duration_minutes integer DEFAULT NULL, p_sort text DEFAULT 'recent',
  p_limit integer DEFAULT 48, p_offset integer DEFAULT 0
)
returns table(id uuid,slug text,title text,display_name text,summary text,city_id bigint,state_id bigint,category_id bigint,verification_status text,pricing jsonb,city_name text,state_uf text,total_count bigint)
language sql stable security definer set search_path = 'pg_catalog'
as $function$
  with matching_profiles as (
    select ap.id,ap.slug::text as slug,ap.title,ap.display_name,ap.summary,
      ap.city_id::bigint as city_id,ap.state_id::bigint as state_id,ap.category_id::bigint as category_id,
      ap.verification_status::text as verification_status,ap.pricing,c.name::text as city_name,s.uf::text as state_uf,
      ap.created_at,prices.minimum_price,coalesce(entitlements.featured_card,false) as is_featured,
      coalesce(entitlements.search_priority,0) as search_priority
    from public.advertiser_profiles ap
    left join public.cities c on c.id=ap.city_id
    left join public.states s on s.id=ap.state_id
    left join lateral (
      select min((period.value->>'price')::numeric) as minimum_price
      from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods')='array' then ap.pricing->'periods' else '[]'::jsonb end) as period(value)
      where jsonb_typeof(period.value->'price') in ('number','string') and (period.value->>'price') ~ '^([0-9]+([.][0-9]+)?|[.][0-9]+)$'
    ) prices on true
    left join lateral (
      select bool_or(case when pub.plan_features_snapshot ? 'featured_card' then coalesce((pub.plan_features_snapshot->>'featured_card')::boolean,false) else false end) as featured_card,
        max(case when pub.plan_features_snapshot ? 'search_priority' then coalesce((pub.plan_features_snapshot->>'search_priority')::integer,0) else 0 end) as search_priority
      from public.profile_publications pub join public.publication_plans pp on pp.id=pub.plan_id
      where pub.profile_id=ap.id and pub.status::text='published' and pub.starts_at<=now() and pub.ends_at>now()
        and coalesce(pub.plan_features_snapshot->>'audience',pp.audience) in ('both',
          case when exists(select 1 from public.fans_creators fc where fc.advertiser_profile_id=ap.id and fc.status='active') then 'content_seller' else 'companion' end)
    ) entitlements on true
    where ap.status::text='published'
      and (p_category_id is null or ap.category_id=p_category_id)
      and (p_state_id is null or ap.state_id=p_state_id)
      and (p_city_id is null or ap.city_id=p_city_id)
      and (nullif(trim(coalesce(p_query,'')),'') is null
        or ap.title ilike '%'||replace(replace(trim(p_query),'%','\\%'),'_','\\_')||'%' escape '\\'
        or ap.display_name ilike '%'||replace(replace(trim(p_query),'%','\\%'),'_','\\_')||'%' escape '\\'
        or ap.summary ilike '%'||replace(replace(trim(p_query),'%','\\%'),'_','\\_')||'%' escape '\\')
      and (p_age_min is null or (p_age_min between 18 and 120 and ap.birth_date <= (current_date-make_interval(years=>p_age_min))::date))
      and (p_age_max is null or (p_age_max between 18 and 120 and ap.birth_date > (current_date-make_interval(years=>p_age_max+1))::date))
      and (p_age_min is null or p_age_max is null or p_age_min<=p_age_max)
      and (p_price_min is null or p_price_min>=0) and (p_price_max is null or p_price_max>=0)
      and (p_price_min is null or exists (
        select 1 from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods')='array' then ap.pricing->'periods' else '[]'::jsonb end) as period(value)
        where jsonb_typeof(period.value->'price') in ('number','string') and (period.value->>'price') ~ '^([0-9]+([.][0-9]+)?|[.][0-9]+)$' and (period.value->>'price')::numeric>=p_price_min))
      and (p_price_max is null or exists (
        select 1 from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods')='array' then ap.pricing->'periods' else '[]'::jsonb end) as period(value)
        where jsonb_typeof(period.value->'price') in ('number','string') and (period.value->>'price') ~ '^([0-9]+([.][0-9]+)?|[.][0-9]+)$' and (period.value->>'price')::numeric<=p_price_max))
      and (p_duration_minutes is null or exists (
        select 1 from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods')='array' then ap.pricing->'periods' else '[]'::jsonb end) as period(value)
        where (period.value->>'minutes') ~ '^[0-9]+$' and (period.value->>'minutes')::integer=p_duration_minutes))
      and not exists (
        select 1 from jsonb_each(case when jsonb_typeof(p_attribute_filters)='object' then p_attribute_filters else '{}'::jsonb end) as filter(slug,wanted)
        where not exists (
          select 1 from public.profile_attribute_values pav join public.category_attributes ca on ca.id=pav.attribute_id
          where pav.profile_id=ap.id and ca.category_id=ap.category_id and ca.slug=filter.slug and ca.display_public=true
            and (pav.value=filter.wanted or (jsonb_typeof(filter.wanted)='array' and jsonb_typeof(pav.value)='array' and pav.value@>filter.wanted)
              or (jsonb_typeof(pav.value)='array' and pav.value@>jsonb_build_array(filter.wanted)))))
      and not exists (
        select 1 from unnest(coalesce(p_service_slugs,'{}'::text[])) as wanted(slug)
        where not exists (
          select 1 from public.profile_services ps join public.category_services cs on cs.id=ps.service_id
          where ps.profile_id=ap.id and ps.selected=true and cs.category_id=ap.category_id and cs.slug=wanted.slug and cs.display_public=true))
  )
  select mp.id,mp.slug,mp.title,mp.display_name,mp.summary,mp.city_id,mp.state_id,mp.category_id,
    mp.verification_status,mp.pricing,mp.city_name,mp.state_uf,count(*) over() as total_count
  from matching_profiles mp
  order by mp.is_featured desc,mp.search_priority desc,
    case when p_sort='price_asc' then mp.minimum_price end asc nulls last,
    case when p_sort='price_desc' then mp.minimum_price end desc nulls last,
    case when p_sort='name' then lower(coalesce(mp.display_name,mp.title,'')) end asc nulls last,
    mp.created_at desc
  limit greatest(1,least(coalesce(p_limit,48),100)) offset greatest(coalesce(p_offset,0),0);
$function$;


-- Customer subscription catalog accepts only the four commercially defined terms.
create or replace function public.admin_save_pecatho_customer_premium_plan(
  p_plan_id uuid,
  p_plan_key text,
  p_name text,
  p_description text,
  p_price numeric,
  p_duration_days integer,
  p_benefits jsonb,
  p_active boolean
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_key text := lower(trim(coalesce(p_plan_key,'')));
  v_name text := trim(coalesce(p_name,''));
  v_benefits jsonb := coalesce(p_benefits,'[]'::jsonb);
begin
  if v_user is null or not exists (
    select 1 from public.user_roles ur where ur.user_id=v_user and ur.role in ('super_admin','admin')
  ) then raise exception 'ADMIN_REQUIRED'; end if;
  if v_key !~ '^[a-z0-9][a-z0-9_-]{1,49}$' then raise exception 'INVALID_PLAN_KEY'; end if;
  if char_length(v_name) not between 3 and 100 then raise exception 'INVALID_PLAN_NAME'; end if;
  if p_price is null or p_price <= 0 or p_price > 10000 then raise exception 'INVALID_PLAN_PRICE'; end if;
  if p_duration_days is null or p_duration_days not in (30,90,180,365) then raise exception 'INVALID_PLAN_DURATION'; end if;
  if jsonb_typeof(v_benefits) <> 'array' or jsonb_array_length(v_benefits) > 20 then raise exception 'INVALID_PLAN_BENEFITS'; end if;
  if exists(select 1 from jsonb_array_elements(v_benefits) as item(value) where jsonb_typeof(item.value) <> 'string' or char_length(trim(item.value #>> '{}')) not between 1 and 240) then
    raise exception 'INVALID_PLAN_BENEFIT_ITEM';
  end if;

  if p_plan_id is null then
    insert into public.pecatho_customer_premium_plans(plan_key,name,description,price,currency,duration_days,benefits,active,updated_at)
    values(v_key,v_name,nullif(trim(coalesce(p_description,'')),''),round(p_price,2),'BRL',p_duration_days,v_benefits,coalesce(p_active,false),now())
    returning * into v_plan;
  else
    select * into v_plan from public.pecatho_customer_premium_plans where id=p_plan_id for update;
    if not found then raise exception 'PREMIUM_PLAN_NOT_FOUND'; end if;
    update public.pecatho_customer_premium_plans set
      plan_key=v_key,name=v_name,description=nullif(trim(coalesce(p_description,'')),''),
      price=round(p_price,2),duration_days=p_duration_days,benefits=v_benefits,
      active=coalesce(p_active,false),updated_at=now()
    where id=p_plan_id returning * into v_plan;
  end if;

  return jsonb_build_object('id',v_plan.id,'plan_key',v_plan.plan_key,'name',v_plan.name,
    'price',v_plan.price,'duration_days',v_plan.duration_days,'active',v_plan.active);
end;
$function$;
revoke all on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,jsonb,boolean) from public,anon;
grant execute on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,jsonb,boolean) to authenticated;


-- Paid publication plans are attached only after verified payment settlement.
create or replace function public.create_pecatho_publication_checkout(p_plan_id uuid,p_profile_id uuid)
returns jsonb
language plpgsql security definer set search_path = pg_catalog,public
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.publication_plans%rowtype;
  v_profile public.advertiser_profiles%rowtype;
  v_order uuid;
  v_order_number text;
  v_snapshot jsonb;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select * into v_profile from public.advertiser_profiles where id=p_profile_id and user_id=v_user for share;
  if not found then raise exception 'PUBLICATION_PROFILE_NOT_OWNED'; end if;
  select * into v_plan from public.publication_plans where id=p_plan_id and active=true for share;
  if not found then raise exception 'PUBLICATION_PLAN_UNAVAILABLE'; end if;
  if v_plan.free then raise exception 'FREE_PLAN_USE_ACTIVATION'; end if;
  if v_plan.price<=0 then raise exception 'INVALID_PLAN_PRICE'; end if;
  if v_plan.audience not in ('both',case when exists(
    select 1 from public.fans_creators fc where fc.advertiser_profile_id=p_profile_id and fc.status='active'
  ) then 'content_seller' else 'companion' end) then raise exception 'PUBLICATION_PLAN_AUDIENCE_MISMATCH'; end if;
  if exists(select 1 from public.orders o where o.user_id=v_user and o.status='awaiting_payment'
    and o.metadata->>'product_type'='publication_plan' and o.metadata->>'profile_id'=p_profile_id::text) then
    raise exception 'PUBLICATION_CHECKOUT_ALREADY_PENDING';
  end if;

  v_snapshot := jsonb_build_object(
    'audience',v_plan.audience,'featured_card',v_plan.featured_card,
    'search_priority',v_plan.search_priority,'show_premium_badge',v_plan.show_premium_badge,
    'profile_theme',v_plan.profile_theme,'has_video',v_plan.has_video,
    'duration_days',v_plan.duration_days,'plan_name',v_plan.name
  );
  v_order_number := 'PEC-PUB-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  insert into public.orders(order_number,user_id,status,subtotal,discount,fee,total,currency,metadata)
  values(v_order_number,v_user,'awaiting_payment',v_plan.price,0,0,v_plan.price,'BRL',
    jsonb_build_object('source','pecatho','kind','publication_plan','product_type','publication_plan',
      'product_id',v_plan.id,'plan_id',v_plan.id,'profile_id',p_profile_id,'title',v_plan.name,
      'duration_days',v_plan.duration_days,'plan_features_snapshot',v_snapshot))
  returning id into v_order;
  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',v_plan.price,'BRL','pending','pending','{}'::jsonb);
  return jsonb_build_object('order_id',v_order,'order_number',v_order_number,'plan_id',v_plan.id,
    'profile_id',p_profile_id,'amount',v_plan.price,'currency','BRL','status','pending');
end;
$function$;
revoke all on function public.create_pecatho_publication_checkout(uuid,uuid) from public,anon;
grant execute on function public.create_pecatho_publication_checkout(uuid,uuid) to authenticated;

create or replace function public.activate_free_pecatho_publication_plan(p_plan_id uuid,p_profile_id uuid)
returns jsonb
language plpgsql security definer set search_path = pg_catalog,public
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.publication_plans%rowtype;
  v_profile public.advertiser_profiles%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_snapshot jsonb;
  v_publication uuid;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select * into v_profile from public.advertiser_profiles where id=p_profile_id and user_id=v_user for share;
  if not found then raise exception 'PUBLICATION_PROFILE_NOT_OWNED'; end if;
  select * into v_plan from public.publication_plans where id=p_plan_id and active=true and free=true and price=0 for share;
  if not found then raise exception 'FREE_PUBLICATION_PLAN_UNAVAILABLE'; end if;
  if v_plan.audience not in ('both',case when exists(
    select 1 from public.fans_creators fc where fc.advertiser_profile_id=p_profile_id and fc.status='active'
  ) then 'content_seller' else 'companion' end) then raise exception 'PUBLICATION_PLAN_AUDIENCE_MISMATCH'; end if;
  if exists(select 1 from public.profile_publications pub where pub.profile_id=p_profile_id and pub.status::text='published' and pub.ends_at>now()) then
    raise exception 'PUBLICATION_ALREADY_ACTIVE';
  end if;
  select greatest(now(),coalesce(max(ends_at),now())) into v_start
    from public.profile_publications where profile_id=p_profile_id and status::text='published' and ends_at>now();
  v_end := v_start+make_interval(days=>v_plan.duration_days);
  v_snapshot := jsonb_build_object('audience',v_plan.audience,'featured_card',v_plan.featured_card,
    'search_priority',v_plan.search_priority,'show_premium_badge',v_plan.show_premium_badge,
    'profile_theme',v_plan.profile_theme,'has_video',v_plan.has_video,
    'duration_days',v_plan.duration_days,'plan_name',v_plan.name);
  insert into public.profile_publications(profile_id,plan_id,status,starts_at,ends_at,paid,bonus_used,plan_features_snapshot,paid_amount)
  values(p_profile_id,v_plan.id,'published',v_start,v_end,false,false,v_snapshot,0)
  returning id into v_publication;
  return jsonb_build_object('ok',true,'publication_id',v_publication,'starts_at',v_start,'ends_at',v_end);
end;
$function$;
revoke all on function public.activate_free_pecatho_publication_plan(uuid,uuid) from public,anon;
grant execute on function public.activate_free_pecatho_publication_plan(uuid,uuid) to authenticated;

create or replace function public.settle_pecatho_publication_checkout(
  p_order_id uuid,p_provider text,p_provider_payment_id text,p_payment_status payment_status,
  p_payment_method text default null,p_provider_fee numeric default 0
) returns jsonb
language plpgsql security definer set search_path = pg_catalog,public
as $function$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_plan public.publication_plans%rowtype;
  v_profile_id uuid;
  v_plan_id uuid;
  v_snapshot jsonb;
  v_duration integer;
  v_start timestamptz;
  v_end timestamptz;
  v_publication public.profile_publications%rowtype;
begin
  if p_order_id is null or nullif(trim(coalesce(p_provider,'')),'') is null or nullif(trim(coalesce(p_provider_payment_id,'')),'') is null then
    raise exception 'INVALID_PUBLICATION_SETTLEMENT_REQUEST';
  end if;
  if coalesce(p_provider_fee,0)<0 then raise exception 'INVALID_PROVIDER_FEE'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.metadata->>'product_type'<>'publication_plan' then raise exception 'PUBLICATION_ORDER_NOT_FOUND'; end if;
  select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  select * into v_publication from public.profile_publications where order_id=p_order_id;
  if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then raise exception 'INVALID_PAYMENT_STATE_TRANSITION'; end if;
  if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then
    return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,'publication_id',v_publication.id);
  end if;

  if p_payment_status='paid' then
    v_profile_id := nullif(v_order.metadata->>'profile_id','')::uuid;
    v_plan_id := nullif(v_order.metadata->>'plan_id','')::uuid;
    v_snapshot := coalesce(v_order.metadata->'plan_features_snapshot','{}'::jsonb);
    v_duration := coalesce(nullif(v_order.metadata->>'duration_days','')::integer,0);
    select * into v_plan from public.publication_plans where id=v_plan_id;
    if not found or v_profile_id is null or v_duration not between 1 and 365 then raise exception 'PUBLICATION_PLAN_SNAPSHOT_INVALID'; end if;
    if exists(select 1 from public.profile_publications where order_id=p_order_id) then
      return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id);
    end if;
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',
      payment_method=p_payment_method,provider_fee=coalesce(p_provider_fee,0),paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
    update public.orders set status='paid',updated_at=now() where id=v_order.id;
    select greatest(now(),coalesce(max(ends_at),now())) into v_start from public.profile_publications
      where profile_id=v_profile_id and status::text='published' and ends_at>now();
    v_end:=v_start+make_interval(days=>v_duration);
    insert into public.profile_publications(profile_id,plan_id,status,starts_at,ends_at,paid,bonus_used,order_id,plan_features_snapshot,paid_amount)
    values(v_profile_id,v_plan_id,'published',v_start,v_end,true,false,p_order_id,v_snapshot,round(v_order.total,2))
    returning * into v_publication;
    return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,
      'publication_id',v_publication.id,'starts_at',v_start,'ends_at',v_end);
  end if;

  if p_payment_status in ('refunded','chargeback') then
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,provider_fee=coalesce(p_provider_fee,0),updated_at=now() where id=v_payment.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;
    update public.profile_publications set status='paused',ends_at=least(coalesce(ends_at,now()),now())
      where order_id=p_order_id;
  else
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,provider_fee=coalesce(p_provider_fee,0),updated_at=now() where id=v_payment.id;
    update public.orders set status=case when p_payment_status='failed' then 'failed' when p_payment_status='cancelled' then 'cancelled' else 'awaiting_payment' end,
      updated_at=now() where id=v_order.id;
  end if;
  return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id);
end;
$function$;
revoke all on function public.settle_pecatho_publication_checkout(uuid,text,text,payment_status,text,numeric) from public,anon,authenticated;
grant execute on function public.settle_pecatho_publication_checkout(uuid,text,text,payment_status,text,numeric) to service_role;


-- Keep the term selected at checkout even if an administrator later edits the catalog price or duration.
create or replace function public.settle_pecatho_customer_premium_checkout(
  p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status,
  p_payment_method text default null, p_provider_fee numeric default 0
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_subscription public.pecatho_customer_premium_subscriptions%rowtype;
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_start timestamptz;
  v_end timestamptz;
begin
  if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null then
    raise exception 'INVALID_PREMIUM_SETTLEMENT_REQUEST';
  end if;
  if coalesce(p_provider_fee,0) < 0 then raise exception 'INVALID_PROVIDER_FEE'; end if;

  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.metadata->>'product_type' <> 'premium_subscription' then raise exception 'PREMIUM_ORDER_NOT_FOUND'; end if;
  select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  select * into v_subscription from public.pecatho_customer_premium_subscriptions where order_id=p_order_id for update;
  if not found then raise exception 'PREMIUM_SUBSCRIPTION_NOT_FOUND'; end if;
  select * into v_plan from public.pecatho_customer_premium_plans where id=v_subscription.plan_id;
  if not found then raise exception 'PREMIUM_PLAN_NOT_FOUND'; end if;

  if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then
    raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
  end if;
  if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then
    return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,
      'subscription_id',v_subscription.id,'ends_at',v_subscription.ends_at);
  end if;

  if p_payment_status='paid' then
    select greatest(now(),coalesce(max(ends_at),now())) into v_start
      from public.pecatho_customer_premium_subscriptions
      where user_id=v_subscription.user_id and status='active' and ends_at > now();
    if coalesce(nullif(v_order.metadata->>'duration_days','')::integer,v_plan.duration_days) not in (30,90,180,365) then
      raise exception 'INVALID_PREMIUM_DURATION_SNAPSHOT';
    end if;
    v_end := v_start + make_interval(days => coalesce(nullif(v_order.metadata->>'duration_days','')::integer,v_plan.duration_days));
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',
      payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
    update public.orders set status='paid',updated_at=now() where id=v_order.id;
    update public.pecatho_customer_premium_subscriptions set status='active',starts_at=v_start,ends_at=v_end,
      updated_at=now() where id=v_subscription.id;
    return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,
      'subscription_id',v_subscription.id,'starts_at',v_start,'ends_at',v_end);
  end if;

  if p_payment_status in ('refunded','chargeback') then
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;
    update public.pecatho_customer_premium_subscriptions set status=p_payment_status,updated_at=now()
      where id=v_subscription.id;
  else
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
    update public.orders set status=case when p_payment_status='failed' then 'failed' when p_payment_status='cancelled' then 'cancelled' else 'awaiting_payment' end,
      updated_at=now() where id=v_order.id;
    update public.pecatho_customer_premium_subscriptions set status=case when p_payment_status='failed' then 'cancelled' when p_payment_status='cancelled' then 'cancelled' else 'pending' end,
      updated_at=now() where id=v_subscription.id;
  end if;
  return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id,
    'subscription_id',v_subscription.id);
end;
$function$;

