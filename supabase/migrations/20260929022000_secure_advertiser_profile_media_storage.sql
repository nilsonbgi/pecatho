-- Keep advertiser profile media behind Storage RLS.
update storage.buckets set public=false where id='pecatho-media';

drop policy if exists "profile media owner insert" on storage.objects;
drop policy if exists "profile media owner select" on storage.objects;
drop policy if exists "profile media owner update" on storage.objects;
drop policy if exists "profile media owner delete" on storage.objects;

create policy "profile media owner insert" on storage.objects for insert to authenticated
with check (bucket_id='pecatho-media' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy "profile media owner select" on storage.objects for select to authenticated
using (bucket_id='pecatho-media' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy "profile media owner update" on storage.objects for update to authenticated
using (bucket_id='pecatho-media' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='pecatho-media' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy "profile media owner delete" on storage.objects for delete to authenticated
using (bucket_id='pecatho-media' and (storage.foldername(name))[1]=(select auth.uid())::text);