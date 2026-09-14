create or replace function public.update_my_profile(p_display_name text default null, p_legal_name text default null, p_phone text default null, p_birth_date date default null)
returns public.profiles
language plpgsql
set search_path = public
as $function$
declare r public.profiles;
 v_display_name text := nullif(btrim(p_display_name), '');
 v_legal_name text := nullif(btrim(p_legal_name), '');
 v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '');
begin
 if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
 if p_birth_date is not null and p_birth_date > current_date then raise exception 'A data de nascimento não pode estar no futuro'; end if;
 if v_phone is not null and (length(v_phone) < 10 or length(v_phone) > 13) then raise exception 'Telefone inválido'; end if;
 update public.profiles set display_name=v_display_name, legal_name=v_legal_name, phone=v_phone, birth_date=p_birth_date, updated_at=now() where id=auth.uid() returning * into r;
 if not found then raise exception 'Perfil do usuário não encontrado'; end if;
 return r;
end;
$function$;

create or replace function public.update_my_profile(p_display_name text, p_legal_name text, p_phone text, p_birth_date date, p_cpf text default null)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $function$
declare r public.profiles;
 v_display_name text := nullif(btrim(p_display_name), '');
 v_legal_name text := nullif(btrim(p_legal_name), '');
 v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '');
 v_cpf text := nullif(regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g'), '');
begin
 if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
 if p_birth_date is not null and p_birth_date > current_date then raise exception 'A data de nascimento não pode estar no futuro'; end if;
 if v_phone is not null and (length(v_phone) < 10 or length(v_phone) > 13) then raise exception 'Telefone inválido'; end if;
 if v_cpf is not null and length(v_cpf) <> 11 then raise exception 'CPF inválido'; end if;
 update public.profiles set display_name=v_display_name, legal_name=v_legal_name, phone=v_phone, birth_date=p_birth_date, cpf=case when cpf is null or btrim(cpf)='' then v_cpf else cpf end, updated_at=now() where id=auth.uid() returning * into r;
 if not found then raise exception 'Perfil do usuário não encontrado'; end if;
 return r;
end;
$function$;