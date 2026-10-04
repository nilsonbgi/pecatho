-- Keep purchase rows scoped by RLS and prevent direct clients from reading
-- buyer identity, payment-provider references, or internal order identifiers.
-- The advertiser dashboard only needs these non-sensitive fields for sales metrics.
revoke select on table public.profile_media_purchases from authenticated;

grant select (
  id,
  media_id,
  amount,
  currency,
  status,
  purchased_at,
  expires_at,
  created_at
)
on table public.profile_media_purchases
to authenticated;
