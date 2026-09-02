create or replace function public.search_public_advertisers(
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
  p_limit integer default 48,
  p_offset integer default 0
)
returns table (id uuid, slug text, title text, display_name text, summary text, city_id bigint, state_id bigint, category_id bigint, verification_status text, created_at timestamptz)
language sql security definer
set search_path = public, private
as $$
  select ap.id, ap.slug::text, ap.title, ap.display_name, ap.summary, ap.city_id, ap.state_id, ap.category_id, ap.verification_status::text, ap.created_at
  from public.advertiser_profiles ap
  where ap.status::text = 'published'
    and (p_category_id is null or ap.category_id = p_category_id)
    and (p_state_id is null or ap.state_id = p_state_id)
    and (p_city_id is null or ap.city_id = p_city_id)
    and (nullif(trim(coalesce(p_query, '')), '') is null or ap.title ilike '%' || trim(p_query) || '%' or ap.display_name ilike '%' || trim(p_query) || '%' or ap.summary ilike '%' || trim(p_query) || '%')
    and (p_age_min is null or ap.birth_date <= (current_date - make_interval(years => p_age_min))::date)
    and (p_age_max is null or ap.birth_date > (current_date - make_interval(years => p_age_max + 1))::date)
    and (p_price_min is null or exists (select 1 from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods')='array' then ap.pricing->'periods' else '[]'::jsonb end) p where (p->>'price')::numeric >= p_price_min))
    and (p_price_max is null or exists (select 1 from jsonb_array_elements(case when jsonb_typeof(ap.pricing->'periods')='array' then ap.pricing->'periods' else '[]'::jsonb end) p where (p->>'price')::numeric <= p_price_max))
    and not exists (
      select 1 from jsonb_each(coalesce(p_attribute_filters, '{}'::jsonb)) f(slug, wanted)
      where not exists (
        select 1 from public.profile_attribute_values pav
        join public.category_attributes ca on ca.id = pav.attribute_id
        where pav.profile_id = ap.id and ca.category_id = ap.category_id and ca.slug = f.slug and ca.display_public = true
          and (pav.value = f.wanted or (jsonb_typeof(f.wanted)='array' and jsonb_typeof(pav.value)='array' and pav.value @> f.wanted) or (jsonb_typeof(pav.value)='array' and pav.value @> jsonb_build_array(f.wanted)))
      )
    )
    and not exists (
      select 1 from unnest(coalesce(p_service_slugs, '{}'::text[])) wanted(slug)
      where not exists (
        select 1 from public.profile_services ps
        join public.category_services cs on cs.id = ps.service_id
        where ps.profile_id = ap.id and ps.selected = true and cs.category_id = ap.category_id and cs.slug = wanted.slug and cs.display_public = true
      )
    )
  order by ap.created_at desc
  limit greatest(1, least(coalesce(p_limit, 48), 100)) offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer) from public, anon, authenticated;
revoke all on function public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,integer) from public, anon;
grant execute on function public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,integer) to anon, authenticated;
