-- Protect personal contact details on advertiser profiles that are linked to an active Pecatho Fans creator.
-- Companions keep the existing public WhatsApp/phone behavior. The linked content seller's
-- personal contact is returned only to the owner or to an active customer Premium subscriber
-- whose subscription explicitly grants private_seller_contact.
create or replace function private.get_public_advertiser_profile(p_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  display_name text,
  summary text,
  description text,
  status text,
  verification_status text,
  city_id bigint,
  state_id bigint,
  category_id bigint,
  age_years integer,
  height_cm numeric,
  weight_kg numeric,
  availability text,
  phone text,
  whatsapp text,
  positioning text,
  pricing jsonb,
  payment_options jsonb,
  social_links jsonb,
  public_latitude numeric,
  public_longitude numeric,
  is_owner boolean
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    p.id,
    p.slug,
    p.title,
    p.display_name,
    p.summary,
    p.description,
    p.status,
    p.verification_status,
    p.city_id,
    p.state_id,
    p.category_id,
    case
      when p.birth_date is null then null
      else pg_catalog.date_part('year', pg_catalog.age(current_date, p.birth_date))::integer
    end,
    p.height_cm,
    p.weight_kg,
    p.availability,
    case
      when (select auth.uid()) = p.user_id then p.phone
      when not exists (
        select 1
        from public.fans_creators fc
        where fc.advertiser_profile_id = p.id
          and fc.status = 'active'
      ) then p.phone
      when exists (
        select 1
        from public.pecatho_customer_premium_subscriptions s
        where s.user_id = (select auth.uid())
          and s.status = 'active'
          and s.starts_at <= pg_catalog.now()
          and s.ends_at > pg_catalog.now()
          and s.feature_flags -> 'private_seller_contact' = 'true'::jsonb
      ) then p.phone
      else null
    end,
    case
      when (select auth.uid()) = p.user_id then p.whatsapp
      when not exists (
        select 1
        from public.fans_creators fc
        where fc.advertiser_profile_id = p.id
          and fc.status = 'active'
      ) then p.whatsapp
      when exists (
        select 1
        from public.pecatho_customer_premium_subscriptions s
        where s.user_id = (select auth.uid())
          and s.status = 'active'
          and s.starts_at <= pg_catalog.now()
          and s.ends_at > pg_catalog.now()
          and s.feature_flags -> 'private_seller_contact' = 'true'::jsonb
      ) then p.whatsapp
      else null
    end,
    p.positioning,
    p.pricing,
    p.payment_options,
    p.social_links,
    ua.public_latitude,
    ua.public_longitude,
    ((select auth.uid()) is not null and (select auth.uid()) = p.user_id)
  from public.advertiser_profiles p
  left join public.user_addresses ua
    on ua.user_id = p.user_id
   and ua.is_primary = true
  where p.slug = p_slug
    and p.status = 'published'
  limit 1;
$function$;
