-- Keep gift pricing aligned across the database and the creator boost gift flow.
alter table public.pecatho_gifts drop constraint if exists pecatho_gifts_amount_check;
alter table public.pecatho_gifts add constraint pecatho_gifts_amount_check check (amount >= 5 and amount <= 10000);

create or replace function public.create_pecatho_gift_checkout_intent(p_recipient_type text, p_recipient_id uuid, p_amount numeric, p_message text default null)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public'
as $function$
declare
  v_user uuid := auth.uid();
  v_recipient_user_id uuid;
  v_recipient_name text;
  v_order uuid;
  v_order_number text;
  v_gift uuid;
  v_amount numeric(12,2);
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.profiles where id=v_user and account_type in ('customer','both')) then raise exception 'CUSTOMER_ACCOUNT_REQUIRED'; end if;
  v_amount := round(coalesce(p_amount,0),2);
  if v_amount < 5 or v_amount > 10000 then raise exception 'INVALID_GIFT_AMOUNT'; end if;
  if p_recipient_type = 'advertiser' then
    select ap.user_id, coalesce(ap.display_name, ap.title, 'Anunciante') into v_recipient_user_id, v_recipient_name
    from public.advertiser_profiles ap where ap.id=p_recipient_id and ap.status='published';
  elsif p_recipient_type = 'creator' then
    select fc.user_id, coalesce(fc.display_name, 'Vendedor de conteúdo') into v_recipient_user_id, v_recipient_name
    from public.fans_creators fc where fc.id=p_recipient_id and fc.status='active';
  else raise exception 'INVALID_RECIPIENT_TYPE'; end if;
  if v_recipient_user_id is null then raise exception 'RECIPIENT_NOT_FOUND'; end if;
  if v_recipient_user_id = v_user then raise exception 'SELF_GIFT_NOT_ALLOWED'; end if;
  v_order_number := 'PEC-GIFT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  insert into public.orders(order_number,user_id,status,subtotal,discount,fee,total,currency,metadata)
  values (v_order_number,v_user,'awaiting_payment',v_amount,0,0,v_amount,'BRL',
    jsonb_build_object('source','pecatho','kind','gift','product_type','gift','recipient_type',p_recipient_type,
      'recipient_id',p_recipient_id,'recipient_user_id',v_recipient_user_id,'title','Presente Pecatho','recipient_name',v_recipient_name))
  returning id into v_order;
  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',v_amount,'BRL','pending','pending','{}'::jsonb);
  insert into public.pecatho_gifts(buyer_user_id,recipient_user_id,recipient_type,recipient_id,order_id,amount,currency,message,status)
  values(v_user,v_recipient_user_id,p_recipient_type,p_recipient_id,v_order,v_amount,'BRL',
    nullif(left(trim(coalesce(p_message,'')),300),''),'pending')
  returning id into v_gift;
  return jsonb_build_object('gift_id',v_gift,'order_id',v_order,'order_number',v_order_number,'amount',v_amount,'currency','BRL',
    'recipient_type',p_recipient_type,'recipient_id',p_recipient_id,'recipient_name',v_recipient_name,'status','pending');
end;
$function$;

insert into public.fans_boost_plans(name,price,duration_hours,multiplier,status)
select v.name, v.price, v.duration_hours, v.multiplier, 'active'
from (values ('Impulso de Presente — 24 horas',5::numeric,24,1.10::numeric),
             ('Impulso de Presente — 3 dias',10::numeric,72,1.25::numeric),
             ('Impulso de Presente — 7 dias',20::numeric,168,1.50::numeric)) as v(name,price,duration_hours,multiplier)
where not exists (select 1 from public.fans_boost_plans p where p.price=v.price and p.duration_hours=v.duration_hours);
