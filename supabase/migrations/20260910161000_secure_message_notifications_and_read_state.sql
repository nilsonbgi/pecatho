create or replace function public.handle_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
  profile_id_value uuid;
  profile_title text;
begin
  update public.conversations
     set updated_at = new.created_at
   where id = new.conversation_id;

  select c.profile_id
    into profile_id_value
    from public.conversations c
   where c.id = new.conversation_id;

  select coalesce(ap.display_name, ap.title, 'um anunciante')
    into profile_title
    from public.advertiser_profiles ap
   where ap.id = profile_id_value;

  for recipient_id in
    select cm.user_id
      from public.conversation_members cm
     where cm.conversation_id = new.conversation_id
       and cm.user_id <> new.sender_id
  loop
    insert into public.fans_notifications (user_id, type, title, body, data)
    values (
      recipient_id,
      'message_received',
      'Nova mensagem',
      case
        when profile_title is not null then 'Você recebeu uma nova mensagem de ' || profile_title || '.'
        else 'Você recebeu uma nova mensagem no Pecatho.'
      end,
      jsonb_build_object(
        'conversation_id', new.conversation_id,
        'message_id', new.id,
        'sender_id', new.sender_id,
        'profile_id', profile_id_value,
        'route', '/painel/mensagens/' || new.conversation_id::text
      )
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert
after insert on public.messages
for each row execute function public.handle_message_insert();

create or replace function private.mark_conversation_read(p_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  requester_id uuid := auth.uid();
begin
  if requester_id is null then
    raise exception 'Não autenticado';
  end if;

  update public.conversation_members
     set last_read_at = now()
   where conversation_id = p_conversation_id
     and user_id = requester_id;

  if not found then
    raise exception 'Usuário não participa desta conversa';
  end if;

  return true;
end;
$$;

revoke all on function private.mark_conversation_read(uuid) from public;
grant execute on function private.mark_conversation_read(uuid) to authenticated;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns boolean
language sql
security invoker
set search_path = public, private
as $$
  select private.mark_conversation_read(p_conversation_id);
$$;

revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

alter publication supabase_realtime add table public.messages;
