-- Public, aggregated Fans leaderboard. Never exposes reaction/comment identities.
create or replace function public.get_public_fans_creator_leaderboard(p_limit integer default 24)
returns table (
  id uuid,
  slug text,
  display_name text,
  bio text,
  avatar_url text,
  reputation_score bigint,
  reputation_level text,
  positive_likes bigint,
  visible_comments bigint,
  positive_reactions bigint
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  with eligible_creators as (
    select c.id, c.user_id, c.slug, c.display_name, c.bio, c.avatar_url, c.created_at
    from public.fans_creators c
    where c.status = 'active'
  ),
  published_posts as (
    select p.id, p.creator_id
    from public.fans_posts p
    join eligible_creators c on c.id = p.creator_id
    where p.status = 'published'
  ),
  likes_by_creator as (
    select p.creator_id, count(*)::bigint as total
    from published_posts p
    join public.fans_likes l on l.post_id = p.id
    join eligible_creators c on c.id = p.creator_id
    where c.user_id is null or l.user_id <> c.user_id
    group by p.creator_id
  ),
  comments_by_creator as (
    select p.creator_id, count(*)::bigint as total
    from published_posts p
    join public.fans_comments cm on cm.post_id = p.id
    join eligible_creators c on c.id = p.creator_id
    where cm.status = 'visible'
      and (c.user_id is null or cm.user_id <> c.user_id)
    group by p.creator_id
  ),
  reactions_by_creator as (
    select p.creator_id, count(*)::bigint as total
    from published_posts p
    join public.fans_post_reactions r on r.post_id = p.id
    join eligible_creators c on c.id = p.creator_id
    where c.user_id is null or r.user_id <> c.user_id
    group by p.creator_id
  ),
  scored as (
    select c.id, c.slug, c.display_name, c.bio, c.avatar_url, c.created_at,
      coalesce(l.total, 0)::bigint as likes,
      coalesce(cm.total, 0)::bigint as comments,
      coalesce(r.total, 0)::bigint as reactions,
      (coalesce(l.total, 0) + coalesce(cm.total, 0) * 2 + coalesce(r.total, 0))::bigint as score
    from eligible_creators c
    left join likes_by_creator l on l.creator_id = c.id
    left join comments_by_creator cm on cm.creator_id = c.id
    left join reactions_by_creator r on r.creator_id = c.id
  )
  select s.id, s.slug, s.display_name, s.bio, s.avatar_url, s.score,
    case
      when s.score >= 1000 then 'Ícone'
      when s.score >= 300 then 'Destaque'
      when s.score >= 100 then 'Popular'
      when s.score >= 25 then 'Em ascensão'
      else 'Iniciante'
    end,
    s.likes, s.comments, s.reactions
  from scored s
  order by s.score desc, (s.likes + s.comments + s.reactions) desc, s.created_at desc
  limit greatest(1, least(coalesce(p_limit, 24), 100))
$function$;

revoke all on function public.get_public_fans_creator_leaderboard(integer) from public;
grant execute on function public.get_public_fans_creator_leaderboard(integer) to anon, authenticated;
