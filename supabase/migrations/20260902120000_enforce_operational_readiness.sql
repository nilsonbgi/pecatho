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
begin
  if new.status not in ('pending_review'::profile_status, 'published'::profile_status) then
    return new;
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
    and jsonb_array_length(new.pricing->'periods') > 0;
  if not prices_ok then
    raise exception 'Cadastre ao menos um preço por período antes do envio/publicação';
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

  return new;
end;
$function$;

revoke all on function private.guard_advertiser_operational_readiness() from public, anon, authenticated;
grant execute on function private.guard_advertiser_operational_readiness() to postgres;

drop trigger if exists trg_guard_advertiser_operational_readiness on public.advertiser_profiles;
create trigger trg_guard_advertiser_operational_readiness
before insert or update of status, availability, pricing, payment_options, state_id, city_id
on public.advertiser_profiles
for each row execute function private.guard_advertiser_operational_readiness();
