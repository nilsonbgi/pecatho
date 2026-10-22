-- Affiliate 10% commission on settled revenue actually retained by Pecatho.
-- Keeps the existing 30% Premium creator commission separate and uses idempotent
-- commission records plus ledger entries for auditable credits and reversals.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider_fee numeric(12,2) NOT NULL DEFAULT 0
  CHECK (provider_fee >= 0);

CREATE TABLE IF NOT EXISTS public.pecatho_affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.pecatho_affiliate_referrals(id) ON DELETE RESTRICT,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  affiliate_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  currency character(3) NOT NULL DEFAULT 'BRL',
  revenue_base numeric(12,2) NOT NULL CHECK (revenue_base >= 0),
  commission_amount numeric(12,2) NOT NULL CHECK (commission_amount >= 0),
  status text NOT NULL DEFAULT 'credited'
    CHECK (status IN ('credited','reversed')),
  reversal_status text CHECK (reversal_status IN ('refunded','chargeback')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pecatho_affiliate_commissions_payment_unique UNIQUE(payment_id)
);

CREATE INDEX IF NOT EXISTS pecatho_affiliate_commissions_user_status_idx
  ON public.pecatho_affiliate_commissions(affiliate_user_id, status, created_at DESC);

ALTER TABLE public.pecatho_affiliate_commissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pecatho_affiliate_commissions FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.settle_pecatho_customer_premium_checkout(
  p_order_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_payment_status public.payment_status,
  p_payment_method text DEFAULT NULL,
  p_provider_fee numeric DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_subscription public.pecatho_customer_premium_subscriptions%rowtype;
  v_plan public.pecatho_customer_premium_plans%rowtype;
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  IF p_order_id IS NULL OR nullif(trim(p_provider),'') IS NULL OR nullif(trim(p_provider_payment_id),'') IS NULL THEN
    RAISE EXCEPTION 'INVALID_PREMIUM_SETTLEMENT_REQUEST';
  END IF;
  IF coalesce(p_provider_fee,0) < 0 THEN RAISE EXCEPTION 'INVALID_PROVIDER_FEE'; END IF;

  SELECT * INTO v_order FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.metadata->>'product_type' <> 'premium_subscription' THEN RAISE EXCEPTION 'PREMIUM_ORDER_NOT_FOUND'; END IF;
  SELECT * INTO v_payment FROM public.payments WHERE order_id=p_order_id ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PAYMENT_NOT_FOUND'; END IF;
  SELECT * INTO v_subscription FROM public.pecatho_customer_premium_subscriptions WHERE order_id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PREMIUM_SUBSCRIPTION_NOT_FOUND'; END IF;
  SELECT * INTO v_plan FROM public.pecatho_customer_premium_plans WHERE id=v_subscription.plan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'PREMIUM_PLAN_NOT_FOUND'; END IF;

  IF v_payment.status IN ('refunded','chargeback') AND p_payment_status <> v_payment.status THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_STATE_TRANSITION';
  END IF;
  IF v_payment.status='paid' AND p_payment_status NOT IN ('refunded','chargeback') THEN
    RETURN jsonb_build_object('ok',true,'idempotent',true,'status','paid','order_id',p_order_id,
      'subscription_id',v_subscription.id,'ends_at',v_subscription.ends_at);
  END IF;

  IF p_payment_status='paid' THEN
    SELECT greatest(now(),coalesce(max(ends_at),now())) INTO v_start
      FROM public.pecatho_customer_premium_subscriptions
      WHERE user_id=v_subscription.user_id AND status='active' AND ends_at > now();
    v_end := v_start + make_interval(days => v_plan.duration_days);
    UPDATE public.payments SET provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',
      payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,0),2),
      paid_at=coalesce(paid_at,now()),updated_at=now() WHERE id=v_payment.id;
    UPDATE public.orders SET status='paid',updated_at=now() WHERE id=v_order.id;
    UPDATE public.pecatho_customer_premium_subscriptions SET status='active',starts_at=v_start,ends_at=v_end,
      updated_at=now() WHERE id=v_subscription.id;
    RETURN jsonb_build_object('ok',true,'idempotent',false,'status','paid','order_id',p_order_id,
      'subscription_id',v_subscription.id,'starts_at',v_start,'ends_at',v_end);
  END IF;

  IF p_payment_status IN ('refunded','chargeback') THEN
    UPDATE public.payments SET provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,provider_fee,0),2),updated_at=now()
      WHERE id=v_payment.id;
    UPDATE public.orders SET status='refunded',updated_at=now() WHERE id=v_order.id;
    UPDATE public.pecatho_customer_premium_subscriptions SET status=p_payment_status,updated_at=now()
      WHERE id=v_subscription.id;
  ELSE
    UPDATE public.payments SET provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,
      payment_method=p_payment_method,provider_fee=round(coalesce(p_provider_fee,provider_fee,0),2),updated_at=now()
      WHERE id=v_payment.id;
    UPDATE public.orders SET status=CASE WHEN p_payment_status='failed' THEN 'failed' WHEN p_payment_status='cancelled' THEN 'cancelled' ELSE 'awaiting_payment' END,
      updated_at=now() WHERE id=v_order.id;
    UPDATE public.pecatho_customer_premium_subscriptions SET status=CASE WHEN p_payment_status IN ('failed','cancelled') THEN 'cancelled' ELSE 'pending' END,
      updated_at=now() WHERE id=v_subscription.id;
  END IF;
  RETURN jsonb_build_object('ok',true,'idempotent',false,'status',p_payment_status,'order_id',p_order_id,
    'subscription_id',v_subscription.id);
END;
$function$;

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
BEGIN
  IF NEW.status NOT IN ('paid','refunded','chargeback') OR
     (TG_OP='UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status) THEN
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
      v_revenue_base := greatest(round(NEW.amount - round(NEW.amount * 0.30,2) - coalesce(NEW.provider_fee,0),2),0);
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
  IF NOT FOUND OR v_existing.status='reversed' THEN RETURN NEW; END IF;

  v_entry_type := CASE WHEN NEW.status='chargeback' THEN 'chargeback'::public.ledger_entry_type ELSE 'refund'::public.ledger_entry_type END;
  v_key := 'pecatho-affiliate-reversal:'||NEW.id::text;
  SELECT coalesce(sum(CASE WHEN le.entry_type IN ('credit','adjustment') THEN le.amount ELSE -le.amount END),0)
    INTO v_balance FROM public.ledger_entries le WHERE le.user_id=v_existing.affiliate_user_id;
  INSERT INTO public.ledger_entries(
    user_id,order_id,payment_id,entry_type,amount,currency,balance_after,description,idempotency_key,metadata
  ) VALUES (
    v_existing.affiliate_user_id,NEW.order_id,NEW.id,v_entry_type,v_existing.commission_amount,NEW.currency,
    v_balance-v_existing.commission_amount,
    CASE WHEN NEW.status='chargeback' THEN 'Estorno de comissão de afiliado por chargeback' ELSE 'Estorno de comissão de afiliado por reembolso' END,
    v_key,jsonb_build_object('source','pecatho','kind','affiliate_commission_reversal',
      'commission_id',v_existing.id,'referral_id',v_existing.referral_id,
      'commission_amount_reversed',v_existing.commission_amount,'payment_status',NEW.status)
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  UPDATE public.pecatho_affiliate_commissions SET status='reversed',reversal_status=NEW.status,updated_at=now()
    WHERE id=v_existing.id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS pecatho_affiliate_commission_payment_trigger ON public.payments;
CREATE CONSTRAINT TRIGGER pecatho_affiliate_commission_payment_trigger
AFTER INSERT OR UPDATE ON public.payments
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.post_pecatho_affiliate_commission();

REVOKE ALL ON FUNCTION public.post_pecatho_affiliate_commission() FROM PUBLIC, anon, authenticated;
