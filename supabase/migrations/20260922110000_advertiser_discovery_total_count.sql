-- Expose the total number of matching public advertisers without a second count query.
drop function if exists public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,text,integer,integer);

create or replace function public.search_public_advertisers(
  p_category_id bigint default null,
  p_state_id bigint default null,
  p_city_id bigint default null,
  p_query text default null,
  p_attribute_filters jsonb default '{}'::jsonb,
  p_service_slugs text[] default '{}'::text[],
  p_age_min integer default null,
  p_age_max integer default null,
  p_price_min numeric default null,
  p_price_max numeric default null,
  p_duration_minutes integer default null,
  p_sort text default 'recent',
  p_limit integer default 48,
  p_offset integer default 0
)
returns table(id uuid, slug text, title text, display_name text, summary text, city_id bigint, state_id bigint, category_id bigint, verification_status text, pricing jsonb, created_at timestamptz, city_name text, state_uf text, total_count bigint)
language sql
security definer
set search_path = pg_catalog, public
as $function$
  select ap.id, ap.slug::text, ap.title, ap.display_name, ap.summary,
         ap.city_id, ap.state_id, ap.category_id, ap.verification_status::text,
         ap.pricing, ap.created_at, c.name::text, st.uf::text,
         count(*) over() as total_count
  from public.advertiser_profiles ap
  left join public.cities c on c.id = ap.city_id
  left join public.states st on st.id = ap.state_id
  left join lateral (
    select min((p->>'price')::numeric) as sort_price
    from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods')='array' then ap.pricing->'periods' else '[]'::jsonb end) p
    where jsonb_typeof(p->'price') in ('number','string')
      and (p->>'price') ~ '^([0-9]+([.][0-9]+)?|[.][0-9]+)$'
      and (p->>'price')::numeric > 0
      and (p_duration_minutes is null or (p->>'minutes')::integer = p_duration_minutes)
  ) priced on true
  where ap.status = 'published'
    and (p_category_id is null or ap.category_id = p_category_id)
    and (p_state_id is null or ap.state_id = p_state_id)
    and (p_city_id is null or ap.city_id = p_city_id)
    and (nullif(trim(coalesce(p_query, '')), '') is null
      or ap.title ilike '%' || replace(replace(trim(p_query), '%', '\\%'), '_', '\\_') || '%' escape '\\'
      or ap.display_name ilike '%' || replace(replace(trim(p_query), '%', '\\%'), '_', '\\_') || '%' escape '\\'
      or ap.summary ilike '%' || replace(replace(trim(p_query), '%', '\\%'), '_', '\\_') || '%' escape '\\')
    and (p_age_min is null or (p_age_min between 18 and 120 and ap.birth_date <= (current_date - make_interval(years => p_age_min))::date))
    and (p_age_max is null or (p_age_max between 18 and 120 and ap.birth_date > (current_date - make_interval(years => p_age_max + 1))::date))
    and (p_age_min is null or p_age_max is null or p_age_min <= p_age_max)
    and (p_price_min is null or p_price_min >= 0)
    and (p_price_max is null or p_price_max >= 0)
    and (p_duration_minutes is null or p_duration_minutes in (15,30,60,120,180,240,480,720,1440,2880,10080))
    and (p_price_min is null or exists (
      select 1 from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods')='array' then ap.pricing->'periods' else '[]'::jsonb end) p
      where jsonb_typeof(p->'price') in ('number','string')
        and (p->>'price') ~ '^([0-9]+([.][0-9]+)?|[.][0-9]+)$'
        and (p->>'price')::numeric >= p_price_min
        and (p_duration_minutes is null or (p->>'minutes')::integer = p_duration_minutes)))
    and (p_price_max is null or exists (
      select 1 from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods')='array' then ap.pricing->'periods' else '[]'::jsonb end) p
      where jsonb_typeof(p->'price') in ('number','string')
        and (p->>'price') ~ '^([0-9]+([.][0-9]+)?|[.][0-9]+)$'
        and (p->>'price')::numeric <= p_price_max
        and (p_duration_minutes is null or (p->>'minutes')::integer = p_duration_minutes)))
    and not exists (
      select 1 from jsonb_each(case when jsonb_typeof(p_attribute_filters)='object' then p_attribute_filters else '{}'::jsonb end) f(slug,wanted)
      where not exists (
        select 1 from public.profile_attribute_values pav
        join public.category_attributes ca on ca.id=pav.attribute_id
        where pav.profile_id=ap.id and ca.category_id=ap.category_id and ca.slug=f.slug and ca.display_public=true
          and (pav.value=f.wanted or (jsonb_typeof(f.wanted)='array' and jsonb_typeof(pav.value)='array' and pav.value @> f.wanted)
          or (jsonb_typeof(pav.value)='array' and pav.value @> jsonb_build_array(f.wanted)))))
    and not exists (
      select 1 from unnest(coalesce(p_service_slugs,'{}'::text[])) wanted(slug)
      where not exists (
        select 1 from public.profile_services ps
        join public.category_services cs on cs.id=ps.service_id
        where ps.profile_id=ap.id and ps.selected=true and cs.category_id=ap.category_id and cs.slug=wanted.slug and cs.display_public=true))
    and coalesce(p_sort,'recent') in ('recent','price_asc','price_desc','name')
  order by
    case when coalesce(p_sort,'recent')='price_asc' then priced.sort_price end asc nulls last,
    case when coalesce(p_sort,'recent')='price_desc' then priced.sort_price end desc nulls last,
    case when coalesce(p_sort,'recent')='name' then lower(coalesce(ap.display_name,ap.title,'')) end asc nulls last,
    case when coalesce(p_sort,'recent')='recent' then ap.created_at end desc nulls last,
    ap.created_at desc, ap.id
  limit greatest(1,least(coalesce(p_limit,48),100))
  offset greatest(coalesce(p_offset,0),0);
$function$;

revoke all on function public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,text,integer,integer) from public, anon, authenticated;
grant execute on function public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,text,integer,integer) to anon, authenticated;
