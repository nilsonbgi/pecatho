-- Prevent comment owners from transferring comments between posts or overriding
-- moderation status through direct Data API updates. Staff moderation remains supported.
create or replace function private.guard_fans_comment_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(private.is_staff(), false) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.user_id is distinct from auth.uid() then
      raise exception 'O comentário deve pertencer ao usuário autenticado.';
    end if;
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

  return new;
end;
$$;

revoke all on function private.guard_fans_comment_mutation() from public, anon, authenticated;

drop trigger if exists trg_guard_fans_comment_mutation on public.fans_comments;
create trigger trg_guard_fans_comment_mutation
before insert or update on public.fans_comments
for each row execute function private.guard_fans_comment_mutation();
