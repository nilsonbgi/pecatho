CREATE OR REPLACE FUNCTION public.settle_fans_live_extension_checkout(
  p_order_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_payment_status payment_status,
  p_payment_method text DEFAULT NULL::text,
  p_provider_fee numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
 v_order public.orders%rowtype;
 v_payment public.payments%rowtype;
 v_req public.fans_live_extension_requests%rowtype;
 v_session public.fans_live_sessions%rowtype;
 v_rule public.fans_fee_rules%rowtype;
 v_amount numeric;
 v_platform_fee numeric:=0;
 v_creator_amount numeric;
 v_provider_fee numeric:=greatest(coalesce(p_provider_fee,0),0);
 v_minutes integer;
begin
 if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null then raise exception 'invalid settlement request'; end if;
 if p_provider_fee<0 then raise exception 'invalid provider fee'; end if;
 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'order not found'; end if;
 if coalesce(v_order.metadata->>'product_type','')<>'live_extension' then raise exception 'NOT_LIVE_EXTENSION_ORDER'; end if;
 select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
 if not found then raise exception 'payment not found'; end if;
 select * into v_req from public.fans_live_extension_requests where order_id=p_order_id for update;
 if not found then raise exception 'LIVE_EXTENSION_NOT_FOUND'; end if;
 select * into v_session from public.fans_live_sessions where id=v_req.session_id for update;
 if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;

 if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then raise exception 'INVALID_PAYMENT_STATE_TRANSITION'; end if;
 if v_payment.status='paid' and p_payment_status not in('refunded','chargeback') then
   return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,'extension_request_id',v_req.id,'session_id',v_req.session_id);
 end if;

 v_amount:=v_order.total;
 v_minutes:=v_req.minutes;

 if p_payment_status='paid' then
   select * into v_rule from public.fans_fee_rules where active=true and effective_from<=now() and(effective_until is null or effective_until>now()) order by effective_from desc limit 1;
   v_platform_fee:=least(round((v_amount*coalesce(v_rule.platform_percent,0)/100)+coalesce(v_rule.fixed_fee,0),2),v_amount);
   v_creator_amount:=greatest(round(v_amount-v_provider_fee-v_platform_fee,2),0);
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
   update public.orders set status='paid',updated_at=now() where id=v_order.id;
   update public.fans_live_extension_requests set status='paid',payment_id=v_payment.id,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_req.id and status='pending_payment';
   if not found and not exists(select 1 from public.fans_live_extension_requests where id=v_req.id and status='paid') then raise exception 'LIVE_EXTENSION_NOT_PENDING'; end if;
   update public.fans_live_sessions set duration_minutes=duration_minutes+v_minutes,last_activity_at=now(),updated_at=now() where id=v_session.id and status='active';
   insert into public.fans_financial_ledger(order_id,payment_id,purchase_id,subscription_id,creator_id,entry_type,direction,amount,currency,status,provider,provider_reference,metadata)
   values
   (v_order.id,v_payment.id,null,null,v_req.creator_id,'sale_gross','credit',v_amount,v_order.currency,'posted',p_provider,p_provider_payment_id,jsonb_build_object('product_type','live_extension','extension_request_id',v_req.id,'session_id',v_req.session_id,'minutes',v_minutes)),
   (v_order.id,v_payment.id,null,null,v_req.creator_id,'provider_fee','debit',v_provider_fee,v_order.currency,'posted',p_provider,p_provider_payment_id,jsonb_build_object('product_type','live_extension')),
   (v_order.id,v_payment.id,null,null,v_req.creator_id,'platform_fee','debit',v_platform_fee,v_order.currency,'posted',p_provider,p_provider_payment_id,jsonb_build_object('product_type','live_extension','fee_rule_id',v_rule.id));
   perform public.enqueue_fans_transaction_notification(v_req.buyer_user_id,'fans_live_extension_paid','Extensão confirmada','A extensão de '||v_minutes::text||' minutos foi paga e o tempo adicional já está liberado.',jsonb_build_object('session_id',v_req.session_id,'extension_request_id',v_req.id,'minutes',v_minutes,'amount',v_amount,'order_id',v_order.id,'route','/fans/videochamadas/sala/'||v_req.session_id::text),'fans_live_extension:'||v_req.id::text||':paid:buyer');
   perform public.enqueue_fans_transaction_notification((select user_id from public.fans_creators where id=v_req.creator_id),'fans_live_extension_paid','Extensão paga','O comprador pagou a extensão de '||v_minutes::text||' minutos. O tempo adicional já está liberado.',jsonb_build_object('session_id',v_req.session_id,'extension_request_id',v_req.id,'minutes',v_minutes,'amount',v_amount,'order_id',v_order.id,'route','/fans/videochamadas/sala/'||v_req.session_id::text),'fans_live_extension:'||v_req.id::text||':paid:creator');
   return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,'extension_request_id',v_req.id,'session_id',v_req.session_id,'minutes',v_minutes,'gross_amount',v_amount,'provider_fee',v_provider_fee,'platform_fee',v_platform_fee,'creator_amount',v_creator_amount);
 end if;

 if p_payment_status in('refunded','chargeback') then
   if v_payment.status not in ('refunded','chargeback') then
     update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
     update public.orders set status='refunded',updated_at=now() where id=v_order.id;
   end if;
   update public.fans_live_extension_requests set status='refunded',updated_at=now() where id=v_req.id and status='paid';
   if found and v_session.status in('scheduled','active') then
     update public.fans_live_sessions set duration_minutes=greatest(duration_minutes-v_minutes,1),updated_at=now() where id=v_session.id;
   end if;
   select greatest(round(coalesce(sum(
     case
       when fl.entry_type='sale_gross' and fl.direction='credit' then fl.amount
       when fl.entry_type in ('provider_fee','platform_fee') and fl.direction='debit' then -fl.amount
       else 0
     end
   ),0),2),0)
   into v_creator_amount
   from public.fans_financial_ledger fl
   where fl.order_id=v_order.id
     and fl.creator_id=v_req.creator_id
     and fl.status='posted'
     and fl.metadata->>'extension_request_id'=v_req.id::text;
   if v_creator_amount>0 and not exists(
     select 1 from public.fans_financial_ledger fl
     where fl.order_id=v_order.id
       and fl.creator_id=v_req.creator_id
       and fl.entry_type='refund_creator_credit'
       and fl.direction='debit'
       and fl.status='posted'
       and fl.metadata->>'extension_request_id'=v_req.id::text
   ) then
     insert into public.fans_financial_ledger(order_id,payment_id,purchase_id,subscription_id,creator_id,entry_type,direction,amount,currency,status,provider,provider_reference,metadata)
     values(
       v_order.id,v_payment.id,null,null,v_req.creator_id,'refund_creator_credit','debit',v_creator_amount,v_order.currency,'posted',p_provider,p_provider_payment_id,
       jsonb_build_object('product_type','live_extension','extension_request_id',v_req.id,'session_id',v_req.session_id,'reason',p_payment_status,'creator_amount_reversed',v_creator_amount)
     );
   end if;
   return jsonb_build_object('ok',true,'idempotent',v_payment.status in ('refunded','chargeback'),'status',p_payment_status,'order_id',p_order_id,'extension_request_id',v_req.id,'session_id',v_req.session_id,'creator_amount_reversed',coalesce(v_creator_amount,0));
 end if;

 if p_payment_status='failed' then
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='failed',payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
   update public.orders set status='failed',updated_at=now() where id=v_order.id;
   update public.fans_live_extension_requests set status='expired',updated_at=now() where id=v_req.id and status='pending_payment';
   return jsonb_build_object('ok',true,'idempotent',false,'status','failed','order_id',p_order_id,'extension_request_id',v_req.id);
 end if;
 if p_payment_status='cancelled' then
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='cancelled',payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
   update public.orders set status='cancelled',updated_at=now() where id=v_order.id;
   update public.fans_live_extension_requests set status='cancelled',updated_at=now() where id=v_req.id and status='pending_payment';
   return jsonb_build_object('ok',true,'idempotent',false,'status','cancelled','order_id',p_order_id,'extension_request_id',v_req.id);
 end if;
 update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
 return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id,'extension_request_id',v_req.id);
end;
$function$;