create or replace function private.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path=public,private
as $function$
begin
  if not private.is_staff() then
    if tg_op = 'INSERT' then
      if new.status <> 'pending'::account_status or new.verification_status <> 'unverified'::verification_status then
        raise exception 'A criação de conta deve iniciar em estado pendente e não verificado';
      end if;
    else
      if new.status is distinct from old.status
         or new.verification_status is distinct from old.verification_status
         or (new.cpf is distinct from old.cpf and current_setting('app.profile_update_authorized', true) <> 'true')
         or (new.legal_name is distinct from old.legal_name and current_setting('app.profile_update_authorized', true) <> 'true')
         or (new.birth_date is distinct from old.birth_date and current_setting('app.profile_update_authorized', true) <> 'true')
      then
        raise exception 'Campos de identidade, verificação ou status somente podem ser alterados pelo fluxo autorizado';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

comment on function private.guard_profile_sensitive_fields() is
'Protege CPF, nome legal, nascimento, status e verificação; permite alteração de identidade somente dentro da RPC autorizada update_my_profile.';
