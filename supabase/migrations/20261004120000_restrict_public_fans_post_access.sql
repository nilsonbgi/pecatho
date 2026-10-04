-- Public direct reads must be limited to genuinely free Fans posts.
-- A zero price alone must not make subscriber/paid content publicly readable.
drop policy if exists fans_posts_public_select on public.fans_posts;

create policy fans_posts_public_select
  on public.fans_posts
  for select
  to anon, authenticated
  using (
    status = 'published'
    and access_type = 'free'
    and exists (
      select 1
      from public.fans_creators c
      where c.id = fans_posts.creator_id
        and c.status = 'active'
    )
  );
