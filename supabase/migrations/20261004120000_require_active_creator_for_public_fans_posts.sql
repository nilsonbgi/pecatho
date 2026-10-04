-- Public free Fans posts must belong to an active creator.
-- Preserve visibility of published free/zero-price posts for active creators.
drop policy if exists fans_posts_public_select on public.fans_posts;

create policy fans_posts_public_select
  on public.fans_posts
  for select
  to anon, authenticated
  using (
    status = 'published'
    and (access_type = 'free' or price = 0)
    and exists (
      select 1
      from public.fans_creators c
      where c.id = fans_posts.creator_id
        and c.status = 'active'
    )
  );
