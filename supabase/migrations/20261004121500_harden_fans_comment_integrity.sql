-- Protect comment ownership and moderation state without changing the normal
-- user flow: comments on published posts remain immediately visible by default.
create or replace function private.guard_fans_comment_integrity()
returns trigger
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'private'
as $function$
begin
  if private.is_staff() then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if tg_op = 'INSERT' then
    if new.user_id is distinct from auth.uid() then
      raise exception 'COMMENT_OWNER_MISMATCH';
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

  if tg_op = 'UPDATE' then
    if old.user_id is distinct from auth.uid()
       or new.user_id is distinct from old.user_id
       or new.post_id is distinct from old.post_id then
      raise exception 'COMMENT_IDENTITY_IMMUTABLE';
    end if;

    new.status := old.status;
    new.updated_at := pg_catalog.now();
    return new;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_guard_fans_comment_integrity on public.fans_comments;
create trigger trg_guard_fans_comment_integrity
before insert or update on public.fans_comments
for each row execute function private.guard_fans_comment_integrity();

drop policy if exists fans_comments_staff_update on public.fans_comments;
create policy fans_comments_staff_update
on public.fans_comments
for update to authenticated
using (private.is_staff())
with check (private.is_staff());

drop policy if exists fans_comments_staff_delete on public.fans_comments;
create policy fans_comments_staff_delete
on public.fans_comments
for delete to authenticated
using (private.is_staff());
