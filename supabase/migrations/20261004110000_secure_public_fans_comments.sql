-- Public Fans comments expose only display-safe fields and only for published posts.
-- Direct table reads are restricted to the authenticated comment owner.
create or replace function private.get_public_fans_comments(p_post_id uuid)
returns table(id uuid, body text, created_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  select c.id, c.body, c.created_at
  from public.fans_comments c
  join public.fans_posts p on p.id = c.post_id
  join public.fans_creators cr on cr.id = p.creator_id
  where c.post_id = p_post_id
    and c.status = 'visible'
    and p.status = 'published'
    and cr.status = 'active'
  order by c.created_at desc
  limit 20;
$$;

revoke all on function private.get_public_fans_comments(uuid) from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.get_public_fans_comments(uuid) to anon, authenticated;

create or replace function public.get_public_fans_comments(p_post_id uuid)
returns table(id uuid, body text, created_at timestamptz)
language sql
security invoker
set search_path = ''
as $$
  select * from private.get_public_fans_comments(p_post_id);
$$;

revoke all on function public.get_public_fans_comments(uuid) from public;
grant execute on function public.get_public_fans_comments(uuid) to anon, authenticated;

drop policy if exists fans_comments_select on public.fans_comments;
drop policy if exists fans_comments_owner_select on public.fans_comments;
create policy fans_comments_owner_select
  on public.fans_comments
  for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.fans_comments to authenticated;
grant insert, update, delete on public.fans_comments to authenticated;
