-- Persist the Mercado Pago processing fee for customer Premium settlements and
-- calculate affiliate commission on the actual Pecatho net for each Premium order.
create or replace function public.settle_pecatho_customer_premium_checkout(
 p_order_id uuid,p_provider text,p_provider_payment_id text,p_payment_status payment_status,p_payment_method text default null,p_provider_fee numeric default 0
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $function$
declare v_order public.orders%rowtype; v_payment public.payments%rowtype; v_subscription public.pecatho_customer_premium_subscriptions%rowtype;
 v_start timestamptz; v_end timestamptz; v_duration integer;
begin
 if p_order_id is null or nullif(trim(p_provider),'') is null or nullif(trim(p_provider_payment_id),'') is null then raise exception 'INVALID_PREMIUM_SETTLEMENT_REQUEST'; end if;
 if coalesce(p_provider_fee,0)<0 then raise exception 'INVALID_PROVIDER_FEE'; end if;
 select * into v_order from public.orders where id=p_order_id for update;
 if not found or v_order.metadata->>'product_type'<>'premium_subscription' then raise exception 'PREMIUM_ORDER_NOT_FOUND'; end if;
 select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update;
 if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
 select * into v_subscription from public.pecatho_customer_premium_subscriptions where order_id=p_order_id for update;
 if not found then raise exception 'PREMIUM_SUBSCRIPTION_NOT_FOUND'; end if;
 v_duration:=coalesce(nullif(v_order.metadata->>'duration_days','')::integer,v_subscription.duration_days,30);
 if v_duration not in(30,90,180,365) then raise exception 'PREMIUM_DURATION_INVALID'; end if;
 if v_payment.status in('refunded','chargeback') and p_payment_status not in('refunded','chargeback') then raise exception 'INVALID_PAYMENT_STATE_TRANSITION'; end if;
 if v_payment.status='paid' and p_payment_status not in('refunded','chargeback') then return jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,'subscription_id',v_subscription.id,'ends_at',v_subscription.ends_at); end if;
 if p_payment_status='paid' then
  select greatest(now(),coalesce(max(ends_at),now())) into v_start from public.pecatho_customer_premium_subscriptions where user_id=v_subscription.user_id and status='active' and ends_at>now();
  v_end:=v_start+make_interval(days=>v_duration);
  update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,0),2),paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
  update public.orders set status='paid',updated_at=now() where id=v_order.id;
  update public.pecatho_customer_premium_subscriptions set status='active',starts_at=v_start,ends_at=v_end,duration_days=v_duration,updated_at=now() where id=v_subscription.id;
  return jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,'subscription_id',v_subscription.id,'starts_at',v_start,'ends_at',v_end);
 end if;
 if p_payment_status in('refunded','chargeback') then
  update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,provider_fee,0),2),updated_at=now() where id=v_payment.id;
  update public.orders set status='refunded',updated_at=now() where id=v_order.id;
  update public.pecatho_customer_premium_subscriptions set status=p_payment_status,updated_at=now() where id=v_subscription.id;
 else
  update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,provider_fee,0),2),updated_at=now() where id=v_payment.id;
  update public.orders set status=case when p_payment_status='failed' then 'failed' when p_payment_status='cancelled' then 'cancelled' else 'awaiting_payment' end,updated_at=now() where id=v_order.id;
  update public.pecatho_customer_premium_subscriptions set status=case when p_payment_status in('failed','cancelled') then 'cancelled' else 'pending' end,updated_at=now() where id=v_subscription.id;
 end if;
 return jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id,'subscription_id',v_subscription.id);
end;$function$;

CREATE OR REPLACE FUNCTION public.post_pecatho_affiliate_commission()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_order public.orders%rowtype;
  v_referral public.pecatho_affiliate_referrals%rowtype;
  v_creator_user_id uuid;
  v_revenue_base numeric(12,2) := 0;
  v_commission numeric(12,2) := 0;
  v_existing public.pecatho_affiliate_commissions%rowtype;
  v_key text;
  v_entry_type public.ledger_entry_type;
  v_balance numeric(12,2);
  v_target_reversed numeric(12,2) := 0;
  v_reversal_delta numeric(12,2) := 0;
BEGIN
  IF NEW.status NOT IN ('paid','partially_refunded','refunded','chargeback') OR
     (TG_OP='UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status AND NEW.refunded_amount IS NOT DISTINCT FROM OLD.refunded_amount) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id=NEW.order_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT * INTO v_referral FROM public.pecatho_affiliate_referrals
   WHERE referred_user_id=NEW.user_id AND status IN ('registered','qualified')
   FOR UPDATE;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT c.user_id INTO v_creator_user_id FROM public.fans_creators c
   WHERE c.id=v_referral.creator_id AND c.status='active';
  IF v_creator_user_id IS NULL OR v_creator_user_id=NEW.user_id THEN RETURN NEW; END IF;

  IF NEW.status='paid' THEN
    IF v_order.metadata->>'product_type'='premium_subscription' THEN
      -- Premium revenue is net of the existing 30% creator attribution and
      -- the provider fee explicitly supplied to the settlement RPC.
      v_revenue_base := greatest(round(NEW.amount - CASE WHEN nullif(v_order.metadata->>'attributed_creator_id','') IS NOT NULL THEN round(NEW.amount * 0.30,2) ELSE 0 END - coalesce(NEW.provider_fee,0),2),0);
    ELSIF v_order.metadata->>'product_type'='digital_content' THEN
      SELECT greatest(coalesce(s.platform_fee,0),0) INTO v_revenue_base
        FROM public.digital_content_sales s WHERE s.payment_id=NEW.id OR s.order_id=NEW.order_id
        ORDER BY s.created_at DESC LIMIT 1;
      v_revenue_base := coalesce(v_revenue_base,0);
    ELSIF v_order.metadata->>'product_type'='profile_media' THEN
      SELECT greatest(coalesce((le.metadata->>'platform_fee')::numeric,0),0)
        INTO v_revenue_base FROM public.ledger_entries le
        WHERE le.payment_id=NEW.id AND le.idempotency_key LIKE 'profile-media-sale:%'
        ORDER BY le.created_at DESC LIMIT 1;
      v_revenue_base := coalesce(v_revenue_base,0);
    ELSIF v_order.metadata->>'product_type' IN ('fans_purchase','fans_subscription','fans_tip','fans_live_session') THEN
      SELECT greatest(coalesce(s.platform_fee,0),0) INTO v_revenue_base
        FROM public.fans_purchases s WHERE s.payment_id=NEW.id OR s.order_id=NEW.order_id
        ORDER BY s.created_at DESC LIMIT 1;
      IF coalesce(v_revenue_base,0)=0 THEN
        SELECT greatest(coalesce(t.platform_fee,0),0) INTO v_revenue_base
          FROM public.fans_tips t WHERE t.payment_id=NEW.id OR t.order_id=NEW.order_id
          ORDER BY t.created_at DESC LIMIT 1;
      END IF;
      v_revenue_base := coalesce(v_revenue_base,0);
    ELSE
      -- Do not issue commission on products whose net Pecatho revenue cannot
      -- be established from persisted settlement data.
      RETURN NEW;
    END IF;

    v_commission := round(v_revenue_base * 0.10,2);
    IF v_commission <= 0 THEN RETURN NEW; END IF;

    INSERT INTO public.pecatho_affiliate_commissions(
      referral_id,payment_id,order_id,affiliate_user_id,currency,revenue_base,commission_amount,status
    ) VALUES (
      v_referral.id,NEW.id,NEW.order_id,v_creator_user_id,NEW.currency,v_revenue_base,v_commission,'credited'
    ) ON CONFLICT (payment_id) DO NOTHING;

    IF NOT FOUND THEN RETURN NEW; END IF;

    SELECT coalesce(sum(CASE WHEN le.entry_type IN ('credit','adjustment') THEN le.amount ELSE -le.amount END),0)
      INTO v_balance FROM public.ledger_entries le WHERE le.user_id=v_creator_user_id;
    INSERT INTO public.ledger_entries(
      user_id,order_id,payment_id,entry_type,amount,currency,balance_after,description,idempotency_key,metadata
    ) VALUES (
      v_creator_user_id,NEW.order_id,NEW.id,'credit'::public.ledger_entry_type,v_commission,NEW.currency,
      v_balance+v_commission,'Comissão de afiliado de 10% sobre a receita líquida do Pecatho',
      'pecatho-affiliate-commission:'||NEW.id::text,
      jsonb_build_object('source','pecatho','kind','affiliate_commission','referral_id',v_referral.id,
        'creator_id',v_referral.creator_id,'referred_user_id',NEW.user_id,'payment_id',NEW.id,
        'revenue_base',v_revenue_base,'commission_percent',10,'commission_amount',v_commission)
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    UPDATE public.pecatho_affiliate_referrals SET status='qualified',first_paid_at=coalesce(first_paid_at,now()),updated_at=now()
      WHERE id=v_referral.id;
    RETURN NEW;
  END IF;

  SELECT * INTO v_existing FROM public.pecatho_affiliate_commissions WHERE payment_id=NEW.id FOR UPDATE;
  IF NOT FOUND OR v_existing.reversed_amount >= v_existing.commission_amount THEN RETURN NEW; END IF;

  IF NEW.status IN ('refunded','chargeback') THEN
    v_target_reversed := v_existing.commission_amount;
  ELSIF NEW.status='partially_refunded' THEN
    IF coalesce(NEW.refunded_amount,0) <= 0 OR coalesce(NEW.amount,0) <= 0 THEN RETURN NEW; END IF;
    v_target_reversed := least(v_existing.commission_amount,
      round(v_existing.commission_amount * least(NEW.refunded_amount / NEW.amount,1),2));
  ELSE
    RETURN NEW;
  END IF;

  v_reversal_delta := round(v_target_reversed - v_existing.reversed_amount,2);
  IF v_reversal_delta <= 0 THEN RETURN NEW; END IF;

  v_entry_type := CASE WHEN NEW.status='chargeback' THEN 'chargeback'::public.ledger_entry_type ELSE 'refund'::public.ledger_entry_type END;
  v_key := 'pecatho-affiliate-reversal:'||NEW.id::text||':'||to_char(v_target_reversed,'FM999999999990.00');
  SELECT coalesce(sum(CASE WHEN le.entry_type IN ('credit','adjustment') THEN le.amount ELSE -le.amount END),0)
    INTO v_balance FROM public.ledger_entries le WHERE le.user_id=v_existing.affiliate_user_id;
  INSERT INTO public.ledger_entries(
    user_id,order_id,payment_id,entry_type,amount,currency,balance_after,description,idempotency_key,metadata
  ) VALUES (
    v_existing.affiliate_user_id,NEW.order_id,NEW.id,v_entry_type,v_reversal_delta,NEW.currency,
    v_balance-v_reversal_delta,
    CASE WHEN NEW.status='chargeback' THEN 'Estorno de comissão de afiliado por chargeback'
      ELSE CASE WHEN NEW.status='partially_refunded' THEN 'Ajuste proporcional da comissão de afiliado por reembolso parcial'
        ELSE 'Estorno de comissão de afiliado por reembolso' END END,
    v_key,jsonb_build_object('source','pecatho','kind','affiliate_commission_reversal',
      'commission_id',v_existing.id,'referral_id',v_existing.referral_id,
      'commission_amount_reversed_total',v_target_reversed,'commission_amount_reversed_delta',v_reversal_delta,
      'refunded_amount',NEW.refunded_amount,'payment_amount',NEW.amount,'payment_status',NEW.status)
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  UPDATE public.pecatho_affiliate_commissions
    SET reversed_amount=v_target_reversed,
        status=CASE WHEN v_target_reversed >= commission_amount THEN 'reversed' ELSE 'credited' END,
        reversal_status=CASE WHEN v_target_reversed >= commission_amount THEN NEW.status ELSE NULL END,
        updated_at=now()
    WHERE id=v_existing.id;
  RETURN NEW;
END;
$function$;
