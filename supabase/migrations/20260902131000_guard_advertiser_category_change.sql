create or replace function private.guard_advertiser_category_change()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  attr_count integer;
  service_count integer;
begin
  if new.category_id is distinct from old.category_id and old.category_id is not null then
    select count(*) into attr_count from public.profile_attribute_values where profile_id = new.id;
    select count(*) into service_count from public.profile_services where profile_id = new.id;
    if attr_count > 0 or service_count > 0 then
      raise exception 'Não é possível alterar a categoria enquanto existem características ou serviços vinculados ao anúncio. Revise o catálogo antes de trocar a categoria.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_advertiser_category_change on public.advertiser_profiles;
create trigger trg_guard_advertiser_category_change
before update of category_id on public.advertiser_profiles
for each row execute function private.guard_advertiser_category_change();

revoke all on function private.guard_advertiser_category_change() from public, anon, authenticated;
