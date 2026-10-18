-- Pecatho Fans: social reactions, creator reputation and duplicate-post protection.
-- Keeps existing likes/comments/boosts intact; adds only the missing social layer.

create table if not exists public.fans_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.fans_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('❤️','😍','🔥','👏','😂','😮','💯','😘')),
  created_at timestamptz not null default now(),
  constraint fans_post_reactions_one_per_user_post unique (post_id, user_id)
);

create index if not exists fans_post_reactions_post_emoji_idx
  on public.fans_post_reactions (post_id, emoji);

alter table public.fans_post_reactions enable row level security;

drop policy if exists fans_post_reactions_select_own on public.fans_post_reactions;
create policy fans_post_reactions_select_own
  on public.fans_post_reactions for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists fans_post_reactions_insert_eligible on public.fans_post_reactions;
create policy fans_post_reactions_insert_eligible
  on public.fans_post_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.fans_posts p
      join public.fans_creators c on c.id = p.creator_id
      where p.id = fans_post_reactions.post_id
        and p.status = 'published'
        and c.status = 'active'
        and (c.user_id is null or c.user_id <> (select auth.uid()))
        and (
          p.access_type = 'free'
          or c.user_id = (select auth.uid())
          or exists (
            select 1 from public.fans_purchases fp
            where fp.post_id = p.id
              and fp.buyer_user_id = (select auth.uid())
              and fp.status = 'paid'
          )
          or exists (
            select 1 from public.fans_subscriptions fs
            where fs.creator_id = c.id
              and fs.subscriber_user_id = (select auth.uid())
              and fs.status = 'active'
              and (fs.ends_at is null or fs.ends_at > now())
          )
        )
    )
  );

drop policy if exists fans_post_reactions_delete_own on public.fans_post_reactions;
create policy fans_post_reactions_delete_own
  on public.fans_post_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.fans_post_reactions to authenticated;

create or replace function public.get_public_fans_post_reaction_summary(p_post_id uuid)
returns table (emoji text, reaction_count bigint, viewer_reacted boolean)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select r.emoji,
         count(*)::bigint as reaction_count,
         coalesce(bool_or(r.user_id = auth.uid()), false) as viewer_reacted
  from public.fans_post_reactions r
  where r.post_id = p_post_id
    and exists (
      select 1
      from public.fans_posts p
      join public.fans_creators c on c.id = p.creator_id
      where p.id = p_post_id
        and p.status = 'published'
        and c.status = 'active'
    )
  group by r.emoji
  order by count(*) desc, r.emoji
$function$;

revoke all on function public.get_public_fans_post_reaction_summary(uuid) from public;
grant execute on function public.get_public_fans_post_reaction_summary(uuid) to anon, authenticated;

create or replace function public.get_public_fans_creator_reputation(p_creator_id uuid)
returns table (
  published_posts bigint,
  positive_likes bigint,
  visible_comments bigint,
  positive_reactions bigint,
  reputation_score bigint,
  reputation_level text
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  with eligible_creator as (
    select c.id, c.user_id
    from public.fans_creators c
    where c.id = p_creator_id
      and c.status = 'active'
  ),
  published as (
    select p.id
    from public.fans_posts p
    join eligible_creator c on c.id = p.creator_id
    where p.status = 'published'
  ),
  metrics as (
    select
      (select count(*) from published)::bigint as post_count,
      (select count(*) from public.fans_likes l join published p on p.id = l.post_id
         where not exists (select 1 from eligible_creator c where c.user_id = l.user_id))::bigint as like_count,
      (select count(*) from public.fans_comments cm join published p on p.id = cm.post_id
         where cm.status = 'visible'
           and not exists (select 1 from eligible_creator c where c.user_id = cm.user_id))::bigint as comment_count,
      (select count(*) from public.fans_post_reactions r join published p on p.id = r.post_id
         where not exists (select 1 from eligible_creator c where c.user_id = r.user_id))::bigint as reaction_count
  )
  select post_count,
         like_count,
         comment_count,
         reaction_count,
         (like_count + comment_count * 2 + reaction_count)::bigint as score,
         case
           when like_count + comment_count * 2 + reaction_count >= 1000 then 'Ícone'
           when like_count + comment_count * 2 + reaction_count >= 300 then 'Destaque'
           when like_count + comment_count * 2 + reaction_count >= 100 then 'Popular'
           when like_count + comment_count * 2 + reaction_count >= 25 then 'Em ascensão'
           else 'Iniciante'
         end as level
  from metrics
  where exists (select 1 from eligible_creator)
$function$;

revoke all on function public.get_public_fans_creator_reputation(uuid) from public;
grant execute on function public.get_public_fans_creator_reputation(uuid) to anon, authenticated;

create or replace function public.prevent_duplicate_fans_post_content()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if new.status not in ('archived', 'rejected')
     and nullif(regexp_replace(lower(btrim(coalesce(new.title, ''))), '\s+', ' ', 'g'), '') is not null
     and exists (
       select 1
       from public.fans_posts p
       where p.creator_id = new.creator_id
         and p.id is distinct from new.id
         and p.status not in ('archived', 'rejected')
         and p.created_at >= now() - interval '30 days'
         and regexp_replace(lower(btrim(coalesce(p.title, ''))), '\s+', ' ', 'g')
             = regexp_replace(lower(btrim(coalesce(new.title, ''))), '\s+', ' ', 'g')
         and regexp_replace(lower(btrim(coalesce(p.body, ''))), '\s+', ' ', 'g')
             = regexp_replace(lower(btrim(coalesce(new.body, ''))), '\s+', ' ', 'g')
     ) then
    raise exception using
      errcode = '23505',
      message = 'duplicate_fans_post_content',
      detail = 'Já existe uma publicação com o mesmo título e texto nos últimos 30 dias. Edite a publicação existente ou altere o conteúdo.';
  end if;
  return new;
end
$function$;

drop trigger if exists fans_posts_prevent_duplicate_content on public.fans_posts;
create trigger fans_posts_prevent_duplicate_content
before insert or update of creator_id, title, body, status
on public.fans_posts
for each row execute function public.prevent_duplicate_fans_post_content();

create or replace function public.prevent_reuse_of_fans_media_object()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if exists (
    select 1
    from public.fans_post_media m
    where m.storage_bucket = new.storage_bucket
      and m.storage_path = new.storage_path
      and m.post_id is distinct from new.post_id
  ) then
    raise exception using
      errcode = '23505',
      message = 'fans_media_object_already_attached',
      detail = 'Este arquivo já está vinculado a outra publicação. Envie um arquivo novo ou reutilize a publicação existente.';
  end if;
  return new;
end
$function$;

drop trigger if exists fans_post_media_prevent_reuse on public.fans_post_media;
create trigger fans_post_media_prevent_reuse
before insert or update of storage_bucket, storage_path, post_id
on public.fans_post_media
for each row execute function public.prevent_reuse_of_fans_media_object();
