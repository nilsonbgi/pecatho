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

create index if not exists profile_publications_active_plan_idx on public.profile_publications(profile_id,status,ends_at desc);

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
      select bool_or(pp.featured_card) as featured_card,max(pp.search_priority) as search_priority
      from public.profile_publications pub join public.publication_plans pp on pp.id=pub.plan_id
      where pub.profile_id=ap.id and pub.status::text='published' and pub.starts_at<=now() and pub.ends_at>now() and pp.active=true
        and (pp.audience='both' or pp.audience=case
          when exists(select 1 from public.fans_creators fc where fc.advertiser_profile_id=ap.id and fc.status='active') then 'content_seller'
          else 'companion' end)
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
