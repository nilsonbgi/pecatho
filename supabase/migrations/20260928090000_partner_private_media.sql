insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'pecatho-partner-media',
  'pecatho-partner-media',
  false,
  52428800,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']::text[]
)
on conflict (id) do update
set public=false,
    file_size_limit=52428800,
    allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "partner media owner insert" on storage.objects;
drop policy if exists "partner media owner select" on storage.objects;
drop policy if exists "partner media owner update" on storage.objects;
drop policy if exists "partner media owner delete" on storage.objects;

create policy "partner media owner insert"
on storage.objects for insert to authenticated
with check (
  bucket_id='pecatho-partner-media'
  and (storage.foldername(name))[1]=auth.uid()::text
);

create policy "partner media owner select"
on storage.objects for select to authenticated
using (
  bucket_id='pecatho-partner-media'
  and (storage.foldername(name))[1]=auth.uid()::text
);

create policy "partner media owner update"
on storage.objects for update to authenticated
using (
  bucket_id='pecatho-partner-media'
  and (storage.foldername(name))[1]=auth.uid()::text
)
with check (
  bucket_id='pecatho-partner-media'
  and (storage.foldername(name))[1]=auth.uid()::text
);

create policy "partner media owner delete"
on storage.objects for delete to authenticated
using (
  bucket_id='pecatho-partner-media'
  and (storage.foldername(name))[1]=auth.uid()::text
);
