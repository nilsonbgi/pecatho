create table if not exists public.content_seller_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('advertiser','creator')),
  owner_id uuid not null,
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  source_type text not null check (source_type in ('digital_content','profile_media')),
  source_id uuid not null,
  verified_purchase boolean not null default true,
  status text not null default 'pending' check (status in ('pending','approved','rejected','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_user_id, source_type, source_id)
);

create index if not exists content_seller_reviews_owner_idx
  on public.content_seller_reviews (owner_type, owner_id, status, created_at desc);

create index if not exists content_seller_reviews_buyer_idx
  on public.content_seller_reviews (buyer_user_id, status);

alter table public.content_seller_reviews enable row level security;

drop policy if exists content_seller_reviews_public_select on public.content_seller_reviews;
create policy content_seller_reviews_public_select
  on public.content_seller_reviews
  for select
  to anon, authenticated
  using (status = 'approved' and verified_purchase = true);

revoke insert, update, delete on public.content_seller_reviews from anon, authenticated;

grant select on public.content_seller_reviews to anon, authenticated;
