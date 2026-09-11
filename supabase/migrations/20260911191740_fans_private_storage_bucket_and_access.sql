-- Pecatho Fans: private media bucket and owner storage policies.
-- The application serves authorized Fans media through short-lived signed URLs.

insert into storage.buckets (id, name, public)
values ('fans-private', 'fans-private', false)
on conflict (id) do update set public = false;

drop policy if exists fans_private_owner_insert on storage.objects;
create policy fans_private_owner_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'fans-private' and owner_id = (select auth.uid()::text));

drop policy if exists fans_private_owner_select on storage.objects;
create policy fans_private_owner_select
  on storage.objects for select to authenticated
  using (bucket_id = 'fans-private' and owner_id = (select auth.uid()::text));

drop policy if exists fans_private_owner_update on storage.objects;
create policy fans_private_owner_update
  on storage.objects for update to authenticated
  using (bucket_id = 'fans-private' and owner_id = (select auth.uid()::text))
  with check (bucket_id = 'fans-private' and owner_id = (select auth.uid()::text));

drop policy if exists fans_private_owner_delete on storage.objects;
create policy fans_private_owner_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'fans-private' and owner_id = (select auth.uid()::text));
