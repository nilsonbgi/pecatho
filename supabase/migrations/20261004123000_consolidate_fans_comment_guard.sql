-- Consolidate comment integrity into the existing mutation guard to avoid
-- duplicate trigger execution while preserving ownership and moderation controls.
drop trigger if exists trg_guard_fans_comment_integrity on public.fans_comments;
drop function if exists private.guard_fans_comment_integrity();

create or replace function private.guard_fans_comment_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if coalesce(private.is_staff(), false) then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if tg_op = 'INSERT' then
    if new.user_id is distinct from auth.uid() then
      raise exception 'O comentário deve pertencer ao usuário autenticado.';
    end if;

    if not exists (
      select 1
      from public.fans_posts p
      join public.fans_creators c on c.id = p.creator_id
      where p.id = new.post_id
        and p.status = 'published'
        and c.status = 'active'
    ) then
      raise exception 'POST_NOT_AVAILABLE_FOR_COMMENTS';
    end if;

    new.status := 'visible';
    new.updated_at := pg_catalog.now();
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Não é permitido transferir a titularidade de um comentário.';
  end if;

  if new.post_id is distinct from old.post_id then
    raise exception 'Não é permitido transferir um comentário para outra publicação.';
  end if;

  if new.status is distinct from old.status then
    raise exception 'Somente a moderação pode alterar o status de um comentário.';
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$function$;
