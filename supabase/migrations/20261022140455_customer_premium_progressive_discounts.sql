-- Customer Premium plans support an editable progressive discount per duration.
-- The final price remains the amount charged by the existing checkout function.
alter table public.pecatho_customer_premium_plans
  add column if not exists discount_percent numeric(5,2) not null default 0;

alter table public.pecatho_customer_premium_plans
  drop constraint if exists pecatho_customer_premium_plans_discount_percent_check;
alter table public.pecatho_customer_premium_plans
  add constraint pecatho_customer_premium_plans_discount_percent_check
  check (discount_percent between 0 and 80);

-- Preserve the existing RPC signature for older clients, and expose an extended overload for the admin editor.
create or replace function public.admin_save_pecatho_customer_premium_plan(
  p_plan_id uuid,
  p_plan_key text,
  p_name text,
  p_description text,
  p_price numeric,
  p_duration_days integer,
  p_discount_percent numeric,
  p_benefits jsonb,
  p_active boolean,
  p_audience text,
  p_feature_flags jsonb,
  p_card_style text,
  p_badge_label text,
  p_sort_order integer
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_user uuid := auth.uid();
  v_result jsonb;
  v_base_price numeric;
  v_expected_price numeric;
  v_lower_discount numeric;
  v_upper_discount numeric;
  v_existing public.pecatho_customer_premium_plans%rowtype;
begin
  if v_user is null or not exists (
    select 1 from public.user_roles ur where ur.user_id=v_user and ur.role in ('super_admin','admin')
  ) then raise exception 'ADMIN_REQUIRED'; end if;
  if p_discount_percent is null or p_discount_percent < 0 or p_discount_percent > 80 then
    raise exception 'INVALID_PLAN_DISCOUNT';
  end if;
  if p_audience <> 'customer' and p_discount_percent <> 0 then
    raise exception 'PROFESSIONAL_PLAN_DISCOUNT_NOT_SUPPORTED';
  end if;
  if p_audience = 'customer' and p_duration_days = 30 and p_discount_percent <> 0 then
    raise exception 'MONTHLY_PLAN_DISCOUNT_MUST_BE_ZERO';
  end if;

  if p_plan_id is not null then
    select * into v_existing from public.pecatho_customer_premium_plans where id=p_plan_id;
  end if;

  if p_audience = 'customer' and p_duration_days in (90,180,365) then
    if p_discount_percent <= 0 then
      raise exception 'PROGRESSIVE_DISCOUNT_REQUIRED';
    end if;

    select max(discount_percent) into v_lower_discount
    from public.pecatho_customer_premium_plans
    where audience='customer' and duration_days < p_duration_days
      and (p_plan_id is null or id<>p_plan_id);
    select min(discount_percent) into v_upper_discount
    from public.pecatho_customer_premium_plans
    where audience='customer' and duration_days > p_duration_days
      and (p_plan_id is null or id<>p_plan_id);

    if v_lower_discount is not null and p_discount_percent <= v_lower_discount then
      raise exception 'PROGRESSIVE_DISCOUNT_MUST_INCREASE';
    end if;
    if v_upper_discount is not null and p_discount_percent >= v_upper_discount then
      raise exception 'PROGRESSIVE_DISCOUNT_MUST_INCREASE';
    end if;

    select min(price) into v_base_price
    from public.pecatho_customer_premium_plans
    where audience='customer' and duration_days=30 and (p_plan_id is null or id<>p_plan_id);

    if v_base_price is null or v_base_price <= 0 then
      raise exception 'CUSTOMER_MONTHLY_BASE_PLAN_REQUIRED';
    end if;

    v_expected_price := round(v_base_price * (p_duration_days::numeric / 30) * (1 - p_discount_percent / 100), 2);
    if p_price is null or abs(p_price - v_expected_price) > 0.02 then
      raise exception 'CUSTOMER_DISCOUNT_PRICE_MISMATCH'
        using detail = format('Preço esperado para %s dias com desconto de %s%%: %s', p_duration_days, p_discount_percent, v_expected_price);
    end if;
  end if;

  v_result := public.admin_save_pecatho_customer_premium_plan(
    p_plan_id,p_plan_key,p_name,p_description,p_price,p_duration_days,p_benefits,p_active,
    p_audience,p_feature_flags,p_card_style,p_badge_label,p_sort_order
  );

  update public.pecatho_customer_premium_plans
  set discount_percent = p_discount_percent, updated_at=now()
  where id = (v_result->>'id')::uuid;

  return v_result || jsonb_build_object('discount_percent',p_discount_percent);
end;
$function$;

revoke all on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,numeric,jsonb,boolean,text,jsonb,text,text,integer) from public, anon;
grant execute on function public.admin_save_pecatho_customer_premium_plan(uuid,text,text,text,numeric,integer,numeric,jsonb,boolean,text,jsonb,text,text,integer) to authenticated;
