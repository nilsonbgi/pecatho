begin;

alter table public.fans_live_sessions
  add column if not exists buyer_joined_at timestamptz,
  add column if not exists creator_joined_at timestamptz,
  add column if not exists last_activity_at timestamptz;

create index if not exists fans_live_sessions_last_activity_idx
  on public.fans_live_sessions (status, last_activity_at);

create or replace function public.touch_fans_live_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_session public.fans_live_sessions%rowtype;
  v_is_creator boolean;
  v_now timestamptz:=now();
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select s.* into v_session from public.fans_live_sessions s
  where s.id=p_session_id and (s.buyer_user_id=auth.uid() or exists(select 1 from public.fans_creators fc where fc.id=s.creator_id and fc.user_id=auth.uid())) for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if v_session.status not in ('scheduled','active') then raise exception 'LIVE_SESSION_NOT_ACTIVE'; end if;
  if v_session.confirmed_at is null or v_session.scheduled_for is null then raise exception 'LIVE_SCHEDULE_NOT_CONFIRMED'; end if;
  if v_now < v_session.scheduled_for-interval '15 minutes' then raise exception 'LIVE_ROOM_NOT_OPEN'; end if;
  if v_now > v_session.scheduled_for+(v_session.duration_minutes*interval '1 minute')+interval '10 minutes' then
    update public.fans_live_sessions set status='completed',ended_at=coalesce(ended_at,v_session.scheduled_for+(v_session.duration_minutes*interval '1 minute')+interval '10 minutes'),last_activity_at=v_now,updated_at=v_now where id=v_session.id and status in ('scheduled','active');
    raise exception 'LIVE_SESSION_EXPIRED';
  end if;
  v_is_creator:=exists(select 1 from public.fans_creators fc where fc.id=v_session.creator_id and fc.user_id=auth.uid());
  update public.fans_live_sessions set status='active',started_at=coalesce(started_at,v_now),
    buyer_joined_at=case when not v_is_creator then coalesce(buyer_joined_at,v_now) else buyer_joined_at end,
    creator_joined_at=case when v_is_creator then coalesce(creator_joined_at,v_now) else creator_joined_at end,
    last_activity_at=v_now,updated_at=v_now where id=v_session.id returning * into v_session;
  return jsonb_build_object('ok',true,'session_id',v_session.id,'status',v_session.status,'role',case when v_is_creator then 'creator' else 'buyer' end,'buyer_joined_at',v_session.buyer_joined_at,'creator_joined_at',v_session.creator_joined_at,'other_joined',case when v_is_creator then v_session.buyer_joined_at is not null else v_session.creator_joined_at is not null end,'last_activity_at',v_session.last_activity_at,'scheduled_for',v_session.scheduled_for,'started_at',v_session.started_at,'ends_at',v_session.scheduled_for+(v_session.duration_minutes*interval '1 minute'));
end;
$$;

grant execute on function public.touch_fans_live_session(uuid) to authenticated;
revoke all on function public.touch_fans_live_session(uuid) from public,anon;

create or replace function public.get_fans_live_room_access(p_session_id uuid)
returns jsonb
language plpgsql security definer set search_path=pg_catalog,public
as $$
declare v_session public.fans_live_sessions%rowtype; v_is_creator boolean:=false; v_now timestamptz:=now(); v_start timestamptz; v_end timestamptz;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select s.* into v_session from public.fans_live_sessions s where s.id=p_session_id and (s.buyer_user_id=auth.uid() or exists(select 1 from public.fans_creators fc where fc.id=s.creator_id and fc.user_id=auth.uid())) for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if v_session.status not in ('scheduled','active') then raise exception 'LIVE_ROOM_UNAVAILABLE'; end if;
  if v_session.confirmed_at is null or v_session.scheduled_for is null then raise exception 'LIVE_SCHEDULE_NOT_CONFIRMED'; end if;
  v_start:=v_session.scheduled_for-interval '15 minutes'; v_end:=v_session.scheduled_for+(v_session.duration_minutes*interval '1 minute')+interval '10 minutes';
  if v_now<v_start then raise exception 'LIVE_ROOM_NOT_OPEN'; end if;
  if v_now>v_end then update public.fans_live_sessions set status='completed',ended_at=coalesce(ended_at,v_end),last_activity_at=v_now,updated_at=v_now where id=v_session.id and status in ('scheduled','active'); raise exception 'LIVE_SESSION_EXPIRED'; end if;
  v_is_creator:=exists(select 1 from public.fans_creators fc where fc.id=v_session.creator_id and fc.user_id=auth.uid());
  if v_session.room_id is null then update public.fans_live_sessions set room_id=encode(gen_random_bytes(24),'hex'),status='active',updated_at=v_now where id=v_session.id returning * into v_session; end if;
  return jsonb_build_object('ok',true,'session_id',v_session.id,'room_id',v_session.room_id,'role',case when v_is_creator then 'creator' else 'buyer' end,'title',v_session.title,'duration_minutes',v_session.duration_minutes,'scheduled_for',v_session.scheduled_for,'started_at',v_session.started_at,'buyer_joined_at',v_session.buyer_joined_at,'creator_joined_at',v_session.creator_joined_at,'other_joined',case when v_is_creator then v_session.buyer_joined_at is not null else v_session.creator_joined_at is not null end,'ends_at',v_session.scheduled_for+(v_session.duration_minutes*interval '1 minute'),'status',v_session.status);
end;
$$;

grant execute on function public.get_fans_live_room_access(uuid) to authenticated;
revoke all on function public.get_fans_live_room_access(uuid) from public,anon;

commit;