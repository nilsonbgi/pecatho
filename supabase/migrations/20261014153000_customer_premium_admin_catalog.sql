-- Admin controls for the customer Premium catalog. Prices and benefits are explicitly configured by Pecatho admins.
drop policy if exists pecatho_premium_admin_plans_select on public.pecatho_customer_premium_plans;
create policy pecatho_premium_admin_plans_select on public.pecatho_customer_premium_plans
  for select to authenticated using (
    exists(select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role in ('super_admin','admin'))
  );

create or replace function public.admin_save_pecatho_customer_premium_plan(
  p_plan_id uuid,
  p_plan_key text,
  p_name text,
  p_description text,
  p_price numeric,
  p_duration_days integer,
  p_benefits jsonb,
  p_active boolean
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_key text := lower(trim(coalesce(p_plan_key,'')));
  v_name text := trim(coalesce(p_name,''));
  v_benefits jsonb := coalesce(p_benefits,'[]'::jsonb);
begin
  if v_user is null or not exists(
    select 1 from public.user_roles ur where ur.user_id=v_user and ur.role in ('super_admin','admin')
  ) then raise exception 'ADMIN_REQUIRED'; end if;
  if v_key !~ '^[a-z0-9][a-z0-9_-]{1,49}$' then raise exception 'INVALID_PLAN_KEY'; end if;
  if char_length(v_name) not between 3 and 100 then raise exception 'INVALID_PLAN_NAME'; end if;
  if p_price is null or p_price <= 0 or p_price > 10000 then raise exception 'INVALID_PLAN_PRICE'; end if;
  if p_duration_days is null or p_duration_days < 1 or p_duration_days > 365 then raise exception 'INVALID_PLAN_DURATION'; end if;
  if jsonb_typeof(v_benefits) <> 'array' or jsonb_array_length(v_benefits) > 20 then raise exception 'INVALID_PLAN_BENEFITS'; end if;
  if exists(select 1 from jsonb_array_elements(v_benefits) as item(value) where jsonb_typeof(item.value) <> 'string' or char_length(trim(item.value #>> '{}')) not between 1 and 240) then
    raise exception 'INVALID_PLAN_BENEFIT_ITEM';
  end if;

  if p_plan_id is null then
    insert into public.pecatho_customer_premium_plans(plan_key,name,description,price,currency,duration_days,benefits,active,updated_at)
    values(v_key,v_name,nullif(trim(coalesce(p_description,'')),''),round(p_price,2),'BRL',p_duration_days,v_benefits,coalesce(p_active,false),now())
    returning * into v_plan;
  else
    select * into v_plan from public.pecatho_customer_premium_plans where id=p_plan_id for update;
    if not found then raise exception 'PREMIUM_PLAN_NOT_FOUND'; end if;
    update public.pecatho_customer_premium_plans set
      plan_key=v_key,name=v_name,description=nullif(trim(coalesce(p_description,'')),''),
      price=round(p_price,2),duration_days=p_duration_days,benefits=v_benefits,
      active=coalesce(p_active,false),updated_at=now()
    where id=p_plan_id returning * into v_plan;
  end if;

  return jsonb_build_object('id',v_plan.id,'plan_key',v_plan.plan_key,'name',v_plan.name,
    'price',v_plan.price,'duration_days',v_plan.duration_days,'active',v_plan.active);
end;
$function$;

revoke all on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,jsonb,boolean) from public, anon;
grant execute on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,jsonb,boolean) to authenticated;
