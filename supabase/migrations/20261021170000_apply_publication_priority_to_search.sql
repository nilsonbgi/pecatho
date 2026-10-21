-- Honor active publication-plan priority in the public companion search results.
-- Keep all existing search filters, sorting modes, pagination and total-count behavior.
-- Existing plans, assignments, prices and commercial records are not modified.
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
      prices.minimum_price,
      coalesce(active_plan.search_priority, 0) as publication_priority,
      coalesce(active_plan.featured_card, false) as publication_featured
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
    left join lateral (
      select
        case
          when pub.plan_features_snapshot ? 'search_priority'
            then coalesce(nullif(pub.plan_features_snapshot->>'search_priority','')::integer, 0)
          else coalesce(pp.search_priority, 0)
        end as search_priority,
        case
          when pub.plan_features_snapshot ? 'featured_card'
            then coalesce(nullif(pub.plan_features_snapshot->>'featured_card','')::boolean, false)
          else coalesce(pp.featured_card, false)
        end as featured_card
      from public.profile_publications pub
      join public.publication_plans pp on pp.id = pub.plan_id
      where pub.profile_id = ap.id
        and pub.status::text = 'published'
        and pub.starts_at <= now()
        and pub.ends_at > now()
        and coalesce(pub.plan_features_snapshot->>'audience', pp.audience) in (
          'both',
          case
            when exists (
              select 1
              from public.fans_creators fc
              where fc.advertiser_profile_id = ap.id
                and fc.status = 'active'
            ) then 'content_seller'
            else 'companion'
          end
        )
      order by
        case
          when pub.plan_features_snapshot ? 'search_priority'
            then coalesce(nullif(pub.plan_features_snapshot->>'search_priority','')::integer, 0)
          else coalesce(pp.search_priority, 0)
        end desc,
        case
          when pub.plan_features_snapshot ? 'featured_card'
            then coalesce(nullif(pub.plan_features_snapshot->>'featured_card','')::boolean, false)
          else coalesce(pp.featured_card, false)
        end desc,
        pub.ends_at desc,
        pub.id
      limit 1
    ) active_plan on true
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
    mp.publication_featured desc,
    mp.publication_priority desc,
    case when p_sort = 'price_asc' then mp.minimum_price end asc nulls last,
    case when p_sort = 'price_desc' then mp.minimum_price end desc nulls last,
    case when p_sort = 'name' then lower(coalesce(mp.display_name, mp.title, '')) end asc nulls last,
    mp.created_at desc,
    mp.id
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
