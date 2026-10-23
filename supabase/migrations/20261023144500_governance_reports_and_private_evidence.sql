-- Habilita a central de governança usada por /painel/seguranca e /admin/governanca.
-- Evidências permanecem privadas e só podem ser lidas pelo denunciante e pela equipe autorizada.

create table if not exists public.governance_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles(id) on delete restrict,
  target_user_id uuid not null references public.profiles(id) on delete restrict,
  category text not null check (category in ('fraude','assedio','ameaca','privacidade','conteudo_sem_consentimento','falsa_identidade','spam','outro')),
  justification text not null check (char_length(btrim(justification)) between 30 and 5000),
  status text not null default 'submitted' check (status in ('submitted','under_review','actioned','rejected','appealed','closed')),
  incident_at timestamptz,
  decision_reason text,
  reviewer_user_id uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint governance_reports_not_self_reported check (reporter_user_id <> target_user_id)
);

create index if not exists governance_reports_status_created_idx on public.governance_reports(status, created_at);
create index if not exists governance_reports_reporter_created_idx on public.governance_reports(reporter_user_id, created_at desc);
create index if not exists governance_reports_target_created_idx on public.governance_reports(target_user_id, created_at desc);

create table if not exists public.governance_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.governance_reports(id) on delete cascade,
  uploader_user_id uuid not null references public.profiles(id) on delete restrict,
  storage_bucket text not null default 'governance-evidence' check (storage_bucket = 'governance-evidence'),
  storage_path text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/heic','application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

create index if not exists governance_evidence_report_created_idx on public.governance_evidence(report_id, created_at);

create table if not exists public.governance_decisions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.governance_reports(id) on delete restrict,
  reviewer_user_id uuid not null references public.profiles(id) on delete restrict,
  outcome text not null check (outcome in ('no_action','warning','temporary_suspension','permanent_suspension','content_removal')),
  rationale text not null check (char_length(btrim(rationale)) >= 20),
  suspension_until timestamptz,
  created_at timestamptz not null default now(),
  constraint governance_decisions_temporary_suspension_date check (outcome <> 'temporary_suspension' or suspension_until is not null)
);

create index if not exists governance_decisions_report_created_idx on public.governance_decisions(report_id, created_at desc);

create table if not exists public.governance_user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete restrict,
  reason text not null check (char_length(btrim(reason)) between 10 and 1000),
  created_at timestamptz not null default now(),
  constraint governance_user_blocks_not_self check (blocker_user_id <> blocked_user_id),
  constraint governance_user_blocks_unique_pair unique (blocker_user_id, blocked_user_id)
);

create index if not exists governance_user_blocks_blocked_idx on public.governance_user_blocks(blocked_user_id);

alter table public.governance_reports enable row level security;
alter table public.governance_evidence enable row level security;
alter table public.governance_decisions enable row level security;
alter table public.governance_user_blocks enable row level security;

drop policy if exists governance_reports_read_reporter_or_staff on public.governance_reports;
create policy governance_reports_read_reporter_or_staff
  on public.governance_reports for select to authenticated
  using (
    reporter_user_id = (select auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('super_admin','admin','moderator','support')
    )
  );

drop policy if exists governance_reports_submit_own on public.governance_reports;
create policy governance_reports_submit_own
  on public.governance_reports for insert to authenticated
  with check (
    reporter_user_id = (select auth.uid())
    and target_user_id <> (select auth.uid())
    and status = 'submitted'
    and reviewer_user_id is null
    and decided_at is null
  );

drop policy if exists governance_reports_update_staff on public.governance_reports;
create policy governance_reports_update_staff
  on public.governance_reports for update to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('super_admin','admin','moderator','support')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('super_admin','admin','moderator','support')
    )
  );

drop policy if exists governance_evidence_read_reporter_or_staff on public.governance_evidence;
create policy governance_evidence_read_reporter_or_staff
  on public.governance_evidence for select to authenticated
  using (
    exists (
      select 1 from public.governance_reports gr
      where gr.id = report_id
        and (
          gr.reporter_user_id = (select auth.uid())
          or exists (
            select 1 from public.user_roles ur
            where ur.user_id = (select auth.uid())
              and ur.role in ('super_admin','admin','moderator','support')
          )
        )
    )
  );

drop policy if exists governance_evidence_add_to_own_report on public.governance_evidence;
create policy governance_evidence_add_to_own_report
  on public.governance_evidence for insert to authenticated
  with check (
    uploader_user_id = (select auth.uid())
    and exists (
      select 1 from public.governance_reports gr
      where gr.id = report_id and gr.reporter_user_id = (select auth.uid())
    )
  );

drop policy if exists governance_decisions_read_staff on public.governance_decisions;
create policy governance_decisions_read_staff
  on public.governance_decisions for select to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('super_admin','admin','moderator','support')
    )
  );

drop policy if exists governance_decisions_add_staff on public.governance_decisions;
create policy governance_decisions_add_staff
  on public.governance_decisions for insert to authenticated
  with check (
    reviewer_user_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('super_admin','admin','moderator','support')
    )
  );

drop policy if exists governance_user_blocks_read_own on public.governance_user_blocks;
create policy governance_user_blocks_read_own
  on public.governance_user_blocks for select to authenticated
  using (blocker_user_id = (select auth.uid()));

drop policy if exists governance_user_blocks_add_own on public.governance_user_blocks;
create policy governance_user_blocks_add_own
  on public.governance_user_blocks for insert to authenticated
  with check (
    blocker_user_id = (select auth.uid())
    and blocked_user_id <> (select auth.uid())
  );

drop policy if exists governance_user_blocks_remove_own on public.governance_user_blocks;
create policy governance_user_blocks_remove_own
  on public.governance_user_blocks for delete to authenticated
  using (blocker_user_id = (select auth.uid()));

grant select, insert, update on public.governance_reports to authenticated;
grant select, insert on public.governance_evidence to authenticated;
grant select, insert on public.governance_decisions to authenticated;
grant select, insert, delete on public.governance_user_blocks to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('governance-evidence', 'governance-evidence', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists governance_evidence_storage_upload_own_report on storage.objects;
create policy governance_evidence_storage_upload_own_report
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'governance-evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.governance_reports gr
      where gr.id::text = (storage.foldername(name))[2]
        and gr.reporter_user_id = (select auth.uid())
    )
  );

drop policy if exists governance_evidence_storage_read_reporter_or_staff on storage.objects;
create policy governance_evidence_storage_read_reporter_or_staff
  on storage.objects for select to authenticated
  using (
    bucket_id = 'governance-evidence'
    and exists (
      select 1
      from public.governance_evidence ge
      join public.governance_reports gr on gr.id = ge.report_id
      where ge.storage_bucket = bucket_id
        and ge.storage_path = name
        and (
          gr.reporter_user_id = (select auth.uid())
          or exists (
            select 1 from public.user_roles ur
            where ur.user_id = (select auth.uid())
              and ur.role in ('super_admin','admin','moderator','support')
          )
        )
    )
  );

grant usage on schema public to authenticated;
