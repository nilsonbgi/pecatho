begin;

-- A single payment legitimately creates multiple ledger lines sharing the
-- same provider reference (gross, provider fee, platform fee, creator credit).
-- The previous unique key on (provider, provider_reference) would reject the
-- second line and make a valid settlement fail. Uniqueness belongs to the
-- ledger semantic line, not the whole provider transaction.
drop index if exists public.fans_financial_ledger_provider_reference_uq;

create unique index if not exists fans_financial_ledger_provider_reference_entry_uq
  on public.fans_financial_ledger(provider, provider_reference, entry_type)
  where provider is not null and provider_reference is not null and status='posted';

commit;
