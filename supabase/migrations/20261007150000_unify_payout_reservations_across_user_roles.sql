-- Unifica a reserva de saques por usuário quando a mesma conta atua como Acompanhante e vendedora.
create or replace function private.fans_payout_available(p_creator_id uuid)
returns numeric
language sql
stable
security definer
set search_path to pg_catalog, public, private
as $$
select greatest(
  coalesce((select sum(amount) from public.fans_financial_ledger where creator_id=p_creator_id and status='posted' and direction='credit'),0)
  - coalesce((select sum(amount) from public.fans_financial_ledger where creator_id=p_creator_id and status='posted' and direction='debit'),0)
  + coalesce((select sum(case when le.entry_type in ('credit','adjustment') then le.amount else -le.amount end) from public.ledger_entries le join public.fans_creators fc on fc.user_id=le.user_id where fc.id=p_creator_id),0)
  - coalesce((select sum(amount) from public.fans_payout_requests where (creator_id=p_creator_id or seller_user_id=(select user_id from public.fans_creators where id=p_creator_id)) and status in ('requested','approved','processing')),0),
  0
)
$$;

create or replace function private.seller_payout_available(p_user_id uuid)
returns numeric
language sql
stable
security definer
set search_path to pg_catalog, public, private
as $$
select greatest(
  coalesce((select sum(case when entry_type in ('credit','adjustment') then amount else -amount end) from public.ledger_entries where user_id=p_user_id),0)
  + coalesce((select sum(case when direction='credit' then amount else -amount end) from public.fans_financial_ledger fl join public.fans_creators fc on fc.id=fl.creator_id where fc.user_id=p_user_id and fl.status='posted'),0)
  - coalesce((select sum(amount) from public.fans_payout_requests where (seller_user_id=p_user_id or creator_id in (select id from public.fans_creators where user_id=p_user_id)) and status in ('requested','approved','processing')),0),
  0
)
$$;