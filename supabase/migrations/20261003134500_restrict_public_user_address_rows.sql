-- Restrict public access to user_addresses to approximate coordinates only.
-- Full address rows remain available only to the owner/staff policy.
-- The public catalog uses the dedicated get_public_advertiser_location RPC.

drop policy if exists "user_addresses_public_location_select" on public.user_addresses;
