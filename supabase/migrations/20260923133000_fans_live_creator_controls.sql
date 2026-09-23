alter table public.fans_live_sessions
  add column if not exists ended_by_user_id uuid,
  add column if not exists ended_reason text;

create or replace function public.extend_fans_live_session(
  p_session_id uuid,
  p_minutes integer
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_session public.fans_live_sessions%rowtype;
  v_is_creator boolean;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_minutes is null or p_minutes not in (10,15,20,30) then raise exception 'INVALID_EXTENSION_MINUTES'; end if;

  select s.* into v_session
  from public.fans_live_sessions s
  where s.id=p_session_id
  for update;

  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;

  v_is_creator := exists(
    select 1 from public.fans_creators fc
    where fc.id=v_session.creator_id and fc.user_id=auth.uid()
  );

  if not v_is_creator then raise exception 'LIVE_EXTENSION_CREATOR_ONLY'; end if;
  if v_session.status <> 'active' then raise exception 'LIVE_SESSION_NOT_ACTIVE'; end if;

  if now() >= v_session.scheduled_for + (v_session.duration_minutes * interval '1 minute') then
    raise exception 'LIVE_EXTENSION_WINDOW_CLOSED';
  end if;

  update public.fans_live_sessions
  set duration_minutes=duration_minutes+p_minutes,
      last_activity_at=now(),
      updated_at=now()
  where id=p_session_id
  returning * into v_session;

  return jsonb_build_object(
    'ok',true,
    'session_id',v_session.id,
    'duration_minutes',v_session.duration_minutes,
    'ends_at',v_session.scheduled_for+(v_session.duration_minutes*interval '1 minute'),
    'extended_minutes',p_minutes
  );
end;
$$;

revoke all on function public.extend_fans_live_session(uuid,integer) from public;
grant execute on function public.extend_fans_live_session(uuid,integer) to authenticated;

create or replace function public.kick_fans_live_participant(p_session_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_session public.fans_live_sessions%rowtype;
  v_is_creator boolean;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select s.* into v_session
  from public.fans_live_sessions s
  where s.id=p_session_id
  for update;

  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;

  v_is_creator := exists(
    select 1 from public.fans_creators fc
    where fc.id=v_session.creator_id and fc.user_id=auth.uid()
  );

  if not v_is_creator then raise exception 'LIVE_KICK_CREATOR_ONLY'; end if;
  if v_session.status <> 'active' then raise exception 'LIVE_SESSION_NOT_ACTIVE'; end if;

  update public.fans_live_sessions
  set status='completed',
      ended_at=coalesce(ended_at,now()),
      ended_by_user_id=auth.uid(),
      ended_reason='creator_removed_participant',
      last_activity_at=now(),
      updated_at=now()
  where id=p_session_id;

  delete from public.fans_live_signals where session_id=p_session_id;

  return jsonb_build_object(
    'ok',true,
    'session_id',p_session_id,
    'status','completed',
    'ended_reason','creator_removed_participant'
  );
end;
$$;

revoke all on function public.kick_fans_live_participant(uuid) from public;
grant execute on function public.kick_fans_live_participant(uuid) to authenticated;

create or replace function public.end_fans_live_session(p_session_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_session public.fans_live_sessions%rowtype;
  v_is_creator boolean;
  v_reason text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select s.* into v_session
  from public.fans_live_sessions s
  where s.id=p_session_id
    and (
      s.buyer_user_id=auth.uid()
      or exists (
        select 1 from public.fans_creators fc
        where fc.id=s.creator_id and fc.user_id=auth.uid()
      )
    )
  for update;

  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if v_session.status='completed' then
    return jsonb_build_object('ok',true,'status','completed','session_id',p_session_id);
  end if;
  if v_session.status<>'active' then raise exception 'LIVE_SESSION_NOT_ACTIVE'; end if;

  v_is_creator := exists(
    select 1 from public.fans_creators fc
    where fc.id=v_session.creator_id and fc.user_id=auth.uid()
  );

  v_reason := case when v_is_creator then 'creator_ended' else 'buyer_left' end;

  update public.fans_live_sessions
  set status='completed',
      ended_at=coalesce(ended_at,now()),
      ended_by_user_id=auth.uid(),
      ended_reason=v_reason,
      last_activity_at=now(),
      updated_at=now()
  where id=p_session_id;

  delete from public.fans_live_signals where session_id=p_session_id;

  return jsonb_build_object(
    'ok',true,
    'status','completed',
    'session_id',p_session_id,
    'ended_reason',v_reason
  );
end;
$$;

revoke all on function public.end_fans_live_session(uuid) from public;
grant execute on function public.end_fans_live_session(uuid) to authenticated;
