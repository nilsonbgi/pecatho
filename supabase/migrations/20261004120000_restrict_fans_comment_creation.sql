-- Restrict direct comment creation to the authenticated author and an active,
-- published Fans post. This prevents forged comments against unpublished posts
-- or creators that have been suspended, without changing the existing comment UI.
drop policy if exists fans_comments_insert on public.fans_comments;

create policy fans_comments_insert
  on public.fans_comments
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.fans_posts p
      join public.fans_creators c on c.id = p.creator_id
      where p.id = fans_comments.post_id
        and p.status = 'published'
        and c.status = 'active'
    )
  );
