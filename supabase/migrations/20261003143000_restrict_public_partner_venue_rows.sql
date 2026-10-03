create or replace function private.get_public_partner_venues(p_slug text default null)
returns table (
  id uuid,
  name text,
  slug text,
  venue_type text,
  description text,
  phone text,
  website_url text,
  instagram_url text,
  state_id bigint,
  city_id bigint,
  tagline text,
  highlights text,
  recruitment_enabled boolean,
  recruitment_title text,
  recruitment_description text,
  recruitment_contact_phone text,
  recruitment_contact_email text,
  recruitment_contact_whatsapp text
)
language sql
security definer
set search_path = ''
as $$
  select
    v.id,
    v.name,
    v.slug,
    v.venue_type,
    v.description,
    v.phone,
    v.website_url,
    v.instagram_url,
    v.state_id,
    v.city_id,
    v.tagline,
    v.highlights,
    v.recruitment_enabled,
    v.recruitment_title,
    v.recruitment_description,
    v.recruitment_contact_phone,
    v.recruitment_contact_email,
    v.recruitment_contact_whatsapp
  from public.partner_venues v
  where v.status = 'published'
    and (p_slug is null or v.slug = p_slug)
  order by v.name;
$$;

revoke all on function private.get_public_partner_venues(text) from public, anon, authenticated;

create or replace function public.get_public_partner_venues(p_slug text default null)
returns table (
  id uuid,
  name text,
  slug text,
  venue_type text,
  description text,
  phone text,
  website_url text,
  instagram_url text,
  state_id bigint,
  city_id bigint,
  tagline text,
  highlights text,
  recruitment_enabled boolean,
  recruitment_title text,
  recruitment_description text,
  recruitment_contact_phone text,
  recruitment_contact_email text,
  recruitment_contact_whatsapp text
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.get_public_partner_venues(p_slug);
$$;

revoke all on function public.get_public_partner_venues(text) from public;
grant execute on function public.get_public_partner_venues(text) to anon, authenticated;

drop policy if exists "partner_venues_public_select" on public.partner_venues;
