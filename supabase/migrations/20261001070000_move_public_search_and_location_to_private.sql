do $$
declare
  v_def text;
begin
  select pg_get_functiondef('public.get_public_advertiser_location(uuid)'::regprocedure) into v_def;
  v_def := replace(v_def,'public.get_public_advertiser_location','private.get_public_advertiser_location');
  execute v_def;

  select pg_get_functiondef('public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,text,integer,integer)'::regprocedure) into v_def;
  v_def := replace(v_def,'public.search_public_advertisers','private.search_public_advertisers');
  execute v_def;
end $$;

alter function private.get_public_advertiser_location(uuid) security definer set search_path='';
alter function private.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,text,integer,integer) security definer set search_path='';

revoke execute on function private.get_public_advertiser_location(uuid) from public;
revoke execute on function private.get_public_advertiser_location(uuid) from anon, authenticated;
revoke execute on function private.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,text,integer,integer) from public;
revoke execute on function private.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,text,integer,integer) from anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.get_public_advertiser_location(uuid) to anon, authenticated;
grant execute on function private.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,integer,text,integer,integer) to anon, authenticated;

create or replace function public.get_public_advertiser_location(p_profile_id uuid)
returns table(public_latitude numeric, public_longitude numeric)
language sql security invoker set search_path='' stable
as $$ select * from private.get_public_advertiser_location(p_profile_id); $$;

revoke execute on function public.get_public_advertiser_location(uuid) from public;
grant execute on function public.get_public_advertiser_location(uuid) to anon, authenticated;

create or replace function public.search_public_advertisers(
  p_category_id bigint default null,p_state_id bigint default null,p_city_id bigint default null,
  p_query text default null,p_attribute_filters jsonb default '{}'::jsonb,
  p_service_slugs text[] default '{}'::text[],p_age_min integer default null,p_age_max integer default null,
  p_price_min numeric default null,p_price_max numeric default null,p_duration_minutes integer default null,
  p_sort text default 'recent',p_limit integer default 48,p_offset integer default 0
)
returns table(
  id uuid,slug text,title text,display_name text,summary text,city_id bigint,state_id bigint,
  category_id bigint,verification_status text,pricing jsonb,created_at timestamptz,
  city_name text,state_uf text,total_count bigint
)
language sql security invoker set search_path='' stable
as $$
  select * from private.search_public_advertisers(
    p_category_id,p_state_id,p_city_id,p_query,p_attribute_filters,p_service_slugs,
    p_age_min,p_age_max,p_price_min,p_price_max,p_duration_minutes,p_sort,p_limit,p_offset
  );
$$;

revoke execute on function public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,text,integer,integer) from public;
grant execute on function public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,text,integer,integer) to anon, authenticated;
