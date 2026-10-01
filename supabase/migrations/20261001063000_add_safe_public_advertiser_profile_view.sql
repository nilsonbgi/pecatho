create or replace view public.advertiser_profiles_public as
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
    else extract(year from age(current_date, p.birth_date))::integer
  end as age_years,
  p.height_cm,
  p.weight_kg,
  p.availability,
  p.phone,
  p.whatsapp,
  p.positioning,
  p.pricing,
  p.payment_options,
  p.social_links,
  ua.public_latitude,
  ua.public_longitude,
  ((select auth.uid()) is not null and (select auth.uid()) = p.user_id) as is_owner
from public.advertiser_profiles p
left join public.user_addresses ua
  on ua.user_id = p.user_id
 and ua.is_primary = true
where p.status = 'published';

grant select on public.advertiser_profiles_public to anon, authenticated;
