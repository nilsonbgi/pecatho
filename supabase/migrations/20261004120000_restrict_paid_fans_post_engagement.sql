-- Restrict paid-post engagement to the creator and users with a completed purchase.
-- Free-post engagement remains public and existing likes/comments are preserved.
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
    and (
      p.access_type = 'free'
      or (
        (select auth.uid()) is not null
        and (
          cr.user_id = (select auth.uid())
          or exists (
            select 1 from public.fans_purchases fp
            where fp.post_id = p.id
              and fp.buyer_user_id = (select auth.uid())
              and fp.status = 'paid'
          )
        )
      )
    )
  order by c.created_at desc
  limit 20;
$$;

create or replace function private.get_public_fans_like_summary(p_post_id uuid)
returns table(likes_count bigint, viewer_liked boolean)
language sql
security definer
set search_path = ''
as $$
  select
    (select count(*)::bigint from public.fans_likes l where l.post_id = p.id),
    exists (
      select 1 from public.fans_likes l
      where l.post_id = p.id and l.user_id = (select auth.uid())
    )
  from public.fans_posts p
  join public.fans_creators cr on cr.id = p.creator_id
  where p.id = p_post_id
    and p.status = 'published'
    and cr.status = 'active'
    and (
      p.access_type = 'free'
      or (
        (select auth.uid()) is not null
        and (
          cr.user_id = (select auth.uid())
          or exists (
            select 1 from public.fans_purchases fp
            where fp.post_id = p.id
              and fp.buyer_user_id = (select auth.uid())
              and fp.status = 'paid'
          )
        )
      )
    )
  limit 1;
$$;

drop policy if exists fans_comments_insert on public.fans_comments;
create policy fans_comments_insert
  on public.fans_comments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.fans_posts p
      join public.fans_creators c on c.id = p.creator_id
      where p.id = fans_comments.post_id
        and p.status = 'published'
        and c.status = 'active'
        and (
          p.access_type = 'free'
          or c.user_id = (select auth.uid())
          or exists (
            select 1 from public.fans_purchases fp
            where fp.post_id = p.id
              and fp.buyer_user_id = (select auth.uid())
              and fp.status = 'paid'
          )
        )
    )
  );

drop policy if exists fans_likes_insert on public.fans_likes;
create policy fans_likes_insert
  on public.fans_likes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.fans_posts p
      join public.fans_creators c on c.id = p.creator_id
      where p.id = fans_likes.post_id
        and p.status = 'published'
        and c.status = 'active'
        and (
          p.access_type = 'free'
          or c.user_id = (select auth.uid())
          or exists (
            select 1 from public.fans_purchases fp
            where fp.post_id = p.id
              and fp.buyer_user_id = (select auth.uid())
              and fp.status = 'paid'
          )
        )
    )
  );
