-- Expose the unified seller payout lifecycle to the authenticated application layer.
-- Keeps advertiser/content sellers on the same ledger and payout table used by Fans.

create unique index if not exists fans_payout_seller_idempotency_uidx
  on public.fans_payout_requests(seller_user_id, idempotency_key)
  where seller_user_id is not null and idempotency_key is not null;

create or replace function public.request_seller_payout(p_amount numeric, p_idempotency_key text)
returns table(
  payout_id uuid,
  amount numeric,
  currency character,
  status text,
  available_before numeric,
  available_after numeric
)
language plpgsql
security definer
set search_path to pg_catalog,public,private
as $$
begin
  return query
  select *
  from private.request_seller_payout(p_amount, p_idempotency_key);
end;
$$;

revoke all on function public.request_seller_payout(numeric,text) from public;
grant execute on function public.request_seller_payout(numeric,text) to authenticated;
