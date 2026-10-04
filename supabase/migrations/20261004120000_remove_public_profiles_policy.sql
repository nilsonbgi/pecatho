-- profiles contains private identity data (legal name, email, phone, CPF, birth date,
-- account metadata). Public pages must use purpose-built public profile RPCs and
-- advertiser/Fans public profile tables rather than direct profile-row access.
drop policy if exists profiles_public_fields_select on public.profiles;
