-- Defense in depth: inserts that omit visibility fields must not publish media.
ALTER TABLE public.profile_media
  ALTER COLUMN access_type SET DEFAULT 'private',
  ALTER COLUMN show_in_cards SET DEFAULT false,
  ALTER COLUMN show_in_gallery SET DEFAULT false;

ALTER TABLE public.profile_media
  DROP CONSTRAINT IF EXISTS profile_media_visibility_consistency_check;

ALTER TABLE public.profile_media
  ADD CONSTRAINT profile_media_visibility_consistency_check
  CHECK (
    (access_type = 'public' AND is_public = true)
    OR (access_type IN ('private', 'paid') AND is_public = false)
  );

COMMENT ON CONSTRAINT profile_media_visibility_consistency_check ON public.profile_media IS
  'Only an explicitly public media item may have is_public=true; private and paid media stay non-public at storage/listing level.';
