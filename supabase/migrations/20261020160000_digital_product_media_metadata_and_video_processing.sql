-- Metadata required to group digital product assets by original aspect ratio.
-- Existing assets remain valid; dimensions are populated for new uploads and backfilled only when re-uploaded.
alter table public.digital_content_product_items
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists duration_seconds numeric(12,3),
  add column if not exists video_processing_status text not null default 'not_required',
  add column if not exists video_processing_error text,
  add column if not exists video_processed_at timestamptz,
  add column if not exists preview_storage_path text,
  add column if not exists preview_mime_type text,
  add column if not exists preview_size_bytes bigint,
  add column if not exists is_large_media boolean not null default false;

alter table public.digital_content_product_items
  drop constraint if exists digital_content_product_items_video_processing_status_check;

alter table public.digital_content_product_items
  add constraint digital_content_product_items_video_processing_status_check
  check (video_processing_status in ('not_required','not_configured','queued','processing','ready','failed'));

alter table public.digital_content_product_items
  drop constraint if exists digital_content_product_items_dimensions_check;

alter table public.digital_content_product_items
  add constraint digital_content_product_items_dimensions_check
  check ((width is null or width > 0) and (height is null or height > 0) and (duration_seconds is null or duration_seconds > 0));

create index if not exists digital_content_product_items_product_media_dimensions_idx
  on public.digital_content_product_items (product_id, media_type, width, height, sort_order);

create index if not exists digital_content_product_items_large_media_idx
  on public.digital_content_product_items (product_id, is_large_media, media_type);
