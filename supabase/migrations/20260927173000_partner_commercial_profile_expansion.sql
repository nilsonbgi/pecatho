alter table public.partner_venues
  add column if not exists tagline text,
  add column if not exists highlights text,
  add column if not exists recruitment_enabled boolean not null default false,
  add column if not exists recruitment_title text,
  add column if not exists recruitment_description text,
  add column if not exists recruitment_contact_phone text,
  add column if not exists recruitment_contact_email text,
  add column if not exists recruitment_contact_whatsapp text;

create table if not exists public.partner_venue_amenities (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.partner_venues(id) on delete cascade,
  name text not null,
  description text,
  icon_key text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_venue_rates (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.partner_venues(id) on delete cascade,
  period_type text not null check (period_type in ('daily','weekend','weekly','monthly','season')),
  label text not null,
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'BRL',
  minimum_nights integer check (minimum_nights is null or minimum_nights > 0),
  notes text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_venue_amenities_venue_idx on public.partner_venue_amenities(venue_id, active, sort_order);
create index if not exists partner_venue_rates_venue_idx on public.partner_venue_rates(venue_id, active, sort_order);

alter table public.partner_venue_amenities enable row level security;
alter table public.partner_venue_rates enable row level security;

drop policy if exists partner_venue_amenities_owner_select on public.partner_venue_amenities;
create policy partner_venue_amenities_owner_select on public.partner_venue_amenities
  for select to authenticated
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_amenities.venue_id and v.owner_user_id = auth.uid()));

drop policy if exists partner_venue_amenities_owner_write on public.partner_venue_amenities;
create policy partner_venue_amenities_owner_write on public.partner_venue_amenities
  for all to authenticated
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_amenities.venue_id and v.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.partner_venues v where v.id = partner_venue_amenities.venue_id and v.owner_user_id = auth.uid()));

drop policy if exists partner_venue_amenities_public_select on public.partner_venue_amenities;
create policy partner_venue_amenities_public_select on public.partner_venue_amenities
  for select to anon, authenticated
  using (active and exists (select 1 from public.partner_venues v where v.id = partner_venue_amenities.venue_id and v.status = 'published'));

drop policy if exists partner_venue_rates_owner_select on public.partner_venue_rates;
create policy partner_venue_rates_owner_select on public.partner_venue_rates
  for select to authenticated
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_rates.venue_id and v.owner_user_id = auth.uid()));

drop policy if exists partner_venue_rates_owner_write on public.partner_venue_rates;
create policy partner_venue_rates_owner_write on public.partner_venue_rates
  for all to authenticated
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_rates.venue_id and v.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.partner_venues v where v.id = partner_venue_rates.venue_id and v.owner_user_id = auth.uid()));

drop policy if exists partner_venue_rates_public_select on public.partner_venue_rates;
create policy partner_venue_rates_public_select on public.partner_venue_rates
  for select to anon, authenticated
  using (active and exists (select 1 from public.partner_venues v where v.id = partner_venue_rates.venue_id and v.status = 'published'));
