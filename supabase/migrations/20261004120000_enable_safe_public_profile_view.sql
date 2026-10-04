-- Make the existing security-invoker public_profiles view usable by anonymous clients
-- without exposing private columns from public.profiles.
-- RLS only admits active profiles; column-level privileges expose only fields
-- already selected by public_profiles (never legal_name, email, phone, CPF, birth date,
-- verification status, timezone, last login, or account type).
drop policy if exists profiles_public_fields_select on public.profiles;
create policy profiles_public_fields_select
  on public.profiles
  for select
  to anon
  using (status = 'active');

revoke select on public.profiles from anon;
grant select (id, username, display_name, avatar_media_id, locale, created_at)
  on public.profiles to anon;
