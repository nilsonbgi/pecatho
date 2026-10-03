drop policy if exists "public_partners" on public.partners;

drop policy if exists "partners_staff_select" on public.partners;

create policy "partners_staff_select"
on public.partners
for select
to authenticated
using (private.is_staff());
