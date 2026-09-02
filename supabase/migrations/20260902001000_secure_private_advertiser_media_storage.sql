drop policy if exists pecatho_private_owner_insert on storage.objects;
create policy pecatho_private_owner_insert on storage.objects for insert to authenticated with check (bucket_id = 'pecatho-private' and owner_id = (select auth.uid()::text));

drop policy if exists pecatho_private_owner_select on storage.objects;
create policy pecatho_private_owner_select on storage.objects for select to authenticated using (bucket_id = 'pecatho-private' and owner_id = (select auth.uid()::text));

drop policy if exists pecatho_private_owner_update on storage.objects;
create policy pecatho_private_owner_update on storage.objects for update to authenticated using (bucket_id = 'pecatho-private' and owner_id = (select auth.uid()::text)) with check (bucket_id = 'pecatho-private' and owner_id = (select auth.uid()::text));

drop policy if exists pecatho_private_owner_delete on storage.objects;
create policy pecatho_private_owner_delete on storage.objects for delete to authenticated using (bucket_id = 'pecatho-private' and owner_id = (select auth.uid()::text));