-- Public delivery bucket for approved Pecatho advertising artwork.
-- Reads are public because campaign creatives are public; uploads remain staff-only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pecatho-banners',
  'pecatho-banners',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS pecatho_banners_staff_insert ON storage.objects;
CREATE POLICY pecatho_banners_staff_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pecatho-banners'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  AND (SELECT private.is_staff())
);
