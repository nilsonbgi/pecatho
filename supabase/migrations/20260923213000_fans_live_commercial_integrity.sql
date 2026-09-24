create or replace function public.touch_fans_live_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_session public.fans_live_sessions%rowtype;
  v_is_creator boolean;
  v_now timestamptz := now();
  v_expiry timestamptz;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select s.* into v_session
  from public.fans_live_sessions s
  where s.id=p_session_id
    and (s.buyer_user_id=auth.uid() or exists (
      select 1 from public.fans_creators fc
      where fc.id=s.creator_id and fc.user_id=auth.uid()
    ))
  for update;

  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if v_session.status not in ('scheduled','active') then raise exception 'LIVE_SESSION_NOT_ACTIVE'; end if;
  if v_session.confirmed_at is null or v_session.scheduled_for is null then raise exception 'LIVE_SCHEDULE_NOT_CONFIRMED'; end if;

  v_expiry := v_session.scheduled_for + (v_session.duration_minutes * interval '1 minute') + interval '10 minutes';

  if v_now > v_expiry then
    update public.fans_live_sessions
       set status='completed',
           ended_at=coalesce(ended_at,v_expiry),
           ended_by_user_id=null,
           ended_reason='system_expired',
           commercial_outcome='system_expired',
           refund_status=case when paid_at is not null then 'required' else 'not_required' end,
           refund_amount=case when paid_at is not null then amount else 0 end,
           refund_reason=case when paid_at is not null then 'Chamada paga expirou sem encerramento comercial explícito.' else null end,
           refund_requested_at=case when paid_at is not null then coalesce(refund_requested_at,v_now) else refund_requested_at end,
           last_activity_at=v_now,
           updated_at=v_now
     where id=v_session.id and status in ('scheduled','active');

    return jsonb_build_object(
      'ok',true,'session_id',v_session.id,'status','completed',
      'expired',true,'commercial_outcome','system_expired',
      'refund_required',v_session.paid_at is not null,
      'refund_amount',case when v_session.paid_at is not null then v_session.amount else 0 end
    );
  end if;

  v_is_creator := exists (
    select 1 from public.fans_creators fc
    where fc.id=v_session.creator_id and fc.user_id=auth.uid()
  );

  update public.fans_live_sessions
     set status='active',
         started_at=coalesce(started_at,v_now),
         buyer_joined_at=case when not v_is_creator then coalesce(buyer_joined_at,v_now) else buyer_joined_at end,
         creator_joined_at=case when v_is_creator then coalesce(creator_joined_at,v_now) else creator_joined_at end,
         last_activity_at=v_now,
         updated_at=v_now
   where id=v_session.id
   returning * into v_session;

  return jsonb_build_object(
    'ok',true,'session_id',v_session.id,'status',v_session.status,
    'role',case when v_is_creator then 'creator' else 'buyer' end,
    'buyer_joined_at',v_session.buyer_joined_at,
    'creator_joined_at',v_session.creator_joined_at,
    'other_joined',case when v_is_creator then v_session.buyer_joined_at is not null else v_session.creator_joined_at is not null end,
    'last_activity_at',v_session.last_activity_at,
    'scheduled_for',v_session.scheduled_for,
    'started_at',v_session.started_at,
    'ends_at',v_session.scheduled_for + (v_session.duration_minutes * interval '1 minute')
  );
end;
$$;

create or replace function public.get_fans_live_room_access(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare v_session public.fans_live_sessions%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select s.* into v_session from public.fans_live_sessions s
  where s.id=p_session_id
    and (s.buyer_user_id=auth.uid() or exists (select 1 from public.fans_creators fc where fc.id=s.creator_id and fc.user_id=auth.uid()))
  for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if v_session.status not in ('scheduled','active') then raise exception 'LIVE_ROOM_UNAVAILABLE'; end if;
  if v_session.paid_at is null then raise exception 'LIVE_SESSION_NOT_PAID'; end if;
  if v_session.confirmed_at is null or v_session.scheduled_for is null then raise exception 'LIVE_SCHEDULE_NOT_CONFIRMED'; end if;
  return public.touch_fans_live_session(p_session_id);
end;
$$;

create or replace function public.fans_live_commercial_integrity()
returns table(
  paid_without_order bigint,
  paid_without_payment bigint,
  paid_without_ledger bigint,
  completed_without_outcome bigint,
  refund_required_without_payment bigint
)
language sql security definer
set search_path to 'pg_catalog','public'
as $$
  select
    count(*) filter (where s.paid_at is not null and s.order_id is null),
    count(*) filter (where s.paid_at is not null and s.payment_id is null),
    count(*) filter (where s.paid_at is not null and s.order_id is not null and not exists (
      select 1 from public.fans_financial_ledger l
      where l.order_id=s.order_id and l.entry_type='sale_gross' and l.status='posted'
    )),
    count(*) filter (where s.status='completed' and s.commercial_outcome is null),
    count(*) filter (where s.refund_status='required' and s.paid_at is not null and s.payment_id is null)
  from public.fans_live_sessions s;
$$;

revoke all on function public.fans_live_commercial_integrity() from public, anon, authenticated;
grant execute on function public.fans_live_commercial_integrity() to authenticated;
