-- Partner venues and profile RPC hardening
drop function if exists public.update_my_profile(text,text,text,date);

create table if not exists public.partner_venues (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  venue_type text not null default 'nightclub' check (venue_type in ('nightclub','club','bar','lounge','event_space','other')),
  description text,
  phone text,
  website_url text,
  instagram_url text,
  zipcode text,
  street text,
  number text,
  complement text,
  neighborhood text,
  state_id bigint references public.states(id),
  city_id bigint references public.cities(id),
  status text not null default 'draft' check (status in ('draft','pending_review','published','paused','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.partner_venues enable row level security;
create index if not exists partner_venues_owner_idx on public.partner_venues(owner_user_id);
create index if not exists partner_venues_location_idx on public.partner_venues(state_id,city_id);
create index if not exists partner_venues_status_idx on public.partner_venues(status);
create policy partner_venues_owner_select on public.partner_venues for select to authenticated using (owner_user_id=auth.uid());
create policy partner_venues_owner_insert on public.partner_venues for insert to authenticated with check (owner_user_id=auth.uid() and status='draft');
create policy partner_venues_owner_update on public.partner_venues for update to authenticated using (owner_user_id=auth.uid()) with check (owner_user_id=auth.uid() and status in ('draft','rejected','paused'));
create policy partner_venues_public_select on public.partner_venues for select to anon,authenticated using (status='published');
create or replace function public.submit_partner_venue_for_review(p_venue_id uuid)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public' as $$
declare v public.partner_venues%rowtype;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into v from public.partner_venues where id=p_venue_id and owner_user_id=auth.uid() for update;
 if not found then raise exception 'PARTNER_VENUE_NOT_FOUND'; end if;
 if v.status not in ('draft','rejected','paused') then raise exception 'PARTNER_VENUE_NOT_SUBMITTABLE'; end if;
 update public.partner_venues set status='pending_review',rejection_reason=null,updated_at=now() where id=v.id;
 return jsonb_build_object('ok',true,'venue_id',v.id,'status','pending_review');
end $$;
create or replace function public.update_partner_venue_updated_at()
returns trigger language plpgsql set search_path='pg_catalog','public' as $$
begin new.updated_at=now(); return new; end $$;
drop trigger if exists partner_venues_updated_at on public.partner_venues;
create trigger partner_venues_updated_at before update on public.partner_venues for each row execute function public.update_partner_venue_updated_at();
