begin;

create or replace function public.fans_live_financial_reconciliation(p_creator_id uuid)
returns table(
  gross_live_sales numeric,
  live_refunds numeric,
  live_creator_holds numeric,
  live_hold_releases numeric,
  live_net_creator_impact numeric,
  live_completed_count bigint,
  live_refunded_count bigint,
  live_refund_pending_count bigint,
  available numeric
)
language plpgsql
stable
security definer
set search_path=pg_catalog,public,private
as $$
declare
  v_user_id uuid := auth.uid();
  v_staff boolean := coalesce(private.is_staff(),false);
begin
  if not v_staff and (
    v_user_id is null or not exists(
      select 1 from public.fans_creators fc
      where fc.id=p_creator_id and fc.user_id=v_user_id and fc.status='active'
    )
  ) then raise exception 'Criador não autorizado'; end if;

  return query
  with live as (
    select * from public.fans_live_sessions s where s.creator_id=p_creator_id
  ),
  ledger as (
    select
      coalesce(sum(fl.amount) filter(where fl.entry_type='sale_gross' and fl.direction='credit' and fl.status='posted'),0) gross_sales,
      coalesce(sum(fl.amount) filter(where fl.entry_type='refund_creator_hold' and fl.direction='debit' and fl.status='posted' and fl.metadata->>'reservation_status' in ('refunded','finalized_by_refund')),0) refunds,
      coalesce(sum(fl.amount) filter(where fl.entry_type='refund_creator_hold' and fl.direction='debit' and fl.status='posted' and fl.metadata->>'reservation_status'='pending_provider_refund'),0) holds,
      coalesce(sum(fl.amount) filter(where fl.entry_type='refund_creator_hold_release' and fl.direction='credit' and fl.status='posted'),0) releases
    from public.fans_financial_ledger fl
    where fl.creator_id=p_creator_id
      and fl.order_id in (select order_id from live where order_id is not null)
  ),
  balance as (select private.fans_payout_available(p_creator_id) value)
  select ledger.gross_sales,ledger.refunds,ledger.holds,ledger.releases,
    ledger.gross_sales-ledger.refunds-ledger.holds+ledger.releases,
    (select count(*) from live where status='completed'),
    (select count(*) from live where status='completed' and refund_status='refunded'),
    (select count(*) from live where status='completed' and refund_status in ('required','requested','failed')),
    balance.value
  from ledger cross join balance;
end;
$$;

revoke all on function public.fans_live_financial_reconciliation(uuid) from public,anon;
grant execute on function public.fans_live_financial_reconciliation(uuid) to authenticated;

commit;
