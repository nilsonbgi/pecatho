create or replace function private.admin_moderate_profile_media(p_media_id uuid, p_action text)
returns public.profile_media
language plpgsql
security definer
set search_path = public, private
as $function$
declare
  result public.profile_media;
begin
  if auth.uid() is null or not private.is_staff() then
    raise exception 'Acesso administrativo não autorizado';
  end if;
  if p_action not in ('approve','reject','pending') then
    raise exception 'Ação de mídia inválida';
  end if;
  select * into result from public.profile_media where id = p_media_id for update;
  if not found then raise exception 'Mídia não encontrada'; end if;
  update public.profile_media
     set moderation_status = case p_action
       when 'approve' then 'approved'::moderation_status
       when 'reject' then 'rejected'::moderation_status
       else 'pending'::moderation_status
     end,
     updated_at = now()
   where id = result.id
   returning * into result;
  return result;
end;
$function$;

revoke all on function private.admin_moderate_profile_media(uuid, text) from public, anon, authenticated;
grant execute on function private.admin_moderate_profile_media(uuid, text) to postgres;

create or replace function public.admin_moderate_profile_media(p_media_id uuid, p_action text)
returns public.profile_media
language plpgsql
security definer
set search_path = public, private
as $function$
begin
  return private.admin_moderate_profile_media(p_media_id, p_action);
end;
$function$;

revoke all on function public.admin_moderate_profile_media(uuid, text) from public, anon;
grant execute on function public.admin_moderate_profile_media(uuid, text) to authenticated;
