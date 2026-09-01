-- Cria o perfil-base no momento da criação do usuário no Auth.
-- Anunciantes e Fans continuam sendo capacidades independentes e não são criados aqui.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  meta_cpf text := nullif(regexp_replace(coalesce(meta->>'cpf', ''), '\\D', '', 'g'), '');
  meta_birth_date date;
begin
  begin
    meta_birth_date := nullif(meta->>'birth_date', '')::date;
  exception when others then
    meta_birth_date := null;
  end;

  insert into public.profiles (
    id,
    display_name,
    legal_name,
    email,
    phone,
    cpf,
    birth_date
  ) values (
    new.id,
    nullif(trim(coalesce(meta->>'display_name', '')), ''),
    nullif(trim(coalesce(meta->>'display_name', '')), ''),
    new.email,
    nullif(trim(coalesce(meta->>'phone', '')), ''),
    meta_cpf,
    meta_birth_date
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    legal_name = coalesce(excluded.legal_name, public.profiles.legal_name),
    email = coalesce(excluded.email, public.profiles.email),
    phone = coalesce(excluded.phone, public.profiles.phone),
    cpf = coalesce(excluded.cpf, public.profiles.cpf),
    birth_date = coalesce(excluded.birth_date, public.profiles.birth_date),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
