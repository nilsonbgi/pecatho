-- Keep individual like identities private while preserving public totals and own-like state.
create or replace function private.get_public_fans_like_summary(p_post_id uuid)
returns table(likes_count bigint, viewer_liked boolean)
language sql
security definer
set search_path = ''
as $$
  select
    (select count(*)::bigint from public.fans_likes l where l.post_id = p.id),
    exists(
      select 1 from public.fans_likes l
      where l.post_id = p.id
        and l.user_id = (select auth.uid())
    )
  from public.fans_posts p
  join public.fans_creators cr on cr.id = p.creator_id
  where p.id = p_post_id
    and p.status = 'published'
    and cr.status = 'active'
  limit 1;
$$;

revoke all on function private.get_public_fans_like_summary(uuid) from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.get_public_fans_like_summary(uuid) to anon, authenticated;

create or replace function public.get_public_fans_like_summary(p_post_id uuid)
returns table(likes_count bigint, viewer_liked boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from private.get_public_fans_like_summary(p_post_id);
$$;

revoke all on function public.get_public_fans_like_summary(uuid) from public;
grant execute on function public.get_public_fans_like_summary(uuid) to anon, authenticated;

drop policy if exists fans_likes_select on public.fans_likes;
drop policy if exists fans_likes_owner_select on public.fans_likes;
create policy fans_likes_owner_select
  on public.fans_likes
  for select to authenticated
  using (user_id = (select auth.uid()));
grant select on public.fans_likes to authenticated;
grant insert, delete on public.fans_likes to authenticated;
