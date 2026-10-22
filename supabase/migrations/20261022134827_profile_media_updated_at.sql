-- The moderation RPC updates profile_media.updated_at, but the column was absent.
-- Add it so admin approval/rejection persists instead of failing at runtime.
ALTER TABLE public.profile_media
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.profile_media.updated_at IS
  'Timestamp of the latest profile media update, including moderation changes.';
