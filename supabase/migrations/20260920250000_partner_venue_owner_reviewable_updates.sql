drop policy if exists partner_venues_owner_update on public.partner_venues;

create policy partner_venues_owner_update
on public.partner_venues
for update
to authenticated
using (owner_user_id = auth.uid())
with check (
  owner_user_id = auth.uid()
  and status in ('draft','pending_review','rejected','paused')
);
