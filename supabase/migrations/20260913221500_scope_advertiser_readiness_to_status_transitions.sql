create or replace function private.guard_advertiser_operational_readiness()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $function$
declare
  address_ok boolean;
  schedule_ok boolean := false;
  prices_ok boolean;
  payments_ok boolean := false;
  methods jsonb;
  availability_json jsonb;
  age_years integer;
  media_count integer := 0;
  approved_primary_count integer := 0;
  selected_service_count integer := 0;
  required_service_count integer := 0;
  selected_required_service_count integer := 0;
  entering_publishable_state boolean := false;
begin
  if new.status not in ('pending_review'::profile_status, 'published'::profile_status) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    entering_publishable_state := true;
  elsif old.status is distinct from new.status then
    entering_publishable_state := true;
  end if;

  if not entering_publishable_state then
    return new;
  end if;

  if coalesce(length(trim(new.title)), 0) < 3 then
    raise exception 'Informe um título válido antes do envio/publicação';
  end if;
  if coalesce(length(trim(new.summary)), 0) < 20 then
    raise exception 'Complete a apresentação curta do anúncio antes do envio/publicação';
  end if;
  if coalesce(length(trim(new.description)), 0) < 50 then
    raise exception 'Complete a descrição do anúncio antes do envio/publicação';
  end if;
  if new.category_id is null then
    raise exception 'Selecione uma categoria antes do envio/publicação';
  end if;
  if new.birth_date is null then
    raise exception 'A data de nascimento precisa estar preenchida antes do envio/publicação';
  end if;

  age_years := extract(year from age(current_date, new.birth_date));
  if age_years < 18 then
    raise exception 'O anunciante precisa ter 18 anos ou mais para publicar um anúncio';
  end if;

  select exists (
    select 1 from public.user_addresses ua
    where ua.user_id = new.user_id
      and ua.address_type = 'primary'
      and ua.city_id is not null
      and ua.state_id is not null
      and ua.latitude is not null
      and ua.longitude is not null
  ) into address_ok;
  if not address_ok then
    raise exception 'A localização precisa possuir endereço primário, Estado, Cidade e coordenadas do mapa antes do envio/publicação';
  end if;

  if coalesce(length(trim(new.availability)), 0) > 0 then
    if left(ltrim(new.availability), 1) in ('{','[') then
      begin
        availability_json := new.availability::jsonb;
        if jsonb_typeof(availability_json) = 'object' then
          schedule_ok := (jsonb_typeof(availability_json->'schedule') = 'array' and jsonb_array_length(availability_json->'schedule') > 0)
            or (jsonb_typeof(availability_json->'schedule') = 'object' and exists (select 1 from jsonb_each(availability_json->'schedule')));
        end if;
      exception when others then
        schedule_ok := false;
      end;
    else
      schedule_ok := true;
    end if;
  end if;
  if not schedule_ok then
    raise exception 'Configure a disponibilidade de atendimento antes do envio/publicação';
  end if;

  prices_ok := jsonb_typeof(coalesce(new.pricing, '{}'::jsonb)) = 'object'
    and jsonb_typeof(new.pricing->'periods') = 'array'
    and jsonb_array_length(new.pricing->'periods') > 0
    and exists (
      select 1
      from jsonb_array_elements(new.pricing->'periods') p
      where coalesce((p->>'price')::numeric, 0) > 0
    );
  if not prices_ok then
    raise exception 'Cadastre ao menos um preço por período com valor maior que zero antes do envio/publicação';
  end if;

  if jsonb_typeof(coalesce(new.payment_options, '{}'::jsonb)) = 'object' then
    methods := new.payment_options->'methods';
    if jsonb_typeof(methods) = 'object' then
      select exists (select 1 from jsonb_each(methods) e(key, value) where e.value = 'true'::jsonb) into payments_ok;
    end if;
  end if;
  if not payments_ok then
    raise exception 'Configure ao menos uma forma de pagamento antes do envio/publicação';
  end if;

  if coalesce(length(regexp_replace(coalesce(new.phone, ''), '\D', '', 'g')), 0) < 10
     and coalesce(length(regexp_replace(coalesce(new.whatsapp, ''), '\D', '', 'g')), 0) < 10 then
    raise exception 'Informe um telefone ou WhatsApp válido para contato antes do envio/publicação';
  end if;

  select count(*) into media_count
  from public.profile_media
  where profile_id = new.id;
  if media_count = 0 then
    raise exception 'Adicione pelo menos uma mídia antes de enviar para análise';
  end if;

  select count(*) into approved_primary_count
  from public.profile_media
  where profile_id = new.id
    and is_primary = true
    and kind = 'image'::media_kind
    and moderation_status = 'approved'::moderation_status;
  if approved_primary_count = 0 then
    raise exception 'O anúncio precisa possuir uma foto principal aprovada pela moderação antes do envio/publicação';
  end if;

  select count(*) into selected_service_count
  from public.profile_services ps
  where ps.profile_id = new.id
    and ps.selected = true;
  select count(*) into required_service_count
  from public.category_services cs
  where cs.category_id = new.category_id
    and cs.required = true;
  select count(*) into selected_required_service_count
  from public.profile_services ps
  join public.category_services cs on cs.id = ps.service_id
  where ps.profile_id = new.id
    and ps.selected = true
    and cs.required = true;

  if required_service_count > 0 and selected_required_service_count <> required_service_count then
    raise exception 'Complete os serviços obrigatórios da categoria antes do envio/publicação';
  end if;
  if exists (select 1 from public.category_services where category_id = new.category_id) and selected_service_count = 0 then
    raise exception 'Selecione pelo menos um serviço do anúncio antes do envio/publicação';
  end if;

  return new;
end;
$function$;

revoke all on function private.guard_advertiser_operational_readiness() from public, anon, authenticated;
grant execute on function private.guard_advertiser_operational_readiness() to postgres;

drop trigger if exists trg_guard_advertiser_operational_readiness on public.advertiser_profiles;
create trigger trg_guard_advertiser_operational_readiness
before insert or update of status
on public.advertiser_profiles
for each row execute function private.guard_advertiser_operational_readiness();
