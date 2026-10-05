-- Keep profile edits on the validated RPC for identity-sensitive fields.
-- The regular profile page uses update_my_profile/update_my_address; avatar presentation
-- is handled by dedicated RPCs. Preserve only non-authoritative presentation columns
-- for direct authenticated updates and retain all existing RLS policies/triggers.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;

REVOKE UPDATE (
  id,
  username,
  display_name,
  legal_name,
  email,
  phone,
  cpf,
  birth_date,
  status,
  verification_status,
  avatar_media_id,
  locale,
  timezone,
  last_login_at,
  created_at,
  updated_at,
  account_type
) ON TABLE public.profiles FROM authenticated;

GRANT UPDATE (
  username,
  display_name,
  phone,
  avatar_media_id,
  locale,
  timezone,
  updated_at
) ON TABLE public.profiles TO authenticated;
