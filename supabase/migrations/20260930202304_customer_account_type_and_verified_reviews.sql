alter table public.profiles add column if not exists account_type text not null default 'customer';

alter table public.profiles drop constraint if exists profiles_account_type_check;
alter table public.profiles add constraint profiles_account_type_check check (account_type in ('customer','advertiser','creator','both','partner','affiliate','staff'));

update public.profiles p set account_type = case
  when exists (select 1 from public.advertiser_profiles a where a.user_id = p.id) and exists (select 1 from public.fans_creators c where c.user_id = p.id) then 'both'
  when exists (select 1 from public.advertiser_profiles a where a.user_id = p.id) then 'advertiser'
  when exists (select 1 from public.fans_creators c where c.user_id = p.id) then 'creator'
  when exists (select 1 from public.affiliates x where x.user_id = p.id) then 'affiliate'
  when exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'partner') then 'partner'
  when exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role in ('super_admin','admin','moderator','support','finance')) then 'staff'
  else 'customer' end;

create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  source_type text not null check (source_type in ('digital_content','profile_media','service_experience')),
  source_id uuid not null,
  verified_interaction boolean not null default true,
  status text not null default 'approved' check (status in ('pending','approved','rejected','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_reviews_not_self check (customer_user_id <> reviewer_user_id),
  constraint customer_reviews_unique_source unique (reviewer_user_id, source_type, source_id)
);

create index if not exists customer_reviews_customer_status_idx on public.customer_reviews(customer_user_id, status, verified_interaction);
create index if not exists customer_reviews_source_idx on public.customer_reviews(source_type, source_id);
alter table public.customer_reviews enable row level security;
revoke all on table public.customer_reviews from anon, authenticated;
grant all on table public.customer_reviews to service_role;
drop trigger if exists customer_reviews_set_updated_at on public.customer_reviews;
create trigger customer_reviews_set_updated_at before update on public.customer_reviews for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public
as $function$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  meta_cpf text := nullif(regexp_replace(coalesce(meta->>'cpf', ''), '\D', '', 'g'), '');
  meta_birth_date date;
  v_entry_mode text;
  v_account_type text := 'customer';
begin
  begin meta_birth_date := nullif(meta->>'birth_date', '')::date; exception when others then meta_birth_date := null; end;
  select ri.entry_mode into v_entry_mode from public.registration_intents ri where ri.user_id = new.id and ri.consumed_at is null and ri.expires_at > now() order by ri.created_at desc limit 1;
  v_account_type := case v_entry_mode when 'advertiser' then 'advertiser' when 'fans' then 'creator' when 'both' then 'both' when 'customer' then 'customer' else 'customer' end;
  insert into public.profiles (id,display_name,legal_name,email,phone,cpf,birth_date,account_type)
  values (new.id,nullif(trim(coalesce(meta->>'display_name', '')), ''),nullif(trim(coalesce(meta->>'display_name', '')), ''),new.email,nullif(trim(coalesce(meta->>'phone', '')), ''),meta_cpf,meta_birth_date,v_account_type)
  on conflict (id) do update set
    display_name=coalesce(excluded.display_name,public.profiles.display_name),
    legal_name=coalesce(excluded.legal_name,public.profiles.legal_name),
    email=coalesce(excluded.email,public.profiles.email),
    phone=coalesce(excluded.phone,public.profiles.phone),
    cpf=coalesce(excluded.cpf,public.profiles.cpf),
    birth_date=coalesce(excluded.birth_date,public.profiles.birth_date),
    account_type=case when public.profiles.account_type in ('partner','affiliate','staff') then public.profiles.account_type else excluded.account_type end,
    updated_at=now();
  return new;
end;
$function$;

create or replace function private.guard_profile_sensitive_fields()
returns trigger language plpgsql security definer set search_path to 'public','private'
as $function$
begin
  if not private.is_staff() then
    if tg_op = 'INSERT' then
      if new.status <> 'pending'::account_status or new.verification_status <> 'unverified'::verification_status then
        raise exception 'A criação de conta deve iniciar em estado pendente e não verificado';
      end if;
    else
      if new.status is distinct from old.status or new.verification_status is distinct from old.verification_status or new.cpf is distinct from old.cpf or new.account_type is distinct from old.account_type
         or (new.legal_name is distinct from old.legal_name and current_setting('app.profile_update_authorized', true) <> 'true')
         or (new.birth_date is distinct from old.birth_date and current_setting('app.profile_update_authorized', true) <> 'true') then
        raise exception 'Campos de identidade, tipo de conta, verificação ou status somente podem ser alterados pelo fluxo autorizado';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

create or replace function private.protect_profile_sensitive_fields()
returns trigger language plpgsql security definer set search_path to 'public','private'
as $function$
begin
  if auth.uid() is not null and not private.is_staff() then
    if new.status is distinct from old.status or new.verification_status is distinct from old.verification_status or new.account_type is distinct from old.account_type then
      raise exception 'profile_sensitive_field_forbidden';
    end if;
  end if;
  return new;
end;
$function$;