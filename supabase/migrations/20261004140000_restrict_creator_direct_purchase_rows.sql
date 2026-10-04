-- Purchases include buyer UUIDs and payment-provider references.
-- Public-facing creator sales pages already read these rows server-side through the
-- service-role client after resolving the authenticated creator, so the Data API
-- must not expose complete purchase rows to creators.
-- Buyers retain access to their own purchase records.
drop policy if exists fans_purchases_participant_select on public.fans_purchases;
drop policy if exists fans_purchases_buyer_select on public.fans_purchases;

create policy fans_purchases_buyer_select
  on public.fans_purchases
  for select
  to authenticated
  using (buyer_user_id = (select auth.uid()));
