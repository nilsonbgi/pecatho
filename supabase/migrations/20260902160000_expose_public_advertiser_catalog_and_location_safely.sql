create or replace function public.get_public_advertiser_location(p_profile_id uuid)
returns table (public_latitude numeric, public_longitude numeric)
language sql
security definer
set search_path = public, private
as $$
  select ua.public_latitude, ua.public_longitude
  from public.advertiser_profiles ap
  join public.user_addresses ua on ua.user_id = ap.user_id and ua.is_primary = true
  where ap.id = p_profile_id
    and ap.status::text = 'published'
    and ua.public_latitude is not null
    and ua.public_longitude is not null
  limit 1;
$$;

revoke all on function public.get_public_advertiser_location(uuid) from public, anon, authenticated;
grant execute on function public.get_public_advertiser_location(uuid) to anon, authenticated;

create policy profile_attribute_values_public_published_select
on public.profile_attribute_values
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.advertiser_profiles ap
    join public.category_attributes ca on ca.id = profile_attribute_values.attribute_id
    where ap.id = profile_attribute_values.profile_id
      and ap.status::text = 'published'
      and ca.category_id = ap.category_id
      and ca.display_public = true
  )
);

create policy profile_services_public_published_select
on public.profile_services
for select
to anon, authenticated
using (
  selected = true
  and exists (
    select 1
    from public.advertiser_profiles ap
    join public.category_services cs on cs.id = profile_services.service_id
    where ap.id = profile_services.profile_id
      and ap.status::text = 'published'
      and cs.category_id = ap.category_id
      and cs.display_public = true
  )
);
