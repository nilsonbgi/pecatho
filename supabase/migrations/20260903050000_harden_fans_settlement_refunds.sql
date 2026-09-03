-- Harden Fans settlement against provider-id reuse and make refunds revoke entitlements.
drop function if exists public.settle_fans_checkout(uuid,text,text,payment_status,text);

create unique index if not exists payments_provider_payment_id_unique_idx
  on public.payments(provider, provider_payment_id)
  where provider_payment_id is not null;

create or replace function public.settle_fans_checkout(
  p_order_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_payment_status payment_status,
  p_payment_method text default null,
  p_provider_fee numeric default 0
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
 v_order public.orders%rowtype;
 v_payment public.payments%rowtype;
 v_existing public.payments%rowtype;
 v_meta jsonb;
 v_product_type text;
 v_product_id uuid;
 v_creator_id uuid;
 v_amount numeric;
 v_provider_fee numeric := greatest(coalesce(p_provider_fee,0),0);
 v_platform_fee numeric := 0;
 v_creator_amount numeric;
 v_rule public.fans_fee_rules%rowtype;
 v_purchase_id uuid;
 v_subscription_id uuid;
 v_previous_purchase public.fans_purchases%rowtype;
 v_previous_subscription public.fans_subscriptions%rowtype;
begin
 if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null then
   raise exception 'invalid settlement request';
 end if;
 if p_provider_fee < 0 then raise exception 'invalid provider fee'; end if;

 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'order not found'; end if;

 select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
 if not found then raise exception 'payment not found'; end if;

 select * into v_existing
 from public.payments
 where provider=p_provider and provider_payment_id=p_provider_payment_id and order_id<>p_order_id
 order by created_at desc limit 1;
 if found then raise exception 'provider payment already linked to another order'; end if;

 if v_payment.status='paid' then
   return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id);
 end if;

 v_meta:=v_order.metadata;
 v_product_type:=v_meta->>'product_type';
 v_product_id:=nullif(v_meta->>'product_id','')::uuid;
 v_creator_id:=nullif(v_meta->>'creator_id','')::uuid;
 v_amount:=v_order.total;

 if v_product_type not in ('post','subscription') or v_product_id is null or v_creator_id is null then
   raise exception 'invalid Fans order metadata';
 end if;

 if p_payment_status='paid' then
   select * into v_rule from public.fans_fee_rules
    where active=true and effective_from <= pg_catalog.now()
      and (effective_until is null or effective_until > pg_catalog.now())
    order by effective_from desc limit 1;

   v_platform_fee := round((v_amount * coalesce(v_rule.platform_percent,0) / 100) + coalesce(v_rule.fixed_fee,0),2);
   v_platform_fee := least(v_platform_fee,v_amount);
   v_creator_amount := greatest(round(v_amount-v_provider_fee-v_platform_fee,2),0);

   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',
     payment_method=p_payment_method,paid_at=coalesce(paid_at,pg_catalog.now()),updated_at=pg_catalog.now()
   where id=v_payment.id;
   update public.orders set status='paid',updated_at=pg_catalog.now() where id=v_order.id;

   if v_product_type='post' then
     insert into public.fans_purchases
       (buyer_user_id,creator_id,post_id,subscription_id,amount,platform_fee,creator_amount,currency,status,provider,provider_reference,paid_at)
     values
       (v_order.user_id,v_creator_id,v_product_id,null,v_amount,v_platform_fee,v_creator_amount,v_order.currency,'paid',p_provider,p_provider_payment_id,pg_catalog.now())
     on conflict do nothing returning id into v_purchase_id;
   else
     insert into public.fans_subscriptions
       (creator_id,subscriber_user_id,plan_id,status,starts_at,ends_at,auto_renew)
     select v_creator_id,v_order.user_id,v_product_id,'active',pg_catalog.now(),
       pg_catalog.now()+(duration_days*interval '1 day'),false
     from public.fans_plans where id=v_product_id and status='active'
     on conflict do nothing returning id into v_subscription_id;

     if v_subscription_id is not null then
       insert into public.fans_purchases
         (buyer_user_id,creator_id,post_id,subscription_id,amount,platform_fee,creator_amount,currency,status,provider,provider_reference,paid_at)
       values
         (v_order.user_id,v_creator_id,null,v_subscription_id,v_amount,v_platform_fee,v_creator_amount,v_order.currency,'paid',p_provider,p_provider_payment_id,pg_catalog.now())
       on conflict do nothing returning id into v_purchase_id;
     end if;
   end if;

   insert into public.fans_financial_ledger(order_id,payment_id,purchase_id,subscription_id,creator_id,entry_type,direction,amount,currency,status,provider,provider_reference,metadata)
   values
   (v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,'sale_gross','credit',v_amount,v_order.currency,'posted',p_provider,p_provider_payment_id,jsonb_build_object('fee_rule_id',v_rule.id)),
   (v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,'provider_fee','debit',v_provider_fee,v_order.currency,'posted',p_provider,p_provider_payment_id,'{}'::jsonb),
   (v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,'platform_fee','credit',v_platform_fee,v_order.currency,'posted',p_provider,p_provider_payment_id,jsonb_build_object('fee_rule_id',v_rule.id)),
   (v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,'creator_credit','credit',v_creator_amount,v_order.currency,'posted',p_provider,p_provider_payment_id,jsonb_build_object('fee_rule_id',v_rule.id));

   return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,'purchase_id',v_purchase_id,'subscription_id',v_subscription_id,'gross_amount',v_amount,'provider_fee',v_provider_fee,'platform_fee',v_platform_fee,'creator_amount',v_creator_amount);
 end if;

 if p_payment_status in ('refunded','chargeback') then
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=p_payment_method,updated_at=pg_catalog.now() where id=v_payment.id;
   update public.orders set status='refunded',updated_at=pg_catalog.now() where id=v_order.id;

   select * into v_previous_purchase from public.fans_purchases
    where provider=p_provider and provider_reference=p_provider_payment_id and status='paid'
    order by created_at desc limit 1 for update;
   if found then
     update public.fans_purchases set status='refunded',updated_at=pg_catalog.now() where id=v_previous_purchase.id;
     if v_previous_purchase.subscription_id is not null then
       update public.fans_subscriptions set status='refunded',updated_at=pg_catalog.now()
        where id=v_previous_purchase.subscription_id;
     end if;
     insert into public.fans_financial_ledger(order_id,payment_id,purchase_id,subscription_id,creator_id,entry_type,direction,amount,currency,status,provider,provider_reference,metadata)
     values
       (v_order.id,v_payment.id,v_previous_purchase.id,v_previous_purchase.subscription_id,v_previous_purchase.creator_id,'refund_gross','debit',v_previous_purchase.amount,v_previous_purchase.currency,'posted',p_provider,p_provider_payment_id,jsonb_build_object('reason',p_payment_status)),
       (v_order.id,v_payment.id,v_previous_purchase.id,v_previous_purchase.subscription_id,v_previous_purchase.creator_id,'refund_platform_fee','debit',v_previous_purchase.platform_fee,v_previous_purchase.currency,'posted',p_provider,p_provider_payment_id,jsonb_build_object('reason',p_payment_status)),
       (v_order.id,v_payment.id,v_previous_purchase.id,v_previous_purchase.subscription_id,v_previous_purchase.creator_id,'refund_creator_credit','debit',v_previous_purchase.creator_amount,v_previous_purchase.currency,'posted',p_provider,p_provider_payment_id,jsonb_build_object('reason',p_payment_status));
   end if;
   return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id,'refunded_purchase_id',v_previous_purchase.id);
 end if;

 if p_payment_status='failed' then
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='failed',payment_method=p_payment_method,updated_at=pg_catalog.now() where id=v_payment.id;
   update public.orders set status='failed',updated_at=pg_catalog.now() where id=v_order.id;
   return jsonb_build_object('ok',true,'idempotent',false,'status','failed','order_id',p_order_id);
 end if;

 if p_payment_status='cancelled' then
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='cancelled',payment_method=p_payment_method,updated_at=pg_catalog.now() where id=v_payment.id;
   update public.orders set status='cancelled',updated_at=pg_catalog.now() where id=v_order.id;
   return jsonb_build_object('ok',true,'idempotent',false,'status','cancelled','order_id',p_order_id);
 end if;

 update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=p_payment_method,updated_at=pg_catalog.now() where id=v_payment.id;
 return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id);
end;
$function$;

revoke all on function public.settle_fans_checkout(uuid,text,text,payment_status,text,numeric) from public, anon, authenticated;
