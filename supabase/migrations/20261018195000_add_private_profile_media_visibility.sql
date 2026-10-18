-- Allow profile owners to keep uploaded media private until they explicitly opt in.
-- Public and paid remain separate choices; moderation is an independent gate.
ALTER TABLE public.profile_media DROP CONSTRAINT IF EXISTS profile_media_access_type_check;
ALTER TABLE public.profile_media
  ADD CONSTRAINT profile_media_access_type_check
  CHECK (access_type = ANY (ARRAY['private'::text, 'public'::text, 'paid'::text]));

COMMENT ON CONSTRAINT profile_media_access_type_check ON public.profile_media IS
  'private means owner-only; public means explicitly opted-in public media; paid means content sold after confirmed payment.';
