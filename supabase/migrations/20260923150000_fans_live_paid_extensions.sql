-- Fans live paid extensions
-- The database migration was applied in Supabase before this source migration was recorded.
-- This file documents the extension-request schema and API contract used by the room.

create table if not exists public.fans_live_extension_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fans_live_sessions(id) on delete cascade,
  creator_id uuid not null references public.fans_creators(id) on delete restrict,
  buyer_user_id uuid not null,
  minutes integer not null check (minutes in (15,30)),
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'BRL',
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','rejected','refunded','expired','cancelled')),
  order_id uuid references public.orders(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  requested_at timestamptz not null default now(),
  paid_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fans_live_extension_requests_session_idx
  on public.fans_live_extension_requests(session_id,status,created_at desc);

create unique index if not exists fans_live_extension_requests_pending_idx
  on public.fans_live_extension_requests(session_id)
  where status='pending_payment';

alter table public.fans_live_extension_requests enable row level security;

drop policy if exists fans_live_extension_requests_participants_select
  on public.fans_live_extension_requests;

create policy fans_live_extension_requests_participants_select
on public.fans_live_extension_requests
for select to authenticated
using (
  buyer_user_id = auth.uid()
  or exists (
    select 1
    from public.fans_creators fc
    where fc.id = creator_id
      and fc.user_id = auth.uid()
  )
);

-- Runtime RPCs:
-- request_fans_live_extension(uuid, integer)
-- reject_fans_live_extension(uuid)
-- get_fans_live_extension_checkout(uuid)
-- settle_fans_live_extension_checkout(uuid, text, text, payment_status, text, numeric)
