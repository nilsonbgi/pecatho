-- Store a content fingerprint for every newly uploaded Fans media object.
-- Existing rows remain valid and are not rewritten; new uploads are fingerprinted server-side.
alter table public.fans_post_media
  add column if not exists content_sha256 text;

alter table public.fans_post_media
  add constraint fans_post_media_content_sha256_format
  check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$');

create unique index if not exists fans_post_media_content_sha256_unique
  on public.fans_post_media (content_sha256)
  where content_sha256 is not null;

comment on column public.fans_post_media.content_sha256 is
  'SHA-256 fingerprint computed server-side for duplicate media prevention; null for legacy rows pending migration.';
