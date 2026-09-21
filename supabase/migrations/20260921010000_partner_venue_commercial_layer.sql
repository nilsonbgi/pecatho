create table if not exists public.partner_venue_hours (
 id uuid primary key default gen_random_uuid(), venue_id uuid not null references public.partner_venues(id) on delete cascade,
 weekday smallint not null check (weekday between 0 and 6), open_time time, close_time time, is_closed boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (venue_id,weekday)
);
create table if not exists public.partner_venue_services (
 id uuid primary key default gen_random_uuid(), venue_id uuid not null references public.partner_venues(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 2 and 120), description text, price_from numeric(12,2),
 currency text not null default 'BRL' check (currency='BRL'), active boolean not null default true, sort_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.partner_venue_events (
 id uuid primary key default gen_random_uuid(), venue_id uuid not null references public.partner_venues(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 2 and 160), description text, starts_at timestamptz not null, ends_at timestamptz,
 price_from numeric(12,2), currency text not null default 'BRL' check (currency='BRL'),
 status text not null default 'draft' check (status in ('draft','published','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (ends_at is null or ends_at > starts_at)
);
create index if not exists partner_venue_hours_venue_idx on public.partner_venue_hours(venue_id);
create index if not exists partner_venue_services_venue_idx on public.partner_venue_services(venue_id,sort_order);
create index if not exists partner_venue_events_venue_idx on public.partner_venue_events(venue_id,starts_at);
alter table public.partner_venue_hours enable row level security;
alter table public.partner_venue_services enable row level security;
alter table public.partner_venue_events enable row level security;
drop policy if exists partner_venue_hours_owner_select on public.partner_venue_hours;
create policy partner_venue_hours_owner_select on public.partner_venue_hours for select to authenticated using (exists(select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid()));
drop policy if exists partner_venue_hours_owner_write on public.partner_venue_hours;
create policy partner_venue_hours_owner_write on public.partner_venue_hours for all to authenticated using (exists(select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid())) with check (exists(select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid()));
drop policy if exists partner_venue_hours_public_select on public.partner_venue_hours;
create policy partner_venue_hours_public_select on public.partner_venue_hours for select to anon,authenticated using (exists(select 1 from public.partner_venues v where v.id=venue_id and v.status='published'));
drop policy if exists partner_venue_services_owner_select on public.partner_venue_services;
create policy partner_venue_services_owner_select on public.partner_venue_services for select to authenticated using (exists(select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid()));
drop policy if exists partner_venue_services_owner_write on public.partner_venue_services;
create policy partner_venue_services_owner_write on public.partner_venue_services for all to authenticated using (exists(select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid())) with check (exists(select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid()));
drop policy if exists partner_venue_services_public_select on public.partner_venue_services;
create policy partner_venue_services_public_select on public.partner_venue_services for select to anon,authenticated using (active and exists(select 1 from public.partner_venues v where v.id=venue_id and v.status='published'));
drop policy if exists partner_venue_events_owner_select on public.partner_venue_events;
create policy partner_venue_events_owner_select on public.partner_venue_events for select to authenticated using (exists(select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid()));
drop policy if exists partner_venue_events_owner_write on public.partner_venue_events;
create policy partner_venue_events_owner_write on public.partner_venue_events for all to authenticated using (exists(select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid())) with check (exists(select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid()));
drop policy if exists partner_venue_events_public_select on public.partner_venue_events;
create policy partner_venue_events_public_select on public.partner_venue_events for select to anon,authenticated using (status='published' and exists(select 1 from public.partner_venues v where v.id=venue_id and v.status='published'));
create or replace function public.touch_partner_commercial_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists partner_venue_hours_updated_at on public.partner_venue_hours;
create trigger partner_venue_hours_updated_at before update on public.partner_venue_hours for each row execute function public.touch_partner_commercial_updated_at();
drop trigger if exists partner_venue_services_updated_at on public.partner_venue_services;
create trigger partner_venue_services_updated_at before update on public.partner_venue_services for each row execute function public.touch_partner_commercial_updated_at();
drop trigger if exists partner_venue_events_updated_at on public.partner_venue_events;
create trigger partner_venue_events_updated_at before update on public.partner_venue_events for each row execute function public.touch_partner_commercial_updated_at();