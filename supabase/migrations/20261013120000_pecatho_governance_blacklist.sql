-- Pecatho governance: private reports, evidence metadata, personal blocks and auditable moderation decisions.
create table if not exists public.governance_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete restrict,
  target_user_id uuid not null references auth.users(id) on delete restrict,
  category text not null check (category in ('fraude','assedio','ameaca','privacidade','conteudo_sem_consentimento','falsa_identidade','spam','outro')),
  justification text not null check (char_length(trim(justification)) between 30 and 5000),
  incident_at timestamptz,
  status text not null default 'submitted' check (status in ('submitted','under_review','actioned','rejected','appealed','closed')),
  reviewer_user_id uuid references auth.users(id) on delete set null,
  decision_reason text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reporter_user_id <> target_user_id)
);
create index if not exists governance_reports_reporter_created_idx on public.governance_reports(reporter_user_id, created_at desc);
create index if not exists governance_reports_target_created_idx on public.governance_reports(target_user_id, created_at desc);
create index if not exists governance_reports_status_created_idx on public.governance_reports(status, created_at asc);

create table if not exists public.governance_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.governance_reports(id) on delete cascade,
  uploader_user_id uuid not null references auth.users(id) on delete restrict,
  storage_bucket text not null default 'governance-evidence' check (storage_bucket = 'governance-evidence'),
  storage_path text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/heic','application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);
create index if not exists governance_evidence_report_idx on public.governance_evidence(report_id, created_at);

create table if not exists public.governance_user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 10 and 1000),
  created_at timestamptz not null default now(),
  check (blocker_user_id <> blocked_user_id),
  unique (blocker_user_id, blocked_user_id)
);
create index if not exists governance_blocks_blocked_idx on public.governance_user_blocks(blocked_user_id);

create table if not exists public.governance_decisions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.governance_reports(id) on delete restrict,
  reviewer_user_id uuid not null references auth.users(id) on delete restrict,
  outcome text not null check (outcome in ('no_action','warning','temporary_suspension','permanent_suspension','content_removal')),
  rationale text not null check (char_length(trim(rationale)) between 20 and 3000),
  suspension_until timestamptz,
  created_at timestamptz not null default now(),
  check ((outcome = 'temporary_suspension' and suspension_until is not null) or (outcome <> 'temporary_suspension' and suspension_until is null))
);
create index if not exists governance_decisions_report_idx on public.governance_decisions(report_id, created_at desc);

create table if not exists public.governance_audit_log (
  id bigint generated always as identity primary key,
  report_id uuid references public.governance_reports(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists governance_audit_report_idx on public.governance_audit_log(report_id, created_at desc);

create or replace function private.governance_is_staff()
returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('super_admin','admin','moderator','support')
  );
$$;
revoke all on function private.governance_is_staff() from public, anon;
grant execute on function private.governance_is_staff() to authenticated;

create or replace function private.governance_audit_report_change()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.governance_audit_log(report_id, actor_user_id, event_type, details)
    values (new.id, auth.uid(), 'report_submitted', jsonb_build_object('category',new.category,'target_user_id',new.target_user_id));
    return new;
  end if;
  if old.status is distinct from new.status or old.decision_reason is distinct from new.decision_reason then
    insert into public.governance_audit_log(report_id, actor_user_id, event_type, details)
    values (new.id, auth.uid(), 'report_status_changed', jsonb_build_object('from',old.status,'to',new.status,'has_decision_reason',new.decision_reason is not null));
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.governance_audit_report_change() from public, anon, authenticated;
drop trigger if exists governance_report_audit_trigger on public.governance_reports;
create trigger governance_report_audit_trigger before insert or update on public.governance_reports
for each row execute function private.governance_audit_report_change();

alter table public.governance_reports enable row level security;
alter table public.governance_evidence enable row level security;
alter table public.governance_user_blocks enable row level security;
alter table public.governance_decisions enable row level security;
alter table public.governance_audit_log enable row level security;

drop policy if exists governance_reports_insert_own on public.governance_reports;
create policy governance_reports_insert_own on public.governance_reports for insert to authenticated
with check (reporter_user_id = (select auth.uid()) and reporter_user_id <> target_user_id);
drop policy if exists governance_reports_select_own_or_staff on public.governance_reports;
create policy governance_reports_select_own_or_staff on public.governance_reports for select to authenticated
using (reporter_user_id = (select auth.uid()) or (select private.governance_is_staff()));
drop policy if exists governance_reports_update_staff on public.governance_reports;
create policy governance_reports_update_staff on public.governance_reports for update to authenticated
using ((select private.governance_is_staff())) with check ((select private.governance_is_staff()));

drop policy if exists governance_evidence_insert_own_report on public.governance_evidence;
create policy governance_evidence_insert_own_report on public.governance_evidence for insert to authenticated
with check (
  uploader_user_id = (select auth.uid())
  and exists (select 1 from public.governance_reports r where r.id = report_id and r.reporter_user_id = (select auth.uid()))
  and storage_path like ( (select auth.uid())::text || '/' || report_id::text || '/%' )
);
drop policy if exists governance_evidence_select_reporter_or_staff on public.governance_evidence;
create policy governance_evidence_select_reporter_or_staff on public.governance_evidence for select to authenticated
using (
  uploader_user_id = (select auth.uid())
  or (select private.governance_is_staff())
);
drop policy if exists governance_blocks_select_own on public.governance_user_blocks;
create policy governance_blocks_select_own on public.governance_user_blocks for select to authenticated
using (blocker_user_id = (select auth.uid()));
drop policy if exists governance_blocks_insert_own on public.governance_user_blocks;
create policy governance_blocks_insert_own on public.governance_user_blocks for insert to authenticated
with check (blocker_user_id = (select auth.uid()) and blocker_user_id <> blocked_user_id);
drop policy if exists governance_blocks_delete_own on public.governance_user_blocks;
create policy governance_blocks_delete_own on public.governance_user_blocks for delete to authenticated
using (blocker_user_id = (select auth.uid()));

drop policy if exists governance_decisions_select_staff_or_reporter on public.governance_decisions;
create policy governance_decisions_select_staff_or_reporter on public.governance_decisions for select to authenticated
using (
  (select private.governance_is_staff())
  or exists (select 1 from public.governance_reports r where r.id = report_id and r.reporter_user_id = (select auth.uid()))
);
drop policy if exists governance_decisions_insert_staff on public.governance_decisions;
create policy governance_decisions_insert_staff on public.governance_decisions for insert to authenticated
with check ((select private.governance_is_staff()) and reviewer_user_id = (select auth.uid()));
drop policy if exists governance_audit_select_staff_or_reporter on public.governance_audit_log;
create policy governance_audit_select_staff_or_reporter on public.governance_audit_log for select to authenticated
using ((select private.governance_is_staff()) or exists (select 1 from public.governance_reports r where r.id = report_id and r.reporter_user_id = (select auth.uid())));

grant select, insert, update on public.governance_reports to authenticated;
grant select, insert on public.governance_evidence to authenticated;
grant select, insert, delete on public.governance_user_blocks to authenticated;
grant select, insert on public.governance_decisions to authenticated;
grant select on public.governance_audit_log to authenticated;
grant usage, select on sequence public.governance_audit_log_id_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('governance-evidence','governance-evidence',false,10485760,array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','application/pdf'];

drop policy if exists governance_evidence_storage_insert on storage.objects;
create policy governance_evidence_storage_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'governance-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and array_length(storage.foldername(name),1) >= 2
  and exists (
    select 1 from public.governance_reports r
    where r.id::text = (storage.foldername(name))[2]
      and r.reporter_user_id = (select auth.uid())
  )
);
drop policy if exists governance_evidence_storage_select on storage.objects;
create policy governance_evidence_storage_select on storage.objects for select to authenticated
using (
  bucket_id = 'governance-evidence'
  and (
    owner_id = (select auth.uid())::text
    or (select private.governance_is_staff())
  )
);
drop policy if exists governance_evidence_storage_delete on storage.objects;
create policy governance_evidence_storage_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'governance-evidence'
  and owner_id = (select auth.uid())::text
  and exists (
    select 1 from public.governance_reports r
    where r.id::text = (storage.foldername(name))[2]
      and r.reporter_user_id = (select auth.uid())
      and r.status = 'submitted'
  )
);
