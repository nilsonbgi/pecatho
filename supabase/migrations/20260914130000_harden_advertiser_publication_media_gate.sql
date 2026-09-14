create or replace function private.admin_moderate_advertiser(p_profile_id uuid, p_action text)
returns public.advertiser_profiles
language plpgsql
security definer
set search_path = public, private
as $function$
declare
  result public.advertiser_profiles;
  pending_media integer;
begin
  if auth.uid() is null then
    raise exception 'Sessão não autenticada';
  end if;

  if not private.is_staff() then
    raise exception 'Acesso administrativo não autorizado';
  end if;

  if p_action not in ('verify', 'reject', 'publish', 'pause') then
    raise exception 'Ação administrativa inválida';
  end if;

  select *
    into result
    from public.advertiser_profiles
   where id = p_profile_id
   for update;

  if not found then
    raise exception 'Anúncio não encontrado';
  end if;

  if p_action = 'verify' then
    update public.advertiser_profiles
       set verification_status = 'verified',
           updated_at = now()
     where id = result.id
     returning * into result;

  elsif p_action = 'reject' then
    update public.advertiser_profiles
       set verification_status = 'rejected',
           status = 'paused',
           updated_at = now()
     where id = result.id
     returning * into result;

  elsif p_action = 'pause' then
    update public.advertiser_profiles
       set status = 'paused',
           updated_at = now()
     where id = result.id
     returning * into result;

  elsif p_action = 'publish' then
    if result.verification_status <> 'verified' then
      raise exception 'O anunciante precisa estar verificado antes da publicação';
    end if;

    if result.category_id is null
       or result.state_id is null
       or result.city_id is null then
      raise exception 'Categoria, Estado e Cidade precisam estar preenchidos antes da publicação';
    end if;

    if result.birth_date is null then
      raise exception 'A data de nascimento precisa estar preenchida antes da publicação';
    end if;

    if coalesce(length(trim(result.title)), 0) < 3 then
      raise exception 'O anúncio precisa ter um título válido antes da publicação';
    end if;

    select count(*)
      into pending_media
      from public.profile_media
     where profile_id = result.id
       and moderation_status <> 'approved';

    if pending_media > 0 then
      raise exception 'Todas as mídias precisam estar aprovadas antes da publicação';
    end if;

    if not exists (
      select 1
        from public.profile_media
       where profile_id = result.id
    ) then
      raise exception 'O anúncio precisa possuir pelo menos uma mídia antes da publicação';
    end if;

    if not exists (
      select 1
        from public.profile_media
       where profile_id = result.id
         and moderation_status = 'approved'
         and is_public = true
         and is_primary = true
         and kind = 'image'
    ) then
      raise exception 'O anúncio precisa possuir uma imagem pública principal aprovada antes da publicação';
    end if;

    update public.advertiser_profiles
       set status = 'published',
           published_at = now(),
           updated_at = now()
     where id = result.id
     returning * into result;
  end if;

  return result;
end;
$function$;
