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
         or new.cpf is distinct from old.cpf
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

create or replace function public.update_my_profile(
 p_display_name text,
 p_legal_name text,
 p_phone text,
 p_birth_date date,
 p_cpf text default null
) returns public.profiles
language plpgsql
security definer
set search_path=public
as $function$
declare
 r public.profiles;
 v_display_name text := nullif(btrim(p_display_name), '');
 v_legal_name text := nullif(btrim(p_legal_name), '');
 v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '');
 v_cpf text := nullif(regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g'), '');
begin
 if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
 if p_birth_date is not null and p_birth_date > current_date then raise exception 'A data de nascimento não pode estar no futuro'; end if;
 if v_phone is not null and (length(v_phone) < 10 or length(v_phone) > 13) then raise exception 'Telefone inválido'; end if;
 if v_cpf is not null and length(v_cpf) <> 11 then raise exception 'CPF inválido'; end if;
 perform set_config('app.profile_update_authorized','true',true);
 update public.profiles
    set display_name=v_display_name,legal_name=v_legal_name,phone=v_phone,birth_date=p_birth_date,
        cpf=case when cpf is null or btrim(cpf)='' then v_cpf else cpf end,updated_at=now()
  where id=auth.uid()
  returning * into r;
 if not found then raise exception 'Perfil do usuário não encontrado'; end if;
 return r;
end;
$function$;

revoke all on function public.update_my_profile(text,text,text,date,text) from public;
grant execute on function public.update_my_profile(text,text,text,date,text) to authenticated;