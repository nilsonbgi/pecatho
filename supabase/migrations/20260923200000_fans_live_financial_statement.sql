begin;

create or replace function public.fans_live_financial_statement(p_creator_id uuid)
returns table(
  session_id uuid, order_id uuid, payment_id uuid, title text, session_status text,
  commercial_outcome text, ended_reason text, amount numeric, currency character,
  paid_at timestamptz, started_at timestamptz, ended_at timestamptz, refund_status text,
  refund_amount numeric, refund_reason text, sale_gross numeric, provider_fees numeric,
  platform_fees numeric, creator_credit numeric, creator_debit numeric, creator_hold numeric,
  hold_release numeric, creator_net_impact numeric
)
language plpgsql stable security definer
set search_path=pg_catalog,public,private
as $$
declare v_user_id uuid := auth.uid(); v_staff boolean := coalesce(private.is_staff(),false);
begin
  if not v_staff and (v_user_id is null or not exists(
    select 1 from public.fans_creators fc
    where fc.id=p_creator_id and fc.user_id=v_user_id and fc.status='active'
  )) then raise exception 'Criador não autorizado'; end if;
  return query
  with live as (
    select s.* from public.fans_live_sessions s where s.creator_id=p_creator_id
  ), ledger as (
    select fl.order_id,
      coalesce(sum(fl.amount) filter(where fl.direction='credit' and fl.status='posted' and fl.entry_type='sale_gross'),0) sale_gross,
      coalesce(sum(fl.amount) filter(where fl.direction='debit' and fl.status='posted' and fl.entry_type='provider_fee'),0) provider_fees,
      coalesce(sum(fl.amount) filter(where fl.direction='debit' and fl.status='posted' and fl.entry_type='platform_fee'),0) platform_fees,
      coalesce(sum(fl.amount) filter(where fl.direction='credit' and fl.status='posted'),0) creator_credit,
      coalesce(sum(fl.amount) filter(where fl.direction='debit' and fl.status='posted'),0) creator_debit,
      coalesce(sum(fl.amount) filter(where fl.direction='debit' and fl.status='posted' and fl.entry_type='refund_creator_hold' and fl.metadata->>'reservation_status'='pending_provider_refund'),0) creator_hold,
      coalesce(sum(fl.amount) filter(where fl.direction='credit' and fl.status='posted' and fl.entry_type='refund_creator_hold_release'),0) hold_release
    from public.fans_financial_ledger fl where fl.creator_id=p_creator_id group by fl.order_id
  )
  select s.id,s.order_id,s.payment_id,s.title,s.status,s.commercial_outcome,s.ended_reason,s.amount,s.currency,
    s.paid_at,s.started_at,s.ended_at,s.refund_status,s.refund_amount,s.refund_reason,
    coalesce(l.sale_gross,0),coalesce(l.provider_fees,0),coalesce(l.platform_fees,0),
    coalesce(l.creator_credit,0),coalesce(l.creator_debit,0),coalesce(l.creator_hold,0),coalesce(l.hold_release,0),
    coalesce(l.creator_credit,0)-coalesce(l.creator_debit,0)
  from live s left join ledger l on l.order_id=s.order_id
  order by coalesce(s.ended_at,s.started_at,s.created_at) desc;
end;
$$;

revoke all on function public.fans_live_financial_statement(uuid) from public,anon;
grant execute on function public.fans_live_financial_statement(uuid) to authenticated;

commit;