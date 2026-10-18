-- Atomic, owner-scoped reaction toggle for Pecatho Fans.
create or replace function public.set_fans_post_reaction(p_post_id uuid, p_emoji text)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_user_id uuid := auth.uid();
  v_creator_user_id uuid;
  v_access_type text;
  v_allowed boolean := false;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;

  if p_emoji is not null and p_emoji not in ('❤️','😍','🔥','👏','😂','😮','💯','😘') then
    raise exception using errcode = '22023', message = 'unsupported_reaction';
  end if;

  if p_emoji is null then
    delete from public.fans_post_reactions
    where post_id = p_post_id and user_id = v_user_id;
    return;
  end if;

  select c.user_id, p.access_type
    into v_creator_user_id, v_access_type
  from public.fans_posts p
  join public.fans_creators c on c.id = p.creator_id
  where p.id = p_post_id
    and p.status = 'published'
    and c.status = 'active';

  if not found then
    raise exception using errcode = 'P0002', message = 'publication_not_available';
  end if;

  if v_creator_user_id = v_user_id then
    raise exception using errcode = '42501', message = 'creator_cannot_react_to_own_post';
  end if;

  if v_access_type = 'free' then
    v_allowed := true;
  else
    select exists (
      select 1 from public.fans_purchases fp
      where fp.post_id = p_post_id
        and fp.buyer_user_id = v_user_id
        and fp.status = 'paid'
    ) or exists (
      select 1 from public.fans_subscriptions fs
      join public.fans_posts p on p.creator_id = fs.creator_id
      where p.id = p_post_id
        and fs.subscriber_user_id = v_user_id
        and fs.status = 'active'
        and (fs.ends_at is null or fs.ends_at > now())
    ) into v_allowed;
  end if;

  if not v_allowed then
    raise exception using errcode = '42501', message = 'publication_access_required';
  end if;

  insert into public.fans_post_reactions (post_id, user_id, emoji)
  values (p_post_id, v_user_id, p_emoji)
  on conflict (post_id, user_id)
  do update set emoji = excluded.emoji, created_at = now();
end
$function$;

revoke all on function public.set_fans_post_reaction(uuid, text) from public;
grant execute on function public.set_fans_post_reaction(uuid, text) to authenticated;
