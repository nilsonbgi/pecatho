-- Pecatho Fans: sala privada e ciclo operacional da videochamada
create table if not exists public.fans_live_signals (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fans_live_sessions(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  signal_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint fans_live_signals_type_check check (
    signal_type in ('join','offer','answer','ice','leave')
  )
);

create index if not exists fans_live_signals_session_idx
  on public.fans_live_signals (session_id, created_at);

alter table public.fans_live_signals enable row level security;

drop policy if exists fans_live_signals_participant_select on public.fans_live_signals;
create policy fans_live_signals_participant_select
on public.fans_live_signals
for select
to authenticated
using (
  exists (
    select 1
    from public.fans_live_sessions s
    where s.id = fans_live_signals.session_id
      and (
        s.buyer_user_id = (select auth.uid())
        or exists (
          select 1
          from public.fans_creators fc
          where fc.id = s.creator_id
            and fc.user_id = (select auth.uid())
        )
      )
      and s.status in ('scheduled','active')
      and s.confirmed_at is not null
  )
);

drop policy if exists fans_live_signals_participant_insert on public.fans_live_signals;
create policy fans_live_signals_participant_insert
on public.fans_live_signals
for insert
to authenticated
with check (
  sender_user_id = (select auth.uid())
  and exists (
    select 1
    from public.fans_live_sessions s
    where s.id = fans_live_signals.session_id
      and (
        s.buyer_user_id = (select auth.uid())
        or exists (
          select 1
          from public.fans_creators fc
          where fc.id = s.creator_id
            and fc.user_id = (select auth.uid())
        )
      )
      and s.status in ('scheduled','active')
      and s.confirmed_at is not null
  )
);

alter publication supabase_realtime add table public.fans_live_signals;

create or replace function public.get_fans_live_room_access(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_session public.fans_live_sessions%rowtype;
  v_is_creator boolean := false;
  v_now timestamptz := now();
  v_start timestamptz;
  v_end timestamptz;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select s.*
    into v_session
    from public.fans_live_sessions s
   where s.id = p_session_id
     and (
       s.buyer_user_id = auth.uid()
       or exists (
         select 1
           from public.fans_creators fc
          where fc.id = s.creator_id
            and fc.user_id = auth.uid()
       )
     )
   for update;

  if not found then
    raise exception 'LIVE_SESSION_NOT_FOUND';
  end if;

  if v_session.status not in ('scheduled','active') then
    raise exception 'LIVE_ROOM_UNAVAILABLE';
  end if;

  if v_session.confirmed_at is null or v_session.scheduled_for is null then
    raise exception 'LIVE_SCHEDULE_NOT_CONFIRMED';
  end if;

  v_start := v_session.scheduled_for - interval '15 minutes';
  v_end := v_session.scheduled_for
    + (v_session.duration_minutes * interval '1 minute')
    + interval '10 minutes';

  if v_now < v_start then
    raise exception 'LIVE_ROOM_NOT_OPEN';
  end if;

  if v_now > v_end then
    update public.fans_live_sessions
       set status = 'completed',
           ended_at = coalesce(ended_at, v_end),
           updated_at = now()
     where id = v_session.id
       and status in ('scheduled','active');
    raise exception 'LIVE_SESSION_EXPIRED';
  end if;

  if v_session.room_id is null then
    update public.fans_live_sessions
       set room_id = encode(gen_random_bytes(24),'hex'),
           status = 'active',
           started_at = coalesce(started_at, v_now),
           updated_at = now()
     where id = v_session.id
     returning * into v_session;
  elsif v_session.status = 'scheduled' then
    update public.fans_live_sessions
       set status = 'active',
           started_at = coalesce(started_at, v_now),
           updated_at = now()
     where id = v_session.id
     returning * into v_session;
  end if;

  select exists (
    select 1
      from public.fans_creators fc
     where fc.id = v_session.creator_id
       and fc.user_id = auth.uid()
  ) into v_is_creator;

  return jsonb_build_object(
    'ok', true,
    'session_id', v_session.id,
    'room_id', v_session.room_id,
    'role', case when v_is_creator then 'creator' else 'buyer' end,
    'title', v_session.title,
    'duration_minutes', v_session.duration_minutes,
    'scheduled_for', v_session.scheduled_for,
    'started_at', v_session.started_at,
    'ends_at', v_session.scheduled_for + (v_session.duration_minutes * interval '1 minute'),
    'status', v_session.status
  );
end;
$$;

grant execute on function public.get_fans_live_room_access(uuid) to authenticated;
revoke all on function public.get_fans_live_room_access(uuid) from public, anon;

create or replace function public.end_fans_live_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_session public.fans_live_sessions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select s.*
    into v_session
    from public.fans_live_sessions s
   where s.id = p_session_id
     and (
       s.buyer_user_id = auth.uid()
       or exists (
         select 1
           from public.fans_creators fc
          where fc.id = s.creator_id
            and fc.user_id = auth.uid()
       )
     )
   for update;

  if not found then
    raise exception 'LIVE_SESSION_NOT_FOUND';
  end if;

  if v_session.status = 'completed' then
    return jsonb_build_object('ok',true,'status','completed','session_id',p_session_id);
  end if;

  if v_session.status <> 'active' then
    raise exception 'LIVE_SESSION_NOT_ACTIVE';
  end if;

  update public.fans_live_sessions
     set status = 'completed',
         ended_at = coalesce(ended_at, now()),
         updated_at = now()
   where id = p_session_id;

  delete from public.fans_live_signals
   where session_id = p_session_id;

  return jsonb_build_object('ok',true,'status','completed','session_id',p_session_id);
end;
$$;

grant execute on function public.end_fans_live_session(uuid) to authenticated;
revoke all on function public.end_fans_live_session(uuid) from public, anon;
