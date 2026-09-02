alter table public.profile_media
  add column if not exists access_type text not null default 'public',
  add column if not exists price numeric(12,2) not null default 0,
  add column if not exists currency char(3) not null default 'BRL',
  add column if not exists preview_storage_bucket text,
  add column if not exists preview_storage_path text;

alter table public.profile_media drop constraint if exists profile_media_access_type_check;
alter table public.profile_media add constraint profile_media_access_type_check check (access_type in ('public','paid'));
alter table public.profile_media drop constraint if exists profile_media_price_check;
alter table public.profile_media add constraint profile_media_price_check check (price >= 0);
alter table public.profile_media drop constraint if exists profile_media_paid_requires_price;
alter table public.profile_media add constraint profile_media_paid_requires_price check (access_type <> 'paid' or price > 0);

update public.profile_media set access_type = case when is_public then 'public' else 'paid' end where access_type = 'public' and is_public = false;
update public.profile_media set is_public = (access_type = 'public');

create index if not exists profile_media_profile_access_idx on public.profile_media(profile_id, access_type, moderation_status, sort_order);
create index if not exists profile_media_public_idx on public.profile_media(profile_id, is_public, moderation_status, sort_order);

drop policy if exists profile_media_public_catalog_select on public.profile_media;
create policy profile_media_public_catalog_select on public.profile_media for select to anon, authenticated using (
  moderation_status = 'approved' and exists (select 1 from public.advertiser_profiles p where p.id = profile_media.profile_id and p.status = 'published')
);
grant select on table public.profile_media to anon, authenticated;

create table if not exists public.profile_service_experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.advertiser_profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_label text,
  occurred_at timestamptz not null default now(),
  verification_source text not null default 'pecatho',
  external_reference text,
  status text not null default 'verified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_service_experiences_status_check check (status in ('verified','revoked'))
);
create index if not exists profile_service_experiences_profile_idx on public.profile_service_experiences(profile_id, status, occurred_at desc);
create index if not exists profile_service_experiences_user_idx on public.profile_service_experiences(user_id, status, occurred_at desc);

alter table public.profile_feedback
  add column if not exists experience_id uuid references public.profile_service_experiences(id) on delete set null,
  add column if not exists experience_verified boolean not null default false,
  add column if not exists published_at timestamptz;
create unique index if not exists profile_feedback_experience_unique on public.profile_feedback(experience_id) where experience_id is not null;
create index if not exists profile_feedback_profile_status_idx on public.profile_feedback(profile_id, status, created_at desc);

create table if not exists public.profile_media_purchases (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.profile_media(id) on delete cascade,
  buyer_user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null,
  currency char(3) not null default 'BRL',
  status text not null default 'pending',
  provider text,
  provider_reference text,
  order_id uuid references public.orders(id) on delete set null,
  purchased_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_media_purchases_amount_check check (amount >= 0),
  constraint profile_media_purchases_status_check check (status in ('pending','paid','refunded','cancelled','failed'))
);
create unique index if not exists profile_media_purchases_buyer_media_unique on public.profile_media_purchases(media_id, buyer_user_id) where status in ('pending','paid');
create index if not exists profile_media_purchases_buyer_idx on public.profile_media_purchases(buyer_user_id, status, created_at desc);
create index if not exists profile_media_purchases_media_idx on public.profile_media_purchases(media_id, status, created_at desc);

alter table public.profile_service_experiences enable row level security;
alter table public.profile_media_purchases enable row level security;
revoke all on table public.profile_service_experiences from anon;
revoke all on table public.profile_media_purchases from anon;
grant select on table public.profile_service_experiences to authenticated;
grant select on table public.profile_media_purchases to authenticated;

drop policy if exists profile_service_experiences_owner_select on public.profile_service_experiences;
create policy profile_service_experiences_owner_select on public.profile_service_experiences for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists profile_service_experiences_staff_select on public.profile_service_experiences;
create policy profile_service_experiences_staff_select on public.profile_service_experiences for select to authenticated using (private.is_staff());

drop policy if exists profile_media_purchases_buyer_select on public.profile_media_purchases;
create policy profile_media_purchases_buyer_select on public.profile_media_purchases for select to authenticated using ((select auth.uid()) = buyer_user_id);
drop policy if exists profile_media_purchases_owner_select on public.profile_media_purchases;
create policy profile_media_purchases_owner_select on public.profile_media_purchases for select to authenticated using (
  exists (select 1 from public.profile_media m join public.advertiser_profiles p on p.id = m.profile_id where m.id = profile_media_purchases.media_id and p.user_id = (select auth.uid()))
);
drop policy if exists profile_media_purchases_staff_select on public.profile_media_purchases;
create policy profile_media_purchases_staff_select on public.profile_media_purchases for select to authenticated using (private.is_staff());
revoke insert, update, delete on table public.profile_media_purchases from authenticated;

drop policy if exists profile_feedback_public_verified_select on public.profile_feedback;
create policy profile_feedback_public_verified_select on public.profile_feedback for select to anon, authenticated using (
  status = 'approved' and experience_verified = true and exists (select 1 from public.advertiser_profiles p where p.id = profile_feedback.profile_id and p.status = 'published')
);
drop policy if exists profile_feedback_verified_experience_insert on public.profile_feedback;
create policy profile_feedback_verified_experience_insert on public.profile_feedback for insert to authenticated with check (
  (select auth.uid()) = author_user_id and status = 'pending' and experience_verified = true and exists (
    select 1 from public.profile_service_experiences e where e.id = experience_id and e.profile_id = profile_id and e.user_id = (select auth.uid()) and e.status = 'verified'
  )
);
drop policy if exists profile_feedback_owner_select_verified on public.profile_feedback;
create policy profile_feedback_owner_select_verified on public.profile_feedback for select to authenticated using (
  exists (select 1 from public.advertiser_profiles p where p.id = profile_feedback.profile_id and p.user_id = (select auth.uid()))
);

insert into storage.buckets (id, name, public) values ('pecatho-private','pecatho-private',false) on conflict (id) do update set public = false;

comment on table public.profile_service_experiences is 'Registro verificável de que um usuário utilizou um serviço de uma anunciante; base para avaliações autênticas.';
comment on table public.profile_media_purchases is 'Controle de acesso pago a fotos e vídeos privados de anunciantes.';
comment on column public.profile_media.access_type is 'public = mídia aberta; paid = mídia condicionada a compra.';
comment on column public.profile_media.preview_storage_path is 'Prévia pública opcional para mídia paga; nunca deve apontar para o arquivo original privado.';