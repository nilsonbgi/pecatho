create or replace function public.settle_digital_content_checkout(
  p_order_id uuid,p_provider text,p_provider_payment_id text,p_payment_status payment_status,
  p_payment_method text default null,p_provider_fee numeric default 0
) returns jsonb language plpgsql security definer set search_path to pg_catalog, public as $$
declare
 v_order public.orders%rowtype; v_payment public.payments%rowtype; v_meta jsonb;
 v_product public.digital_content_products%rowtype; v_sale public.digital_content_sales%rowtype;
 v_rule public.fans_fee_rules%rowtype; v_platform_fee numeric:=0;
 v_provider_fee numeric:=greatest(coalesce(p_provider_fee,0),0); v_owner_amount numeric:=0; v_balance numeric:=0;
begin
 if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null then raise exception 'invalid settlement request'; end if;
 if p_provider_fee<0 then raise exception 'invalid provider fee'; end if;
 select * into v_order from public.orders where id=p_order_id for update; if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update; if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
 v_meta:=coalesce(v_order.metadata,'{}'::jsonb);
 if coalesce(v_meta->>'product_type',v_meta->>'kind')<>'digital_content' then raise exception 'INVALID_DIGITAL_CONTENT_ORDER'; end if;
 select * into v_product from public.digital_content_products where id=(v_meta->>'product_id')::uuid for update; if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
 select * into v_sale from public.digital_content_sales where order_id=v_order.id for update; if not found then raise exception 'SALE_NOT_FOUND'; end if;
 if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then raise exception 'INVALID_PAYMENT_STATE_TRANSITION'; end if;
 if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id); end if;
 if p_payment_status='paid' then
   select * into v_rule from public.fans_fee_rules where active=true and effective_from<=now() and (effective_until is null or effective_until>now()) order by effective_from desc limit 1;
   v_platform_fee:=least(v_order.total,round((v_order.total*coalesce(v_rule.platform_percent,0)/100)+coalesce(v_rule.fixed_fee,0),2));
   v_owner_amount:=greatest(round(v_order.total-v_provider_fee-v_platform_fee,2),0);
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
   update public.orders set status='paid',updated_at=now() where id=v_order.id and status in ('awaiting_payment','paid');
   update public.digital_content_sales set status='paid',platform_fee=v_platform_fee,owner_amount=v_owner_amount,provider=p_provider,provider_reference=p_provider_payment_id,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_sale.id;
   insert into public.ledger_entries(user_id,order_id,payment_id,entry_type,amount,currency,balance_after,description,idempotency_key,metadata)
   select v_product.owner_user_id,v_order.id,v_payment.id,'credit'::ledger_entry_type,v_owner_amount,v_order.currency,
     coalesce(sum(case when entry_type in ('credit','adjustment') then amount else -amount end),0)+v_owner_amount,
     'Venda de conteúdo digital','digital-content-sale:'||v_sale.id::text,
     jsonb_build_object('source','pecatho','kind','digital_content','product_id',v_product.id,'sale_id',v_sale.id,'gross_amount',v_order.total,'platform_fee',v_platform_fee,'provider_fee',v_provider_fee,'owner_amount',v_owner_amount)
   from public.ledger_entries where user_id=v_product.owner_user_id on conflict(idempotency_key) do nothing;
   select coalesce(sum(case when entry_type in ('credit','adjustment') then amount else -amount end),0) into v_balance from public.ledger_entries where user_id=v_product.owner_user_id;
   return jsonb_build_object('ok',true,'status','paid','sale_id',v_sale.id,'owner_amount',v_owner_amount,'platform_fee',v_platform_fee,'provider_fee',v_provider_fee,'balance',v_balance);
 end if;
 if p_payment_status in ('refunded','chargeback') then
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,updated_at=now() where id=v_payment.id;
   update public.orders set status='refunded',updated_at=now() where id=v_order.id;
   update public.digital_content_sales set status=p_payment_status,updated_at=now() where id=v_sale.id;
   v_owner_amount:=coalesce(v_sale.owner_amount,0);
   insert into public.ledger_entries(user_id,order_id,payment_id,entry_type,amount,currency,balance_after,description,idempotency_key,metadata)
   select v_product.owner_user_id,v_order.id,v_payment.id,case when p_payment_status='chargeback' then 'chargeback'::ledger_entry_type else 'refund'::ledger_entry_type end,v_owner_amount,v_order.currency,
     coalesce(sum(case when entry_type in ('credit','adjustment') then amount else -amount end),0)-v_owner_amount,
     case when p_payment_status='chargeback' then 'Chargeback de conteúdo digital' else 'Estorno de conteúdo digital' end,
     'digital-content-reversal:'||v_sale.id::text||':'||p_payment_status,
     jsonb_build_object('source','pecatho','kind','digital_content','product_id',v_product.id,'sale_id',v_sale.id,'owner_amount_reversed',v_owner_amount,'status',p_payment_status)
   from public.ledger_entries where user_id=v_product.owner_user_id on conflict(idempotency_key) do nothing;
   select coalesce(sum(case when entry_type in ('credit','adjustment') then amount else -amount end),0) into v_balance from public.ledger_entries where user_id=v_product.owner_user_id;
   return jsonb_build_object('ok',true,'status',p_payment_status,'sale_id',v_sale.id,'owner_amount_reversed',v_owner_amount,'balance',v_balance);
 end if;
 update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=coalesce(p_payment_method,payment_method),updated_at=now() where id=v_payment.id;
 if p_payment_status in ('failed','cancelled') then
   update public.orders set status=p_payment_status,updated_at=now() where id=v_order.id and status='awaiting_payment';
   update public.digital_content_sales set status=p_payment_status,updated_at=now() where id=v_sale.id and status='pending';
 end if;
 return jsonb_build_object('ok',true,'status',p_payment_status,'sale_id',v_sale.id);
end; $$;