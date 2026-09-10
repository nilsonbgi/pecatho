create or replace function private.start_advertiser_conversation(p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_requester_id uuid;
  v_advertiser_user_id uuid;
  v_conversation_id uuid;
begin
  v_requester_id := auth.uid();
  if v_requester_id is null then
    raise exception 'Sessão não autenticada';
  end if;

  select ap.user_id
    into v_advertiser_user_id
  from public.advertiser_profiles ap
  where ap.id = p_profile_id
    and ap.status = 'published'::profile_status;

  if not found then
    raise exception 'Anúncio não encontrado ou não está publicado';
  end if;

  if v_advertiser_user_id = v_requester_id then
    raise exception 'Você não pode iniciar uma conversa com o próprio perfil';
  end if;

  select c.id
    into v_conversation_id
  from public.conversations c
  where c.profile_id = p_profile_id
    and c.created_by = v_requester_id
  order by c.created_at desc
  limit 1;

  if v_conversation_id is null then
    insert into public.conversations (created_by, profile_id)
    values (v_requester_id, p_profile_id)
    returning id into v_conversation_id;
  end if;

  insert into public.conversation_members (conversation_id, user_id)
  values (v_conversation_id, v_requester_id)
  on conflict do nothing;

  insert into public.conversation_members (conversation_id, user_id)
  values (v_conversation_id, v_advertiser_user_id)
  on conflict do nothing;

  return v_conversation_id;
end;
$$;
