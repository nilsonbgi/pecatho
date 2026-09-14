create or replace function public.update_my_address(
  p_zipcode text default null,
  p_street text default null,
  p_number text default null,
  p_complement text default null,
  p_neighborhood_id bigint default null,
  p_city_id bigint default null,
  p_state_id bigint default null
)
returns public.user_addresses
language plpgsql
security definer
set search_path = public
as $function$
declare
  r public.user_addresses;
  current_user_id uuid := auth.uid();
  normalized_zipcode text := nullif(regexp_replace(coalesce(p_zipcode, ''), '[^0-9]', '', 'g'), '');
begin
  if current_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_state_id is not null and not exists (
    select 1 from public.states s where s.id = p_state_id
  ) then
    raise exception 'Estado informado não existe';
  end if;

  if p_city_id is not null and not exists (
    select 1 from public.cities c where c.id = p_city_id and (p_state_id is null or c.state_id = p_state_id)
  ) then
    raise exception 'Cidade não pertence ao Estado informado';
  end if;

  if p_neighborhood_id is not null and not exists (
    select 1 from public.neighborhoods n where n.id = p_neighborhood_id and (p_city_id is null or n.city_id = p_city_id)
  ) then
    raise exception 'Bairro não pertence à Cidade informada';
  end if;

  if normalized_zipcode is not null and length(normalized_zipcode) <> 8 then
    raise exception 'CEP inválido';
  end if;

  update public.user_addresses
     set zipcode = normalized_zipcode,
         street = nullif(btrim(p_street), ''),
         number = nullif(btrim(p_number), ''),
         complement = nullif(btrim(p_complement), ''),
         neighborhood_id = p_neighborhood_id,
         city_id = p_city_id,
         state_id = p_state_id,
         updated_at = now()
   where user_id = current_user_id and is_primary = true
   returning * into r;

  if not found then
    insert into public.user_addresses(
      user_id,address_type,zipcode,street,number,complement,
      neighborhood_id,city_id,state_id,is_primary,location_visibility,
      created_at,updated_at
    ) values (
      current_user_id,'primary',normalized_zipcode,nullif(btrim(p_street), ''),
      nullif(btrim(p_number), ''),nullif(btrim(p_complement), ''),
      p_neighborhood_id,p_city_id,p_state_id,true,'private',now(),now()
    ) returning * into r;
  end if;

  return r;
end;
$function$;
