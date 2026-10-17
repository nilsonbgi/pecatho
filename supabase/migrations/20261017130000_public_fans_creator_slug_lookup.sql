-- Allow a public Fans profile to resolve one active creator by slug without
-- granting public SELECT access to the underlying fans_creators table.
create or replace function private.get_public_fans_creator_by_slug(p_slug text)
returns table(id uuid, slug text, display_name text, bio text, avatar_url text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.slug, c.display_name, c.bio, c.avatar_url, c.status
  from public.fans_creators c
  where c.status = 'active'
    and c.slug = p_slug
  limit 1;
$$;

revoke all on function private.get_public_fans_creator_by_slug(text) from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.get_public_fans_creator_by_slug(text) to anon, authenticated;

create or replace function public.get_public_fans_creator_by_slug(p_slug text)
returns table(id uuid, slug text, display_name text, bio text, avatar_url text, status text)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_public_fans_creator_by_slug(p_slug);
$$;

revoke all on function public.get_public_fans_creator_by_slug(text) from public;
grant execute on function public.get_public_fans_creator_by_slug(text) to anon, authenticated;
