-- Annual Premium pricing represents 12 monthly billing units while access lasts 365 days.
-- Quarterly and semiannual pricing continue to use 3 and 6 monthly units respectively.
create or replace function public.create_pecatho_customer_premium_checkout(p_plan_id uuid,p_creator_id uuid default null,p_duration_days integer default 30)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $function$
declare v_user uuid:=auth.uid(); v_plan public.pecatho_customer_premium_plans%rowtype; v_creator public.fans_creators%rowtype;
 v_discount numeric:=0; v_billing_months numeric; v_gross numeric(12,2); v_amount numeric(12,2); v_order uuid; v_order_number text; v_subscription uuid;
begin
 if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
 if not exists(select 1 from public.profiles where id=v_user and account_type='customer') then raise exception 'CUSTOMER_ACCOUNT_REQUIRED'; end if;
 if p_duration_days not in (30,90,180,365) then raise exception 'PREMIUM_DURATION_INVALID'; end if;
 select * into v_plan from public.pecatho_customer_premium_plans where id=p_plan_id and active=true and audience='customer' and duration_days=30 for share;
 if not found then raise exception 'PREMIUM_PLAN_UNAVAILABLE'; end if;
 if p_duration_days>30 then
  if not (v_plan.billing_options ? p_duration_days::text) then raise exception 'PREMIUM_BILLING_TERM_NOT_CONFIGURED'; end if;
  v_discount:=nullif(v_plan.billing_options->p_duration_days::text->>'discount_percent','')::numeric;
  if v_discount is null or v_discount<=0 or v_discount>80 then raise exception 'PREMIUM_BILLING_TERM_NOT_CONFIGURED'; end if;
 end if;
 v_billing_months:=case p_duration_days when 30 then 1 when 90 then 3 when 180 then 6 when 365 then 12 end;
 v_gross:=round(v_plan.price*v_billing_months,2); v_amount:=round(v_gross*(1-v_discount/100),2);
 if v_amount<=0 then raise exception 'PREMIUM_PRICE_INVALID'; end if;
 if p_creator_id is not null then select * into v_creator from public.fans_creators where id=p_creator_id and status='active' and user_id<>v_user; if not found then raise exception 'PREMIUM_ATTRIBUTION_CREATOR_INVALID'; end if; end if;
 v_order_number:='PEC-PREM-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
 insert into public.orders(order_number,user_id,status,subtotal,discount,fee,total,currency,metadata)
 values(v_order_number,v_user,'awaiting_payment',v_gross,v_gross-v_amount,0,v_amount,'BRL',jsonb_build_object(
  'source','pecatho','kind','customer_premium','product_type','premium_subscription','product_id',v_plan.id,
  'plan_key',v_plan.plan_key,'title',v_plan.name,'duration_days',p_duration_days,'discount_percent',v_discount,
  'monthly_base_price',v_plan.price,'billing_months',v_billing_months,'gross_amount',v_gross,'final_amount',v_amount,
  'attribution_source',case when p_creator_id is not null then 'creator_profile' else null end,'attributed_creator_id',p_creator_id))
 returning id into v_order;
 insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference) values(v_order,v_user,'pending',v_amount,'BRL','pending','pending','{}'::jsonb);
 insert into public.pecatho_customer_premium_subscriptions(user_id,plan_id,order_id,paid_amount,currency,status,attributed_creator_id,duration_days)
 values(v_user,v_plan.id,v_order,v_amount,'BRL','pending',p_creator_id,p_duration_days) returning id into v_subscription;
 return jsonb_build_object('subscription_id',v_subscription,'order_id',v_order,'order_number',v_order_number,'plan_id',v_plan.id,'amount',v_amount,'currency','BRL','status','pending','duration_days',p_duration_days,'billing_months',v_billing_months,'discount_percent',v_discount,'attributed_creator_id',p_creator_id);
end;$function$;
revoke all on function public.create_pecatho_customer_premium_checkout(uuid,uuid,integer) from public,anon;
grant execute on function public.create_pecatho_customer_premium_checkout(uuid,uuid,integer) to authenticated,service_role;
