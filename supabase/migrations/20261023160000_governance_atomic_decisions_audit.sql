-- Complete the governance audit trail and make administrative decisions atomic.
-- Existing report/decision data is preserved; no commercial tables are modified.

create table if not exists public.governance_audit_log (
  id bigint generated always as identity primary key,
  report_id uuid references public.governance_reports(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists governance_audit_report_created_idx
  on public.governance_audit_log(report_id, created_at desc);

alter table public.governance_audit_log enable row level security;

drop policy if exists governance_audit_read_reporter_or_staff on public.governance_audit_log;
create policy governance_audit_read_reporter_or_staff
  on public.governance_audit_log for select to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('super_admin','admin','moderator','support')
    )
    or exists (
      select 1 from public.governance_reports gr
      where gr.id = report_id and gr.reporter_user_id = (select auth.uid())
    )
  );

grant select on public.governance_audit_log to authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.governance_audit_log from anon, authenticated;

create or replace function private.governance_audit_report_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.governance_audit_log(report_id, actor_user_id, event_type, details)
    values (
      new.id,
      auth.uid(),
      'report_submitted',
      jsonb_build_object('category', new.category, 'target_user_id', new.target_user_id)
    );
    return new;
  end if;

  if old.status is distinct from new.status
     or old.decision_reason is distinct from new.decision_reason
     or old.reviewer_user_id is distinct from new.reviewer_user_id
     or old.decided_at is distinct from new.decided_at then
    insert into public.governance_audit_log(report_id, actor_user_id, event_type, details)
    values (
      new.id,
      auth.uid(),
      'report_status_changed',
      jsonb_build_object(
        'from', old.status,
        'to', new.status,
        'reviewer_user_id', new.reviewer_user_id,
        'decided_at', new.decided_at,
        'has_decision_reason', new.decision_reason is not null
      )
    );
  end if;

  return new;
end;
$$;

revoke all on function private.governance_audit_report_change() from public, anon, authenticated;
drop trigger if exists governance_report_audit_trigger on public.governance_reports;
create trigger governance_report_audit_trigger
  after insert or update on public.governance_reports
  for each row execute function private.governance_audit_report_change();

create or replace function public.record_governance_decision(
  p_report_id uuid,
  p_reviewer_user_id uuid,
  p_outcome text,
  p_rationale text,
  p_suspension_until timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_next_status text;
begin
  if auth.uid() is null or auth.uid() <> p_reviewer_user_id then
    raise exception 'Sessão inválida para registrar a decisão.';
  end if;

  if not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('super_admin','admin','moderator','support')
  ) then
    raise exception 'Usuário sem permissão para registrar decisões de governança.';
  end if;

  if p_outcome not in ('no_action','warning','temporary_suspension','permanent_suspension','content_removal') then
    raise exception 'Medida de governança inválida.';
  end if;

  if p_rationale is null or char_length(trim(p_rationale)) < 20 or char_length(trim(p_rationale)) > 3000 then
    raise exception 'A fundamentação deve conter entre 20 e 3000 caracteres.';
  end if;

  if p_outcome = 'temporary_suspension' then
    if p_suspension_until is null or p_suspension_until <= now() then
      raise exception 'A suspensão temporária exige uma data final futura.';
    end if;
  elsif p_suspension_until is not null then
    raise exception 'A data final só pode ser informada para suspensão temporária.';
  end if;

  v_next_status := case when p_outcome = 'no_action' then 'rejected' else 'actioned' end;

  insert into public.governance_decisions (
    report_id, reviewer_user_id, outcome, rationale, suspension_until
  ) values (
    p_report_id, p_reviewer_user_id, p_outcome, trim(p_rationale), p_suspension_until
  );

  update public.governance_reports
  set status = v_next_status,
      decision_reason = trim(p_rationale),
      reviewer_user_id = p_reviewer_user_id,
      decided_at = now()
  where id = p_report_id;

  if not found then
    raise exception 'Denúncia não encontrada; nenhuma decisão foi registrada.';
  end if;
end;
$$;

revoke all on function public.record_governance_decision(uuid, uuid, text, text, timestamptz) from public, anon;
grant execute on function public.record_governance_decision(uuid, uuid, text, text, timestamptz) to authenticated;
