-- Prevent venue owners from self-approving media or altering moderation decisions.
-- Public venue media is served only when moderation_status = 'approved'.
create or replace function private.guard_partner_venue_media_integrity()
returns trigger
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'private'
as $function$
declare
  v_owner_user_id uuid;
begin
  select v.owner_user_id
    into v_owner_user_id
  from public.partner_venues v
  where v.id = new.venue_id;

  if not private.is_staff() then
    if v_owner_user_id is null
       or v_owner_user_id <> auth.uid()
       or new.owner_user_id <> auth.uid()
    then
      raise exception 'A mídia do estabelecimento não pertence ao usuário autenticado.';
    end if;

    if new.storage_bucket <> 'pecatho-partner-media'
       or new.storage_path !~ ('^' || auth.uid()::text || '/')
    then
      raise exception 'Caminho de armazenamento da mídia do estabelecimento inválido.';
    end if;

    if new.preview_storage_path is not null
       and (
         new.preview_storage_bucket <> 'pecatho-media-preview'
         or new.preview_storage_path !~ ('^' || auth.uid()::text || '/')
       )
    then
      raise exception 'Caminho de preview da mídia do estabelecimento inválido.';
    end if;

    if tg_op = 'INSERT' then
      new.moderation_status := 'pending';
      new.rejection_reason := null;
    elsif tg_op = 'UPDATE' then
      new.moderation_status := old.moderation_status;
      new.rejection_reason := old.rejection_reason;
    end if;
  end if;

  return new;
end;
$function$;
