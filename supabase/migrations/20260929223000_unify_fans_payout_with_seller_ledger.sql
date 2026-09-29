-- Reconcile Fans payouts with the unified seller ledger used by digital content and paid profile media.
create or replace function private.fans_payout_available(p_creator_id uuid) returns numeric language sql stable security definer set search_path to pg_catalog,public,private as $$
  select greatest(
    coalesce((select sum(amount) from public.fans_financial_ledger where creator_id=p_creator_id and status='posted' and direction='credit'),0)
    - coalesce((select sum(amount) from public.fans_financial_ledger where creator_id=p_creator_id and status='posted' and direction='debit'),0)
    + coalesce((select sum(case when entry_type in ('credit','adjustment') then amount else -amount end) from public.ledger_entries le join public.fans_creators fc on fc.user_id=le.user_id where fc.id=p_creator_id),0)
    - coalesce((select sum(amount) from public.fans_payout_requests where creator_id=p_creator_id and status in ('requested','approved','processing')),0),0)
$$;
