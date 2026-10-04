-- Keep likes tied to a real, published post from an active creator.
-- The user may only create a like for themselves; unlike remains governed by
-- the existing owner-only DELETE policy.
drop policy if exists fans_likes_insert on public.fans_likes;

create policy fans_likes_insert
  on public.fans_likes
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.fans_posts p
      join public.fans_creators c on c.id = p.creator_id
      where p.id = fans_likes.post_id
        and p.status = 'published'
        and c.status = 'active'
    )
  );
