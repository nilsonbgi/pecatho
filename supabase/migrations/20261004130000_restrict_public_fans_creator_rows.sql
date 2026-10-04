-- Keep creator ownership identifiers private while preserving the public Fans directory.
create or replace function private.get_public_fans_creators(p_limit integer default 24)
returns table(id uuid, slug text, display_name text, bio text, avatar_url text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.slug, c.display_name, c.bio, c.avatar_url, c.status
  from public.fans_creators c
  where c.status = 'active'
  order by c.display_name asc, c.id asc
  limit greatest(1, least(coalesce(p_limit, 24), 100));
$$;

create or replace function private.get_public_fans_creators_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::bigint
  from public.fans_creators c
  where c.status = 'active';
$$;

revoke all on function private.get_public_fans_creators(integer) from public, anon, authenticated;
revoke all on function private.get_public_fans_creators_count() from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.get_public_fans_creators(integer) to anon, authenticated;
grant execute on function private.get_public_fans_creators_count() to anon, authenticated;

create or replace function public.get_public_fans_creators(p_limit integer default 24)
returns table(id uuid, slug text, display_name text, bio text, avatar_url text, status text)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_public_fans_creators(p_limit);
$$;

create or replace function public.get_public_fans_creators_count()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select private.get_public_fans_creators_count();
$$;

revoke all on function public.get_public_fans_creators(integer) from public;
revoke all on function public.get_public_fans_creators_count() from public;
grant execute on function public.get_public_fans_creators(integer) to anon, authenticated;
grant execute on function public.get_public_fans_creators_count() to anon, authenticated;

drop policy if exists fans_creators_public_select on public.fans_creators;
