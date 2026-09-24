-- Ensure digital-content orders enter the provider checkout state.
create or replace function public.create_digital_content_checkout_intent(p_product_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_user uuid:=auth.uid(); v_product public.digital_content_products%rowtype; v_order uuid; v_order_number text; v_payment uuid; v_sale uuid;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into v_product from public.digital_content_products where id=p_product_id and status='published';
 if not found then raise exception 'PRODUCT_NOT_AVAILABLE'; end if;
 if v_product.owner_user_id=v_user then raise exception 'SELF_PURCHASE'; end if;
 select id into v_sale from public.digital_content_sales where product_id=v_product.id and buyer_user_id=v_user and status in ('pending','paid') order by created_at desc limit 1;
 if v_sale is not null and exists(select 1 from public.digital_content_sales where id=v_sale and status='paid') then return jsonb_build_object('already_owned',true,'sale_id',v_sale); end if;
 v_order_number:='PEC-CONT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
 insert into public.orders(order_number,user_id,subtotal,discount,fee,total,currency,status,metadata)
 values(v_order_number,v_user,v_product.price,0,0,v_product.price,v_product.currency,'awaiting_payment',jsonb_build_object('source','pecatho','kind','digital_content','product_type','digital_content','product_id',v_product.id,'owner_type',v_product.owner_type,'owner_id',v_product.owner_id,'owner_user_id',v_product.owner_user_id,'title',v_product.title)) returning id into v_order;
 insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
 values(v_order,v_user,'pending',v_product.price,v_product.currency,'pending','pending','{}'::jsonb) returning id into v_payment;
 insert into public.digital_content_sales(product_id,buyer_user_id,owner_type,owner_id,owner_user_id,order_id,payment_id,amount,platform_fee,owner_amount,currency,status)
 values(v_product.id,v_user,v_product.owner_type,v_product.owner_id,v_product.owner_user_id,v_order,v_payment,v_product.price,0,v_product.price,v_product.currency,'pending') returning id into v_sale;
 return jsonb_build_object('already_owned',false,'sale_id',v_sale,'order_id',v_order,'order_number',v_order_number,'amount',v_product.price,'currency',v_product.currency);
end; $$;