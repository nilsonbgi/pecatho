-- Partner storefront: curated external product links (marketplaces or partner-owned sites).
create table if not exists public.partner_store_products (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.partner_venues(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 140),
  description text,
  category text not null default 'Geral' check (char_length(trim(category)) between 2 and 60),
  external_url text not null check (external_url ~* '^https://'),
  image_url text check (image_url is null or image_url ~* '^https?://'),
  price_label text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_store_products_public_idx
  on public.partner_store_products (venue_id, is_published, category, sort_order, created_at desc);

alter table public.partner_store_products enable row level security;

drop policy if exists partner_store_products_public_read on public.partner_store_products;
create policy partner_store_products_public_read on public.partner_store_products
  for select to anon, authenticated using (is_published = true);

drop policy if exists partner_store_products_owner_read on public.partner_store_products;
create policy partner_store_products_owner_read on public.partner_store_products
  for select to authenticated using (owner_user_id = auth.uid());

drop policy if exists partner_store_products_owner_insert on public.partner_store_products;
create policy partner_store_products_owner_insert on public.partner_store_products
  for insert to authenticated with check (
    owner_user_id = auth.uid()
    and exists (select 1 from public.partner_venues v where v.id = venue_id and v.owner_user_id = auth.uid())
  );

drop policy if exists partner_store_products_owner_update on public.partner_store_products;
create policy partner_store_products_owner_update on public.partner_store_products
  for update to authenticated using (owner_user_id = auth.uid())
  with check (
    owner_user_id = auth.uid()
    and exists (select 1 from public.partner_venues v where v.id = venue_id and v.owner_user_id = auth.uid())
  );

drop policy if exists partner_store_products_owner_delete on public.partner_store_products;
create policy partner_store_products_owner_delete on public.partner_store_products
  for delete to authenticated using (owner_user_id = auth.uid());

grant select on public.partner_store_products to anon, authenticated;
grant insert, update, delete on public.partner_store_products to authenticated;
