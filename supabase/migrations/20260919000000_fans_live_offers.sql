begin;

create table if not exists public.fans_live_offers (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.fans_creators(id) on delete cascade,
  title text not null,
  description text null,
  duration_minutes integer not null,
  price numeric(12,2) not null,
  currency char(3) not null default 'BRL',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fans_live_offers_title_check check (length(btrim(title)) between 3 and 120),
  constraint fans_live_offers_duration_check check (duration_minutes in (10,15,20,30,45,60)),
  constraint fans_live_offers_price_check check (price > 0 and price <= 100000),
  constraint fans_live_offers_currency_check check (currency='BRL'),
  constraint fans_live_offers_status_check check (status in ('active','inactive'))
);

create index if not exists fans_live_offers_creator_status_idx
  on public.fans_live_offers(creator_id,status,created_at desc);

alter table public.fans_live_offers enable row level security;

drop policy if exists fans_live_offers_owner_all on public.fans_live_offers;
create policy fans_live_offers_owner_all
on public.fans_live_offers
for all to authenticated
using (
  exists (
    select 1 from public.fans_creators fc
    where fc.id=fans_live_offers.creator_id
      and fc.user_id=(select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.fans_creators fc
    where fc.id=fans_live_offers.creator_id
      and fc.user_id=(select auth.uid())
      and fc.status='active'
  )
);

drop policy if exists fans_live_offers_public_select on public.fans_live_offers;
create policy fans_live_offers_public_select
on public.fans_live_offers
for select to anon,authenticated
using (
  status='active'
  and exists (
    select 1 from public.fans_creators fc
    where fc.id=fans_live_offers.creator_id and fc.status='active'
  )
);

create or replace function public.handle_fans_live_offer_updated_at()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  new.updated_at=now();
  return new;
end;
$$;

drop trigger if exists fans_live_offers_updated_at on public.fans_live_offers;
create trigger fans_live_offers_updated_at
before update on public.fans_live_offers
for each row execute function public.handle_fans_live_offer_updated_at();

alter publication supabase_realtime add table public.fans_live_offers;

commit;