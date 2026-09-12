alter table public.fans_payout_requests drop constraint if exists fans_payout_requests_status_check;

alter table public.fans_payout_requests
  add constraint fans_payout_requests_status_check
  check (status = any (array['requested','approved','processing','paid','rejected','failed','cancelled']));

alter table public.fans_financial_ledger drop constraint if exists fans_financial_ledger_entry_type_check;

alter table public.fans_financial_ledger
  add constraint fans_financial_ledger_entry_type_check
  check (entry_type = any (array['sale_gross','provider_fee','platform_fee','creator_credit','buyer_fee','refund','chargeback','adjustment','payout']));
