drop view if exists public.advertiser_profiles_public;

create or replace function private.get_public_advertiser_profile(p_slug text)
returns table (
  id uuid, slug text, title text, display_name text, summary text, description text,
  status text, verification_status text, city_id bigint, state_id bigint, category_id bigint,
  age_years integer, height_cm numeric, weight_kg numeric, availability text,
  phone text, whatsapp text, positioning text, pricing jsonb, payment_options jsonb,
  social_links jsonb, public_latitude numeric, public_longitude numeric, is_owner boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    p.id,p.slug,p.title,p.display_name,p.summary,p.description,p.status,p.verification_status,
    p.city_id,p.state_id,p.category_id,
    case when p.birth_date is null then null
         else pg_catalog.date_part('year', pg_catalog.age(current_date,p.birth_date))::integer
    end,
    p.height_cm,p.weight_kg,p.availability,p.phone,p.whatsapp,p.positioning,
    p.pricing,p.payment_options,p.social_links,ua.public_latitude,ua.public_longitude,
    ((select auth.uid()) is not null and (select auth.uid())=p.user_id)
  from public.advertiser_profiles p
  left join public.user_addresses ua on ua.user_id=p.user_id and ua.is_primary=true
  where p.slug=p_slug and p.status='published'
  limit 1;
$$;

revoke execute on function private.get_public_advertiser_profile(text) from public;
revoke execute on function private.get_public_advertiser_profile(text) from anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.get_public_advertiser_profile(text) to anon, authenticated;

create or replace function public.get_public_advertiser_profile(p_slug text)
returns table (
  id uuid, slug text, title text, display_name text, summary text, description text,
  status text, verification_status text, city_id bigint, state_id bigint, category_id bigint,
  age_years integer, height_cm numeric, weight_kg numeric, availability text,
  phone text, whatsapp text, positioning text, pricing jsonb, payment_options jsonb,
  social_links jsonb, public_latitude numeric, public_longitude numeric, is_owner boolean
)
language sql
security invoker
set search_path = ''
stable
as $$
  select * from private.get_public_advertiser_profile(p_slug);
$$;

revoke execute on function public.get_public_advertiser_profile(text) from public;
grant execute on function public.get_public_advertiser_profile(text) to anon, authenticated;
