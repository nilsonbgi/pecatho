-- Never expose complete user_addresses rows to anonymous clients.
-- RLS filters rows, not columns; a location-only row policy still reveals street,
-- number, complement, ZIP code, user_id and internal coordinates through direct SELECT.
-- Public pages must use get_public_advertiser_location(uuid), which returns only
-- intentionally public coordinates for a published advertiser profile.
drop policy if exists user_addresses_public_location on public.user_addresses;
drop policy if exists user_addresses_public_select on public.user_addresses;
