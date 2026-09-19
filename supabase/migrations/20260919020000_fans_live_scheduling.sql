-- Pecatho Fans: agenda e confirmação de sessões pagas
alter table public.fans_live_sessions
  add column if not exists requested_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists rejection_reason text;

create index if not exists fans_live_sessions_schedule_idx
  on public.fans_live_sessions (creator_id, scheduled_for, status)
  where scheduled_for is not null;

create or replace function public.request_fans_live_schedule(
  p_session_id uuid,
  p_scheduled_for timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_session public.fans_live_sessions%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_scheduled_for is null or p_scheduled_for <= now() then raise exception 'INVALID_SCHEDULE'; end if;
  select * into v_session from public.fans_live_sessions where id=p_session_id and buyer_user_id=auth.uid() for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if v_session.status <> 'paid' then raise exception 'LIVE_SESSION_NOT_SCHEDULABLE'; end if;
  if p_scheduled_for > now() + interval '90 days' then raise exception 'SCHEDULE_TOO_FAR'; end if;
  update public.fans_live_sessions
     set status='scheduled', scheduled_for=p_scheduled_for, requested_at=now(),
         confirmed_at=null, rejection_reason=null, updated_at=now()
   where id=p_session_id;
  return jsonb_build_object('ok',true,'session_id',p_session_id,'status','scheduled','scheduled_for',p_scheduled_for);
end;
$$;
grant execute on function public.request_fans_live_schedule(uuid,timestamptz) to authenticated;

create or replace function public.confirm_fans_live_schedule(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_session public.fans_live_sessions%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select s.* into v_session
    from public.fans_live_sessions s
    join public.fans_creators c on c.id=s.creator_id
   where s.id=p_session_id and c.user_id=auth.uid()
   for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if v_session.status <> 'scheduled' then raise exception 'LIVE_SESSION_NOT_CONFIRMABLE'; end if;
  update public.fans_live_sessions set confirmed_at=now(), updated_at=now() where id=p_session_id;
  return jsonb_build_object('ok',true,'session_id',p_session_id,'status','scheduled','confirmed_at',now());
end;
$$;
grant execute on function public.confirm_fans_live_schedule(uuid) to authenticated;

create or replace function public.reject_fans_live_schedule(
  p_session_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_session public.fans_live_sessions%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select s.* into v_session
    from public.fans_live_sessions s
    join public.fans_creators c on c.id=s.creator_id
   where s.id=p_session_id and c.user_id=auth.uid()
   for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if v_session.status <> 'scheduled' then raise exception 'LIVE_SESSION_NOT_REJECTABLE'; end if;
  update public.fans_live_sessions
     set status='paid', scheduled_for=null, requested_at=null, confirmed_at=null,
         rejection_reason=nullif(trim(coalesce(p_reason,'')),''),
         updated_at=now()
   where id=p_session_id;
  return jsonb_build_object('ok',true,'session_id',p_session_id,'status','paid');
end;
$$;
grant execute on function public.reject_fans_live_schedule(uuid,text) to authenticated;
