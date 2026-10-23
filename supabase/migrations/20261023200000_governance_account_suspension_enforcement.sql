-- Apply governance suspension outcomes to the canonical account status.
-- Temporary suspensions are restored on the next authenticated /painel request
-- after their deadline. Existing commercial data and unrelated account states are preserved.

create table if not exists public.governance_account_suspensions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  report_id uuid not null references public.governance_reports(id) on delete restrict,
  outcome text not null check (outcome in ('temporary_suspension','permanent_suspension')),
  previous_status public.account_status not null,
  suspension_until timestamptz,
  reason text not null,
  applied_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expired_at timestamptz,
  constraint governance_account_suspension_deadline_check check (
    (outcome = 'temporary_suspension' and suspension_until is not null)
    or (outcome = 'permanent_suspension' and suspension_until is null)
  )
);

alter table public.governance_account_suspensions enable row level security;
revoke all on public.governance_account_suspensions from public, anon, authenticated;
drop policy if exists governance_account_suspensions_read_staff on public.governance_account_suspensions;
create policy governance_account_suspensions_read_staff
  on public.governance_account_suspensions for select to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('super_admin','admin','moderator','support')
    )
  );
grant select on public.governance_account_suspensions to authenticated;

create or replace function private.restore_expired_governance_suspension(p_user_id uuid)
returns public.account_status
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_status public.account_status;
  v_suspension public.governance_account_suspensions%rowtype;
begin
  if auth.uid() is null or (auth.uid() <> p_user_id and not private.is_staff()) then
    raise exception 'Não autorizado.';
  end if;

  select * into v_suspension
  from public.governance_account_suspensions
  where user_id = p_user_id
  for update;

  if found
     and v_suspension.outcome = 'temporary_suspension'
     and v_suspension.expired_at is null
     and v_suspension.suspension_until <= now() then
    update public.profiles
       set status = v_suspension.previous_status
     where id = p_user_id
       and status = 'suspended'::public.account_status;

    update public.governance_account_suspensions
       set expired_at = now(), updated_at = now()
     where user_id = p_user_id
       and expired_at is null;
  end if;

  select status into v_status from public.profiles where id = p_user_id;
  return v_status;
end;
$$;

revoke all on function private.restore_expired_governance_suspension(uuid) from public, anon, authenticated;

create or replace function public.enforce_my_governance_suspension_expiry()
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_status public.account_status;
begin
  if auth.uid() is null then
    raise exception 'Sessão necessária.';
  end if;

  v_status := private.restore_expired_governance_suspension(auth.uid());
  return v_status::text;
end;
$$;

revoke all on function public.enforce_my_governance_suspension_expiry() from public, anon;
grant execute on function public.enforce_my_governance_suspension_expiry() to authenticated;

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
set search_path = pg_catalog, public, private
as $$
declare
  v_next_status text;
  v_target_user_id uuid;
  v_profile_status public.account_status;
  v_previous_status public.account_status;
  v_existing public.governance_account_suspensions%rowtype;
  v_until timestamptz;
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

  select target_user_id into v_target_user_id
  from public.governance_reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'Denúncia não encontrada; nenhuma decisão foi registrada.';
  end if;

  select status into v_profile_status
  from public.profiles
  where id = v_target_user_id
  for update;

  if not found then
    raise exception 'Conta denunciada não encontrada.';
  end if;

  select * into v_existing
  from public.governance_account_suspensions
  where user_id = v_target_user_id
  for update;

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

  if p_outcome = 'permanent_suspension' then
    v_previous_status := case
      when found and v_existing.expired_at is null then v_existing.previous_status
      else v_profile_status
    end;

    update public.profiles set status = 'blocked'::public.account_status
    where id = v_target_user_id;

    insert into public.governance_account_suspensions (
      user_id, report_id, outcome, previous_status, suspension_until,
      reason, applied_by, updated_at, expired_at
    ) values (
      v_target_user_id, p_report_id, 'permanent_suspension', v_previous_status,
      null, trim(p_rationale), p_reviewer_user_id, now(), null
    )
    on conflict (user_id) do update set
      report_id = excluded.report_id,
      outcome = 'permanent_suspension',
      previous_status = case
        when public.governance_account_suspensions.expired_at is null
          then public.governance_account_suspensions.previous_status
        else excluded.previous_status
      end,
      suspension_until = null,
      reason = excluded.reason,
      applied_by = excluded.applied_by,
      updated_at = now(),
      expired_at = null;

  elsif p_outcome = 'temporary_suspension' and v_profile_status <> 'blocked'::public.account_status then
    v_previous_status := case
      when v_existing.user_id is not null
       and v_existing.expired_at is null
       and v_existing.outcome = 'temporary_suspension'
        then v_existing.previous_status
      else v_profile_status
    end;

    v_until := case
      when v_existing.user_id is not null
       and v_existing.expired_at is null
       and v_existing.outcome = 'temporary_suspension'
        then greatest(v_existing.suspension_until, p_suspension_until)
      else p_suspension_until
    end;

    update public.profiles set status = 'suspended'::public.account_status
    where id = v_target_user_id;

    insert into public.governance_account_suspensions (
      user_id, report_id, outcome, previous_status, suspension_until,
      reason, applied_by, updated_at, expired_at
    ) values (
      v_target_user_id, p_report_id, 'temporary_suspension', v_previous_status,
      v_until, trim(p_rationale), p_reviewer_user_id, now(), null
    )
    on conflict (user_id) do update set
      report_id = excluded.report_id,
      outcome = 'temporary_suspension',
      previous_status = case
        when public.governance_account_suspensions.expired_at is null
         and public.governance_account_suspensions.outcome = 'temporary_suspension'
          then public.governance_account_suspensions.previous_status
        else excluded.previous_status
      end,
      suspension_until = case
        when public.governance_account_suspensions.expired_at is null
         and public.governance_account_suspensions.outcome = 'temporary_suspension'
          then greatest(public.governance_account_suspensions.suspension_until, excluded.suspension_until)
        else excluded.suspension_until
      end,
      reason = excluded.reason,
      applied_by = excluded.applied_by,
      updated_at = now(),
      expired_at = null;
  end if;
end;
$$;

revoke all on function public.record_governance_decision(uuid, uuid, text, text, timestamptz) from public, anon;
grant execute on function public.record_governance_decision(uuid, uuid, text, text, timestamptz) to authenticated;
