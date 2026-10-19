-- Prevent any account other than the designated owner from claiming the first-admin bootstrap.
create or replace function public.bootstrap_first_super_admin()
returns public.user_roles
language plpgsql
security definer
set search_path = ''
as $function$
declare
  r public.user_roles;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Sessão de usuário não encontrada';
  end if;

  v_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  if v_email <> 'nilson.umasno@gmail.com' then
    raise exception 'Somente a conta administrativa designada pode executar a configuração inicial';
  end if;

  if exists (select 1 from public.user_roles) then
    raise exception 'A administração inicial já foi configurada';
  end if;

  insert into public.user_roles(user_id, role)
  values (auth.uid(), 'super_admin'::public.user_role)
  returning * into r;

  return r;
end;
$function$;

revoke execute on function public.bootstrap_first_super_admin() from public;
revoke execute on function public.bootstrap_first_super_admin() from anon;
revoke execute on function public.bootstrap_first_super_admin() from authenticated;
