drop policy if exists partner_venue_media_staff_select on public.partner_venue_media;

create policy partner_venue_media_staff_select
on public.partner_venue_media
for select
to authenticated
using (private.is_staff());
