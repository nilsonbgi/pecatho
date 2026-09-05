-- Compatibility migration for the legacy public advertiser profile.
-- Long-term: migrate the public profile page to public.get_public_advertiser_location(uuid)
-- and remove this compatibility grant/policy.

alter table public.user_addresses enable row level security;

revoke all on table public.user_addresses from anon;

grant select (user_id, is_primary, public_latitude, public_longitude)
on table public.user_addresses
 to anon;

drop policy if exists user_addresses_public_location on public.user_addresses;

create policy user_addresses_public_location
on public.user_addresses
for select
to anon
using (
  is_primary = true
  and public_latitude is not null
  and public_longitude is not null
  and exists (
    select 1
    from public.advertiser_profiles ap
    where ap.user_id = user_addresses.user_id
      and ap.status = 'published'
  )
);
