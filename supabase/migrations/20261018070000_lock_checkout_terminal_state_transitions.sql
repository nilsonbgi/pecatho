-- Lock terminal payment states across checkout settlement functions. Preserve existing business logic and reject changes between refunded and chargeback.

CREATE OR REPLACE FUNCTION public.settle_fans_checkout(p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status, p_payment_method text DEFAULT NULL::text, p_provider_fee numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
  v_renewal boolean := false;
  v_plan_duration integer;
  v_live_session_id uuid;
  v_tip_id uuid;
begin
  if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null then
    raise exception 'invalid settlement request';
  end if;
  if p_provider_fee < 0 then raise exception 'invalid provider fee'; end if;

  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'order not found'; end if;

  select * into v_payment from public.payments
  where order_id=p_order_id order by created_at desc limit 1 for update;
  if not found then raise exception 'payment not found'; end if;

  select * into v_existing from public.payments
  where provider=p_provider and provider_payment_id=p_provider_payment_id
    and order_id<>p_order_id order by created_at desc limit 1;
  if found then raise exception 'provider payment already linked to another order'; end if;

  if v_payment.status in ('refunded','chargeback') and p_payment_status <> v_payment.status then
    raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
  end if;
  if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then
    return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id);
  end if;

  v_meta:=coalesce(v_order.metadata,'{}'::jsonb);
  v_product_type:=coalesce(v_meta->>'product_type',v_meta->>'kind');
  v_product_id:=case
    when v_product_type='post' then nullif(v_meta->>'post_id','')::uuid
    when v_product_type='subscription' then nullif(v_meta->>'plan_id','')::uuid
    when v_product_type='live_call' then nullif(v_meta->>'offer_id','')::uuid
    when v_product_type='live_tip' then nullif(v_meta->>'creator_id','')::uuid
    else null end;
  v_creator_id:=nullif(v_meta->>'creator_id','')::uuid;
  v_amount:=v_order.total;
  v_renewal:=coalesce((v_meta->>'renewal')::boolean,false);
  v_live_session_id:=nullif(v_meta->>'session_id','')::uuid;

  if v_product_type not in ('post','subscription','live_call','live_tip')
     or v_product_id is null or v_creator_id is null then
    raise exception 'invalid Fans order metadata';
  end if;

  if v_product_type='live_call' and v_live_session_id is null then
    select id into v_live_session_id from public.fans_live_sessions
    where order_id=v_order.id limit 1 for update;
  end if;

  if v_product_type='live_tip' then
    select id into v_tip_id from public.fans_tips where order_id=v_order.id limit 1 for update;
    if v_tip_id is null then raise exception 'LIVE_TIP_NOT_FOUND'; end if;
  end if;

  perform 1 from public.fans_creators where id=v_creator_id for update;
  if not found then raise exception 'creator not found'; end if;

  if p_payment_status='paid' then
    select * into v_rule from public.fans_fee_rules
    where active=true and effective_from<=now()
      and (effective_until is null or effective_until>now())
    order by effective_from desc limit 1;

    v_platform_fee:=least(
      round((v_amount*coalesce(v_rule.platform_percent,0)/100)+coalesce(v_rule.fixed_fee,0),2),
      v_amount
    );
    v_creator_amount:=greatest(round(v_amount-v_provider_fee-v_platform_fee,2),0);

    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,
      status='paid',payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now()
    where id=v_payment.id;
    update public.orders set status='paid',updated_at=now() where id=v_order.id;

    if v_product_type='post' then
      if exists(select 1 from public.fans_purchases
        where buyer_user_id=v_order.user_id and post_id=v_product_id and status='paid') then
        raise exception 'ALREADY_PURCHASED';
      end if;
      insert into public.fans_purchases(
        buyer_user_id,creator_id,post_id,subscription_id,amount,platform_fee,
        creator_amount,currency,status,provider,provider_reference,paid_at
      ) values(
        v_order.user_id,v_creator_id,v_product_id,null,v_amount,v_platform_fee,
        v_creator_amount,v_order.currency,'paid',p_provider,p_provider_payment_id,now()
      ) returning id into v_purchase_id;

    elsif v_product_type='subscription' then
      select duration_days into v_plan_duration from public.fans_plans
      where id=v_product_id and status='active';
      if v_plan_duration is null then raise exception 'PLAN_NOT_AVAILABLE'; end if;

      if v_renewal then
        select id into v_subscription_id from public.fans_subscriptions
        where creator_id=v_creator_id and subscriber_user_id=v_order.user_id
          and plan_id=v_product_id and status='active'
        order by starts_at desc limit 1 for update;
        if v_subscription_id is null then raise exception 'SUBSCRIPTION_NOT_FOUND'; end if;

        update public.fans_subscriptions set status='active',
          ends_at=greatest(coalesce(ends_at,now()),now())+(v_plan_duration*interval '1 day'),
          updated_at=now()
        where id=v_subscription_id;
      else
        select id into v_subscription_id from public.fans_subscriptions
        where creator_id=v_creator_id and subscriber_user_id=v_order.user_id
          and plan_id=v_product_id and status='active'
          and (ends_at is null or ends_at>=now())
        order by starts_at desc limit 1 for update;

        if v_subscription_id is null then
          insert into public.fans_subscriptions(
            creator_id,subscriber_user_id,plan_id,status,starts_at,ends_at,auto_renew
          ) values(
            v_creator_id,v_order.user_id,v_product_id,'active',now(),
            now()+(v_plan_duration*interval '1 day'),false
          ) returning id into v_subscription_id;
        end if;
      end if;

      insert into public.fans_purchases(
        buyer_user_id,creator_id,post_id,subscription_id,amount,platform_fee,
        creator_amount,currency,status,provider,provider_reference,paid_at
      ) values(
        v_order.user_id,v_creator_id,null,v_subscription_id,v_amount,v_platform_fee,
        v_creator_amount,v_order.currency,'paid',p_provider,p_provider_payment_id,now()
      ) returning id into v_purchase_id;

    elsif v_product_type='live_call' then
      if v_live_session_id is null then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;

      update public.fans_live_sessions set status='paid',paid_at=coalesce(paid_at,now()),
        payment_id=v_payment.id,order_id=v_order.id,updated_at=now()
      where id=v_live_session_id and buyer_user_id=v_order.user_id
        and creator_id=v_creator_id and offer_id=v_product_id and status='pending_payment';

      if not found and not exists(
        select 1 from public.fans_live_sessions
        where id=v_live_session_id and order_id=v_order.id
          and status in ('paid','scheduled','active','completed')
      ) then raise exception 'LIVE_SESSION_NOT_PENDING'; end if;

    elsif v_product_type='live_tip' then
      update public.fans_tips set platform_fee=v_platform_fee,creator_amount=v_creator_amount,
        status='paid',provider=p_provider,provider_reference=p_provider_payment_id,
        paid_at=coalesce(paid_at,now())
      where id=v_tip_id and creator_id=v_creator_id and buyer_user_id=v_order.user_id
        and amount=v_amount and status='pending';

      if not found and not exists(
        select 1 from public.fans_tips
        where id=v_tip_id and order_id=v_order.id and status='paid'
      ) then raise exception 'LIVE_TIP_NOT_PENDING'; end if;
    end if;

    insert into public.fans_financial_ledger(
      order_id,payment_id,purchase_id,subscription_id,creator_id,
      entry_type,direction,amount,currency,status,provider,provider_reference,metadata
    ) values
    (v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,
      'sale_gross','credit',v_amount,v_order.currency,'posted',p_provider,p_provider_payment_id,
      jsonb_build_object('fee_rule_id',v_rule.id,'renewal',v_renewal,
        'product_type',v_product_type,'live_session_id',v_live_session_id)),
    (v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,
      'provider_fee','debit',v_provider_fee,v_order.currency,'posted',p_provider,p_provider_payment_id,'{}'::jsonb),
    (v_order.id,v_payment.id,v_purchase_id,v_subscription_id,v_creator_id,
      'platform_fee','debit',v_platform_fee,v_order.currency,'posted',p_provider,p_provider_payment_id,
      jsonb_build_object('fee_rule_id',v_rule.id));

    return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,
      'purchase_id',v_purchase_id,'subscription_id',v_subscription_id,'live_session_id',v_live_session_id,
      'tip_id',v_tip_id,'gross_amount',v_amount,'provider_fee',v_provider_fee,
      'platform_fee',v_platform_fee,'creator_amount',v_creator_amount,'renewal',v_renewal);
  end if;

  if p_payment_status in ('refunded','chargeback') then
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,
      status=p_payment_status,payment_method=p_payment_method,updated_at=now()
    where id=v_payment.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;

    if v_product_type='live_call' then
      update public.fans_live_sessions set status='refunded',updated_at=now()
      where id=v_live_session_id and status in ('pending_payment','paid','scheduled','active');

    elsif v_product_type='live_tip' then
      update public.fans_tips set status='refunded' where id=v_tip_id and status='paid';

      select coalesce(creator_amount,0) into v_creator_amount
      from public.fans_tips where id=v_tip_id for update;

      if v_creator_amount>0 and not exists(
        select 1 from public.fans_financial_ledger
        where order_id=v_order.id and entry_type='refund_creator_credit'
          and direction='debit' and status='posted'
          and metadata->>'tip_id'=v_tip_id::text
      ) then
        insert into public.fans_financial_ledger(
          order_id,payment_id,purchase_id,subscription_id,creator_id,
          entry_type,direction,amount,currency,status,provider,provider_reference,metadata
        ) values(
          v_order.id,v_payment.id,null,null,v_creator_id,'refund_creator_credit','debit',
          v_creator_amount,v_order.currency,'posted',p_provider,p_provider_payment_id,
          jsonb_build_object('tip_id',v_tip_id,'reason',p_payment_status)
        );
      end if;

    else
      select fp.* into v_previous_purchase
      from public.fans_purchases fp
      where fp.id=(
        select fl.purchase_id
        from public.fans_financial_ledger fl
        where fl.order_id=v_order.id and fl.purchase_id is not null
          and fl.entry_type='sale_gross' and fl.status='posted'
        order by fl.created_at asc limit 1
      )
      for update;

      if not found then raise exception 'FANS_PURCHASE_NOT_FOUND_FOR_ORDER'; end if;

      update public.fans_purchases set status='refunded',updated_at=now()
      where id=v_previous_purchase.id;

      if v_previous_purchase.subscription_id is not null then
        perform public.fans_recalculate_subscription_after_refund(v_previous_purchase.subscription_id);
      end if;

      if not exists(
        select 1 from public.fans_financial_ledger
        where purchase_id=v_previous_purchase.id
          and entry_type='refund_creator_credit'
          and direction='debit' and status='posted'
      ) then
        insert into public.fans_financial_ledger(
          order_id,payment_id,purchase_id,subscription_id,creator_id,
          entry_type,direction,amount,currency,status,provider,provider_reference,metadata
        ) values(
          v_order.id,v_payment.id,v_previous_purchase.id,v_previous_purchase.subscription_id,
          v_previous_purchase.creator_id,'refund_creator_credit','debit',
          v_previous_purchase.creator_amount,v_previous_purchase.currency,'posted',
          p_provider,p_provider_payment_id,jsonb_build_object('reason',p_payment_status)
        );
      end if;
    end if;

    return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,
      'order_id',p_order_id,'refunded_purchase_id',v_previous_purchase.id,
      'live_session_id',v_live_session_id);
  end if;

  if p_payment_status='failed' then
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,
      status='failed',payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
    update public.orders set status='failed',updated_at=now() where id=v_order.id;
    if v_product_type='live_call' then
      update public.fans_live_sessions set status='expired',updated_at=now()
      where id=v_live_session_id and status='pending_payment';
    end if;
    return jsonb_build_object('ok',true,'idempotent',false,'status','failed',
      'order_id',p_order_id,'live_session_id',v_live_session_id);
  end if;

  if p_payment_status='cancelled' then
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,
      status='cancelled',payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
    update public.orders set status='cancelled',updated_at=now() where id=v_order.id;
    if v_product_type='live_call' then
      update public.fans_live_sessions set status='cancelled',cancelled_at=now(),updated_at=now()
      where id=v_live_session_id and status='pending_payment';
    end if;
    return jsonb_build_object('ok',true,'idempotent',false,'status','cancelled',
      'order_id',p_order_id,'live_session_id',v_live_session_id);
  end if;

  update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,
    status=p_payment_status,payment_method=p_payment_method,updated_at=now()
  where id=v_payment.id;

  return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,
    'order_id',p_order_id,'live_session_id',v_live_session_id);
end;
$function$

CREATE OR REPLACE FUNCTION public.settle_fans_live_extension_checkout(p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status, p_payment_method text DEFAULT NULL::text, p_provider_fee numeric DEFAULT 0)
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

 if v_payment.status in ('refunded','chargeback') and p_payment_status <> v_payment.status then raise exception 'INVALID_PAYMENT_STATE_TRANSITION'; end if;
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
   /*
    * Reverse exactly the creator net amount credited by the original extension
    * settlement. The payment row is locked above, so concurrent callbacks for
    * the same order serialize through this function. The reversal is guarded
    * by extension_request_id and is therefore idempotent.
    */
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
$function$

CREATE OR REPLACE FUNCTION public.settle_pecatho_customer_premium_checkout(p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status, p_payment_method text DEFAULT NULL::text, p_provider_fee numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_subscription public.pecatho_customer_premium_subscriptions%rowtype;
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_start timestamptz;
  v_end timestamptz;
begin
  if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null then
    raise exception 'INVALID_PREMIUM_SETTLEMENT_REQUEST';
  end if;
  if coalesce(p_provider_fee,0) < 0 then raise exception 'INVALID_PROVIDER_FEE'; end if;

  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.metadata->>'product_type' <> 'premium_subscription' then raise exception 'PREMIUM_ORDER_NOT_FOUND'; end if;
  select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  select * into v_subscription from public.pecatho_customer_premium_subscriptions where order_id=p_order_id for update;
  if not found then raise exception 'PREMIUM_SUBSCRIPTION_NOT_FOUND'; end if;
  select * into v_plan from public.pecatho_customer_premium_plans where id=v_subscription.plan_id;
  if not found then raise exception 'PREMIUM_PLAN_NOT_FOUND'; end if;

  if v_payment.status in ('refunded','chargeback') and p_payment_status <> v_payment.status then
    raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
  end if;
  if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then
    return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,
      'subscription_id',v_subscription.id,'ends_at',v_subscription.ends_at);
  end if;

  if p_payment_status='paid' then
    select greatest(now(),coalesce(max(ends_at),now())) into v_start
      from public.pecatho_customer_premium_subscriptions
      where user_id=v_subscription.user_id and status='active' and ends_at > now();
    v_end := v_start + make_interval(days => v_plan.duration_days);
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',
      payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
    update public.orders set status='paid',updated_at=now() where id=v_order.id;
    update public.pecatho_customer_premium_subscriptions set status='active',starts_at=v_start,ends_at=v_end,
      updated_at=now() where id=v_subscription.id;
    return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,
      'subscription_id',v_subscription.id,'starts_at',v_start,'ends_at',v_end);
  end if;

  if p_payment_status in ('refunded','chargeback') then
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;
    update public.pecatho_customer_premium_subscriptions set status=p_payment_status,updated_at=now()
      where id=v_subscription.id;
  else
    update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,updated_at=now() where id=v_payment.id;
    update public.orders set status=case when p_payment_status='failed' then 'failed' when p_payment_status='cancelled' then 'cancelled' else 'awaiting_payment' end,
      updated_at=now() where id=v_order.id;
    update public.pecatho_customer_premium_subscriptions set status=case when p_payment_status='failed' then 'cancelled' when p_payment_status='cancelled' then 'cancelled' else 'pending' end,
      updated_at=now() where id=v_subscription.id;
  end if;
  return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id,
    'subscription_id',v_subscription.id);
end;
$function$

CREATE OR REPLACE FUNCTION public.settle_profile_media_checkout(p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status, p_payment_method text DEFAULT NULL::text, p_provider_fee numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
 v_order public.orders%rowtype; v_payment public.payments%rowtype; v_meta jsonb;
 v_purchase public.profile_media_purchases%rowtype; v_media public.profile_media%rowtype;
 v_advertiser public.advertiser_profiles%rowtype; v_rule public.fans_fee_rules%rowtype;
 v_platform_fee numeric:=0; v_provider_fee numeric:=greatest(coalesce(p_provider_fee,0),0);
 v_owner_amount numeric:=0; v_total_fees numeric:=0; v_balance numeric:=0;
begin
 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
 if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
 v_meta:=coalesce(v_order.metadata,'{}'::jsonb);
 if coalesce(v_meta->>'product_type',v_meta->>'kind')<>'profile_media' then raise exception 'INVALID_PROFILE_MEDIA_ORDER'; end if;
 select * into v_purchase from public.profile_media_purchases where order_id=v_order.id for update;
 if not found then raise exception 'PURCHASE_NOT_FOUND'; end if;
 select * into v_media from public.profile_media where id=v_purchase.media_id for update;
 if not found then raise exception 'MEDIA_NOT_FOUND'; end if;
 select * into v_advertiser from public.advertiser_profiles where id=v_media.profile_id;
 if not found then raise exception 'ADVERTISER_PROFILE_NOT_FOUND'; end if;

 if v_payment.status in ('refunded','chargeback') and p_payment_status <> v_payment.status then
   raise exception 'INVALID_PAYMENT_STATE_TRANSITION';
 end if;

 if v_payment.status='paid' and p_payment_status not in ('refunded','chargeback') then
   return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,'purchase_id',v_purchase.id);
 end if;

 if p_payment_status='paid' then
   select * into v_rule from public.fans_fee_rules where active=true and effective_from<=now() and (effective_until is null or effective_until>now()) order by effective_from desc limit 1;
   v_platform_fee:=least(v_order.total,round((v_order.total*coalesce(v_rule.platform_percent,0)/100)+coalesce(v_rule.fixed_fee,0),2));
   v_owner_amount:=greatest(round(v_order.total-v_provider_fee-v_platform_fee,2),0);
   v_total_fees:=greatest(round(v_order.total-v_owner_amount,2),0);
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
   update public.orders set status='paid',updated_at=now() where id=v_order.id and status in ('awaiting_payment','paid');
   update public.profile_media_purchases set status='paid',provider=p_provider,provider_reference=p_provider_payment_id,purchased_at=coalesce(purchased_at,now()),expires_at=null,updated_at=now() where id=v_purchase.id and status in ('pending','paid');

   insert into public.ledger_entries(user_id,order_id,payment_id,entry_type,amount,currency,balance_after,description,idempotency_key,metadata)
   select v_advertiser.user_id,v_order.id,v_payment.id,'credit'::ledger_entry_type,v_order.total,v_order.currency,
          coalesce(sum(case when entry_type in ('credit','adjustment') then amount else -amount end),0)+v_order.total,
          'Venda de mídia digital de anunciante','profile-media-sale:'||v_purchase.id::text,
          jsonb_build_object('source','pecatho','kind','profile_media','media_id',v_media.id,'purchase_id',v_purchase.id,'profile_id',v_media.profile_id,'gross_amount',v_order.total,'platform_fee',v_platform_fee,'provider_fee',v_provider_fee,'owner_amount',v_owner_amount)
   from public.ledger_entries where user_id=v_advertiser.user_id on conflict(idempotency_key) do nothing;

   if v_total_fees>0 then
     insert into public.ledger_entries(user_id,order_id,payment_id,entry_type,amount,currency,balance_after,description,idempotency_key,metadata)
     select v_advertiser.user_id,v_order.id,v_payment.id,'fee'::ledger_entry_type,v_total_fees,v_order.currency,
            coalesce(sum(case when entry_type in ('credit','adjustment') then amount else -amount end),0)-v_total_fees,
            'Taxas da venda de mídia digital','profile-media-fee:'||v_purchase.id::text,
            jsonb_build_object('source','pecatho','kind','profile_media','media_id',v_media.id,'purchase_id',v_purchase.id,'gross_amount',v_order.total,'platform_fee',v_platform_fee,'provider_fee',v_provider_fee,'total_fees',v_total_fees)
     from public.ledger_entries where user_id=v_advertiser.user_id on conflict(idempotency_key) do nothing;
   end if;

   select coalesce(sum(case when entry_type in ('credit','adjustment') then amount else -amount end),0) into v_balance from public.ledger_entries where user_id=v_advertiser.user_id;
   return jsonb_build_object('ok',true,'status','paid','purchase_id',v_purchase.id,'media_id',v_purchase.media_id,'owner_amount',v_owner_amount,'platform_fee',v_platform_fee,'provider_fee',v_provider_fee,'balance',v_balance);
 end if;

 if p_payment_status in ('refunded','chargeback') then
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,updated_at=now() where id=v_payment.id;
   update public.orders set status='refunded',updated_at=now() where id=v_order.id;
   update public.profile_media_purchases set status=p_payment_status,updated_at=now() where id=v_purchase.id;
   select coalesce((metadata->>'owner_amount')::numeric,0) into v_owner_amount from public.ledger_entries where idempotency_key='profile-media-sale:'||v_purchase.id::text limit 1;
   insert into public.ledger_entries(user_id,order_id,payment_id,entry_type,amount,currency,balance_after,description,idempotency_key,metadata)
   select v_advertiser.user_id,v_order.id,v_payment.id,case when p_payment_status='chargeback' then 'chargeback'::ledger_entry_type else 'refund'::ledger_entry_type end,
          v_owner_amount,v_order.currency,coalesce(sum(case when entry_type in ('credit','adjustment') then amount else -amount end),0)-v_owner_amount,
          case when p_payment_status='chargeback' then 'Chargeback de venda de mídia digital' else 'Estorno de venda de mídia digital' end,
          'profile-media-reversal:'||v_purchase.id::text||':'||p_payment_status,
          jsonb_build_object('source','pecatho','kind','profile_media','media_id',v_media.id,'purchase_id',v_purchase.id,'owner_amount_reversed',v_owner_amount,'status',p_payment_status)
   from public.ledger_entries where user_id=v_advertiser.user_id on conflict(idempotency_key) do nothing;
   select coalesce(sum(case when entry_type in ('credit','adjustment') then amount else -amount end),0) into v_balance from public.ledger_entries where user_id=v_advertiser.user_id;
   return jsonb_build_object('ok',true,'status',p_payment_status,'purchase_id',v_purchase.id,'owner_amount_reversed',v_owner_amount,'balance',v_balance);
 end if;

 update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=coalesce(p_payment_method,payment_method),updated_at=now() where id=v_payment.id;
 if p_payment_status in ('failed','cancelled') then
   update public.orders set status=p_payment_status,updated_at=now() where id=v_order.id and status='awaiting_payment';
   update public.profile_media_purchases set status=p_payment_status,updated_at=now() where id=v_purchase.id and status='pending';
 end if;
 return jsonb_build_object('ok',true,'status',p_payment_status,'purchase_id',v_purchase.id);
end; $function$
