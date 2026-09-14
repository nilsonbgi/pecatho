create or replace function private.generate_advertiser_slug()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_city text;
  v_name text;
  v_base text;
  v_slug text;
  v_suffix text;
begin
  select c.name into v_city from public.cities c where c.id = new.city_id;
  v_name := coalesce(nullif(btrim(new.display_name), ''), nullif(btrim(new.title), ''), 'anunciante');
  v_base := lower(trim(regexp_replace(v_name || '-' || coalesce(v_city, 'brasil'), '[^[:alnum:]]+', '-', 'g')));
  v_base := trim(both '-' from v_base);
  if v_base = '' then v_base := 'anunciante-brasil'; end if;
  v_slug := left(v_base, 180);
  if exists (select 1 from public.advertiser_profiles p where p.slug::text = v_slug and p.id <> new.id) then
    v_suffix := '-' || left(replace(new.id::text, '-', ''), 12);
    v_slug := left(v_base, 200 - length(v_suffix)) || v_suffix;
  end if;
  new.slug := v_slug;
  return new;
end;
$$;

drop trigger if exists trg_generate_advertiser_slug on public.advertiser_profiles;
create trigger trg_generate_advertiser_slug
before insert or update of display_name, title, city_id
on public.advertiser_profiles
for each row execute function private.generate_advertiser_slug();

update public.advertiser_profiles p
set slug = lower(trim(both '-' from regexp_replace(coalesce(nullif(btrim(p.display_name), ''), nullif(btrim(p.title), ''), 'anunciante') || '-' || coalesce(c.name, 'brasil'), '[^[:alnum:]]+', '-', 'g')))
from public.cities c
where c.id = p.city_id
  and p.slug is null;
