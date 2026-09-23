begin;

alter table public.fans_live_sessions
  add column if not exists commercial_outcome text,
  add column if not exists refund_status text not null default 'not_required',
  add column if not exists refund_amount numeric(12,2),
  add column if not exists refund_reason text,
  add column if not exists refund_requested_at timestamptz,
  add column if not exists refund_processed_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='fans_live_sessions_commercial_outcome_check') then
    alter table public.fans_live_sessions add constraint fans_live_sessions_commercial_outcome_check
      check (commercial_outcome is null or commercial_outcome in ('creator_removed_participant','creator_ended_early','creator_completed','buyer_left','system_expired'));
  end if;
  if not exists (select 1 from pg_constraint where conname='fans_live_sessions_refund_status_check') then
    alter table public.fans_live_sessions add constraint fans_live_sessions_refund_status_check
      check (refund_status in ('not_required','required','requested','refunded','failed'));
  end if;
end $$;

create index if not exists fans_live_sessions_refund_status_idx
  on public.fans_live_sessions(refund_status,status,updated_at desc);

create or replace function public.end_fans_live_session(p_session_id uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  s public.fans_live_sessions%rowtype;
  creator boolean;
  now_ts timestamptz:=now();
  planned_end timestamptz;
  needs_refund boolean:=false;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from public.fans_live_sessions
   where id=p_session_id and (buyer_user_id=auth.uid() or exists(select 1 from public.fans_creators fc where fc.id=creator_id and fc.user_id=auth.uid()))
   for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if s.status='completed' then
    return jsonb_build_object('ok',true,'status','completed','session_id',s.id,'refund_required',s.refund_status in ('required','requested'),'refund_status',s.refund_status,'ended_reason',s.ended_reason);
  end if;
  if s.status<>'active' then raise exception 'LIVE_SESSION_NOT_ACTIVE'; end if;
  creator:=exists(select 1 from public.fans_creators fc where fc.id=s.creator_id and fc.user_id=auth.uid());
  planned_end:=s.scheduled_for+(s.duration_minutes*interval '1 minute');
  needs_refund:=creator and now_ts<planned_end;
  update public.fans_live_sessions set
    status='completed', ended_at=coalesce(ended_at,now_ts), ended_by_user_id=auth.uid(),
    ended_reason=case when needs_refund then 'creator_ended_early' when creator then 'creator_ended' else 'buyer_left' end,
    commercial_outcome=case when needs_refund then 'creator_ended_early' when creator then 'creator_completed' else 'buyer_left' end,
    refund_status=case when needs_refund then 'required' else 'not_required' end,
    refund_amount=case when needs_refund then amount else null end,
    refund_reason=case when needs_refund then 'creator_ended_before_scheduled_end' else null end,
    last_activity_at=now_ts,updated_at=now_ts where id=s.id;
  delete from public.fans_live_signals where session_id=s.id;
  return jsonb_build_object('ok',true,'status','completed','session_id',s.id,'refund_required',needs_refund,
    'refund_status',case when needs_refund then 'required' else 'not_required' end,
    'refund_amount',case when needs_refund then s.amount else 0 end,
    'ended_reason',case when needs_refund then 'creator_ended_early' when creator then 'creator_ended' else 'buyer_left' end);
end $$;

create or replace function public.kick_fans_live_participant(p_session_id uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare s public.fans_live_sessions%rowtype; creator boolean;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from public.fans_live_sessions where id=p_session_id for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  creator:=exists(select 1 from public.fans_creators fc where fc.id=s.creator_id and fc.user_id=auth.uid());
  if not creator then raise exception 'LIVE_KICK_CREATOR_ONLY'; end if;
  if s.status='completed' then
    return jsonb_build_object('ok',true,'status','completed','session_id',s.id,'refund_required',s.refund_status in ('required','requested'),'refund_status',s.refund_status,'ended_reason',s.ended_reason);
  end if;
  if s.status<>'active' then raise exception 'LIVE_SESSION_NOT_ACTIVE'; end if;
  update public.fans_live_sessions set status='completed',ended_at=coalesce(ended_at,now()),ended_by_user_id=auth.uid(),
    ended_reason='creator_removed_participant',commercial_outcome='creator_removed_participant',refund_status='required',
    refund_amount=amount,refund_reason='creator_removed_participant',last_activity_at=now(),updated_at=now() where id=s.id;
  delete from public.fans_live_signals where session_id=s.id;
  return jsonb_build_object('ok',true,'status','completed','session_id',s.id,'refund_required',true,'refund_status','required','refund_amount',s.amount,'ended_reason','creator_removed_participant');
end $$;

create or replace function public.prepare_fans_live_refund(p_session_id uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare s public.fans_live_sessions%rowtype; p public.payments%rowtype; creator boolean;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from public.fans_live_sessions where id=p_session_id for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  creator:=exists(select 1 from public.fans_creators fc where fc.id=s.creator_id and fc.user_id=auth.uid());
  if not creator then raise exception 'LIVE_REFUND_CREATOR_ONLY'; end if;
  if s.status<>'completed' then raise exception 'LIVE_SESSION_NOT_COMPLETED'; end if;
  if s.refund_status not in ('required','requested','failed') then raise exception 'LIVE_REFUND_NOT_REQUIRED'; end if;
  select * into p from public.payments where id=s.payment_id or order_id=s.order_id order by created_at desc limit 1 for update;
  if not found then raise exception 'LIVE_PAYMENT_NOT_FOUND'; end if;
  if p.status in ('refunded','chargeback') then
    update public.fans_live_sessions set refund_status='refunded',refund_processed_at=coalesce(refund_processed_at,now()),updated_at=now() where id=s.id;
    return jsonb_build_object('ok',true,'already_refunded',true,'session_id',s.id);
  end if;
  if nullif(trim(p.provider_payment_id),'') is null then raise exception 'LIVE_PROVIDER_PAYMENT_NOT_READY'; end if;
  update public.fans_live_sessions set refund_status='requested',refund_requested_at=coalesce(refund_requested_at,now()),updated_at=now() where id=s.id;
  return jsonb_build_object('ok',true,'session_id',s.id,'order_id',s.order_id,'payment_id',p.id,'provider',p.provider,
    'provider_payment_id',p.provider_payment_id,'refund_amount',coalesce(s.refund_amount,s.amount),'reason',s.refund_reason);
end $$;

create or replace function public.mark_fans_live_refund_failed(p_session_id uuid)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  update public.fans_live_sessions set refund_status='failed',updated_at=now()
   where id=p_session_id and status='completed' and refund_status='requested';
end $$;

create or replace function public.finalize_fans_live_refund_ledger()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.payments%rowtype; amount numeric;
begin
  if new.status<>'refunded' or old.status='refunded' then return new; end if;
  select * into p from public.payments where id=new.payment_id or order_id=new.order_id order by created_at desc limit 1;
  if not found then return new; end if;
  amount:=coalesce(new.refund_amount,new.amount);
  if not exists(select 1 from public.fans_financial_ledger where order_id=new.order_id and entry_type='refund_gross' and status='posted') then
    insert into public.fans_financial_ledger(order_id,payment_id,purchase_id,subscription_id,creator_id,entry_type,direction,amount,currency,status,provider,provider_reference,metadata)
    values
      (new.order_id,p.id,null,null,new.creator_id,'refund_gross','debit',amount,new.currency,'posted',p.provider,p.provider_payment_id,
       jsonb_build_object('reason',new.refund_reason,'ended_reason',new.ended_reason,'commercial_outcome',new.commercial_outcome,'live_session_id',new.id)),
      (new.order_id,p.id,null,null,new.creator_id,'refund_creator_credit','debit',amount,new.currency,'posted',p.provider,p.provider_payment_id,
       jsonb_build_object('reason',new.refund_reason,'ended_reason',new.ended_reason,'commercial_outcome',new.commercial_outcome,'live_session_id',new.id));
  end if;
  return new;
end $$;

create or replace function public.mark_fans_live_refund_state()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if new.status='refunded' and old.status<>'refunded' then
    new.refund_status='refunded'; new.refund_processed_at=coalesce(new.refund_processed_at,now());
  end if;
  return new;
end $$;

create or replace function public.notify_fans_live_closure_detail()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare creator_user uuid; route text; key text;
begin
  if tg_op<>'UPDATE' then return new; end if;
  select fc.user_id into creator_user from public.fans_creators fc where fc.id=new.creator_id;
  if new.status='completed' and old.status<>'completed' and new.refund_status='required' then
    route:=case when new.conversation_id is null then '/painel/notificacoes' else '/painel/mensagens/'||new.conversation_id::text end;
    key:='fans_live:'||new.id::text||':refund_requested';
    perform public.enqueue_fans_transaction_notification(new.buyer_user_id,'fans_live_refund_requested','Reembolso solicitado',
      case when new.ended_reason='creator_removed_participant' then 'O criador encerrou a chamada removendo o participante. O reembolso integral da videochamada foi solicitado.'
      else 'O criador encerrou a videochamada antes do término contratado. O reembolso integral foi solicitado.' end,
      jsonb_build_object('session_id',new.id,'order_id',new.order_id,'ended_reason',new.ended_reason,'commercial_outcome',new.commercial_outcome,'refund_status',new.refund_status,'refund_amount',new.refund_amount,'route',route),key||':buyer');
    if creator_user is not null then
      perform public.enqueue_fans_transaction_notification(creator_user,'fans_live_refund_requested_creator','Reembolso da videochamada',
        'A sessão foi encerrada antes do término e o reembolso integral foi solicitado. O valor não será creditado como receita da sessão.',
        jsonb_build_object('session_id',new.id,'order_id',new.order_id,'ended_reason',new.ended_reason,'commercial_outcome',new.commercial_outcome,'refund_status',new.refund_status,'refund_amount',new.refund_amount,'route',route),key||':creator');
    end if;
  end if;
  return new;
end $$;

revoke all on function public.mark_fans_live_refund_failed(uuid) from public,anon,authenticated;
revoke all on function public.finalize_fans_live_refund_ledger() from public,anon,authenticated;
revoke all on function public.mark_fans_live_refund_state() from public,anon,authenticated;
revoke all on function public.notify_fans_live_closure_detail() from public,anon,authenticated;
revoke all on function public.prepare_fans_live_refund(uuid) from public,anon;
grant execute on function public.prepare_fans_live_refund(uuid) to authenticated;
revoke all on function public.end_fans_live_session(uuid) from public,anon;
grant execute on function public.end_fans_live_session(uuid) to authenticated;
revoke all on function public.kick_fans_live_participant(uuid) from public,anon;
grant execute on function public.kick_fans_live_participant(uuid) to authenticated;

drop trigger if exists fans_live_refund_state on public.fans_live_sessions;
create trigger fans_live_refund_state before update on public.fans_live_sessions for each row execute function public.mark_fans_live_refund_state();

drop trigger if exists fans_live_refund_ledger on public.fans_live_sessions;
create trigger fans_live_refund_ledger after update of status on public.fans_live_sessions for each row execute function public.finalize_fans_live_refund_ledger();

drop trigger if exists fans_live_closure_detail_notification on public.fans_live_sessions;
create trigger fans_live_closure_detail_notification after update on public.fans_live_sessions for each row execute function public.notify_fans_live_closure_detail();

commit;