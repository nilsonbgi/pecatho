-- Fans: vínculo seguro entre conversas existentes e relacionamento criador/cliente.
-- A conversa continua utilizando conversations/conversation_members/messages;
-- esta tabela apenas identifica que ela pertence ao ecossistema Fans.

create table if not exists public.fans_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations(id) on delete cascade,
  creator_id uuid not null references public.fans_creators(id) on delete cascade,
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'direct',
  source_id uuid null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fans_conversations_source_check check (source in ('direct','subscription','post_purchase','live_session')),
  constraint fans_conversations_status_check check (status in ('active','archived','blocked')),
  constraint fans_conversations_participants_check check (
    creator_id is not null and buyer_user_id is not null
  )
);

create unique index if not exists fans_conversations_creator_buyer_uidx
  on public.fans_conversations (creator_id, buyer_user_id);

create index if not exists fans_conversations_buyer_idx
  on public.fans_conversations (buyer_user_id, updated_at desc);

create index if not exists fans_conversations_creator_idx
  on public.fans_conversations (creator_id, updated_at desc);

alter table public.fans_conversations enable row level security;

drop policy if exists fans_conversations_participant_select on public.fans_conversations;
create policy fans_conversations_participant_select
on public.fans_conversations
for select
to authenticated
using (
  buyer_user_id = (select auth.uid())
  or exists (
    select 1
    from public.fans_creators fc
    where fc.id = fans_conversations.creator_id
      and fc.user_id = (select auth.uid())
  )
);

create or replace function private.start_fans_conversation(
  p_creator_id uuid,
  p_source text default 'direct',
  p_source_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_creator_user_id uuid;
  v_conversation_id uuid;
  v_existing_creator_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sessão não autenticada';
  end if;

  if p_source not in ('direct','subscription','post_purchase','live_session') then
    raise exception 'Origem de conversa inválida';
  end if;

  select fc.user_id
    into v_creator_user_id
  from public.fans_creators fc
  where fc.id = p_creator_id
    and fc.status = 'active';

  if not found then
    raise exception 'Criador Fans não encontrado ou inativo';
  end if;

  if v_creator_user_id = v_user_id then
    raise exception 'O criador não pode iniciar conversa consigo mesmo';
  end if;

  select fc.id
    into v_existing_creator_id
  from public.fans_conversations fcv
  join public.fans_creators fc on fc.id = fcv.creator_id
  where fcv.creator_id = p_creator_id
    and fcv.buyer_user_id = v_user_id
  limit 1;

  if v_existing_creator_id is not null then
    select fcv.conversation_id
      into v_conversation_id
    from public.fans_conversations fcv
    where fcv.creator_id = p_creator_id
      and fcv.buyer_user_id = v_user_id
    limit 1;

    update public.fans_conversations
       set status = 'active',
           updated_at = now()
     where conversation_id = v_conversation_id;

    return v_conversation_id;
  end if;

  insert into public.conversations (created_by, profile_id)
  select v_user_id, fc.advertiser_profile_id
  from public.fans_creators fc
  where fc.id = p_creator_id
  returning id into v_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (v_conversation_id, v_user_id),
    (v_conversation_id, v_creator_user_id)
  on conflict do nothing;

  insert into public.fans_conversations (
    conversation_id,
    creator_id,
    buyer_user_id,
    source,
    source_id,
    status
  )
  values (
    v_conversation_id,
    p_creator_id,
    v_user_id,
    p_source,
    p_source_id,
    'active'
  );

  return v_conversation_id;
end;
$$;

revoke all on function private.start_fans_conversation(uuid,text,uuid) from public, anon, authenticated;

create or replace function public.start_fans_conversation(
  p_creator_id uuid,
  p_source text default 'direct',
  p_source_id uuid default null
)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.start_fans_conversation(p_creator_id, p_source, p_source_id);
$$;

revoke all on function public.start_fans_conversation(uuid,text,uuid) from public, anon;
grant execute on function public.start_fans_conversation(uuid,text,uuid) to authenticated;

create or replace function public.touch_fans_conversation(
  p_conversation_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.fans_conversations fcv
     set updated_at = now()
   where fcv.conversation_id = p_conversation_id
     and (
       fcv.buyer_user_id = (select auth.uid())
       or exists (
         select 1
         from public.fans_creators fc
         where fc.id = fcv.creator_id
           and fc.user_id = (select auth.uid())
       )
     );

  return found;
end;
$$;

revoke all on function public.touch_fans_conversation(uuid) from public, anon;
grant execute on function public.touch_fans_conversation(uuid) to authenticated;

create or replace function public.set_fans_conversation_source(
  p_conversation_id uuid,
  p_source text,
  p_source_id uuid default null
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_source not in ('direct','subscription','post_purchase','live_session') then
    raise exception 'Origem de conversa inválida';
  end if;

  update public.fans_conversations fcv
     set source = p_source,
         source_id = p_source_id,
         updated_at = now()
   where fcv.conversation_id = p_conversation_id
     and exists (
       select 1
       from public.fans_creators fc
       where fc.id = fcv.creator_id
         and fc.user_id = (select auth.uid())
     );

  return found;
end;
$$;

revoke all on function public.set_fans_conversation_source(uuid,text,uuid) from public, anon;
grant execute on function public.set_fans_conversation_source(uuid,text,uuid) to authenticated;

create or replace function public.handle_fans_conversation_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fans_conversations_updated_at on public.fans_conversations;
create trigger fans_conversations_updated_at
before update on public.fans_conversations
for each row execute function public.handle_fans_conversation_updated_at();

alter publication supabase_realtime add table public.fans_conversations;
