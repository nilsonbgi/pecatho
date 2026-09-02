revoke execute on function public.bootstrap_first_super_admin() from public, anon, authenticated;
grant execute on function public.bootstrap_first_super_admin() to authenticated;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

revoke execute on function public.complete_registration_intent(uuid) from public, anon, authenticated;
grant execute on function public.complete_registration_intent(uuid) to authenticated;

revoke execute on function public.consume_registration_intent(uuid) from public, anon, authenticated;
grant execute on function public.consume_registration_intent(uuid) to authenticated;

revoke execute on function public.update_my_address(text,text,text,text,bigint,bigint,bigint) from public, anon, authenticated;
grant execute on function public.update_my_address(text,text,text,text,bigint,bigint,bigint) to authenticated;

revoke execute on function public.update_my_profile(text,text,text,date) from public, anon, authenticated;
revoke execute on function public.update_my_profile(text,text,text,date,text) from public, anon, authenticated;
grant execute on function public.update_my_profile(text,text,text,date) to authenticated;
grant execute on function public.update_my_profile(text,text,text,date,text) to authenticated;

revoke execute on function public.get_public_advertiser_location(uuid) from public;
grant execute on function public.get_public_advertiser_location(uuid) to anon, authenticated;

revoke execute on function public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,integer) from public;
grant execute on function public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,integer) to anon, authenticated;

create or replace function private.hash_review_invite_token(raw_token text)
returns text
language sql
immutable
set search_path = pg_catalog, extensions
as $$
  select encode(digest(raw_token, 'sha256'), 'hex')
$$;

revoke all on function private.hash_review_invite_token(text) from public, anon, authenticated;
