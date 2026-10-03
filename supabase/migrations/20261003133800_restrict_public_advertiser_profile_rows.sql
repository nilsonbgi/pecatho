-- Remove broad public row access to advertiser_profiles.
-- Public profile presentation is served through get_public_advertiser_profile(),
-- which exposes only fields intended for the public surface.

drop policy if exists "public_published_profiles" on public.advertiser_profiles;
