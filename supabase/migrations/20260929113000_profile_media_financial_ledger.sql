-- Financial settlement for advertiser-owned digital media.
-- Paid sales, fees, refunds and chargebacks are mirrored into the existing generic ledger.

CREATE OR REPLACE FUNCTION public.settle_profile_media_checkout(p_order_id uuid, p_provider text, p_provider_payment_id text, p_payment_status payment_status, p_payment_method text DEFAULT NULL::text, p_provider_fee numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_meta jsonb;
  v_purchase public.profile_media_purchases%rowtype;
  v_media public.profile_media%rowtype;
  v_advertiser public.advertiser_profiles%rowtype;
  v_rule public.fans_fee_rules%rowtype;
  v_platform_fee numeric := 0;
  v_provider_fee numeric := greatest(coalesce(p_provider_fee,0),0);
  v_owner_amount numeric := 0;
  v_total_fees numeric := 0;
  v_balance numeric := 0;
begin
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  select * into v_payment
    from public.payments
   where order_id=p_order_id
   order by created_at desc
   limit 1
   for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;

  v_meta := coalesce(v_order.metadata,'{}'::jsonb);
  if coalesce(v_meta->>'product_type',v_meta->>'kind') <> 'profile_media' then
    raise exception 'INVALID_PROFILE_MEDIA_ORDER';
  end if;

  select * into v_purchase
    from public.profile_media_purchases
   where order_id=v_order.id
   for update;
  if not found then raise exception 'PURCHASE_NOT_FOUND'; end if;

  select * into v_media
    from public.profile_media
   where id=v_purchase.media_id
   for update;
  if not found then raise exception 'MEDIA_NOT_FOUND'; end if;

  select * into v_advertiser
    from public.advertiser_profiles
   where id=v_media.profile_id;
  if not found then raise exception 'ADVERTISER_PROFILE_NOT_FOUND'; end if;

  if p_payment_status='paid' then
    select * into v_rule
      from public.fans_fee_rules
     where active=true
       and effective_from<=now()
       and (effective_until is null or effective_until>now())
     order by effective_from desc
     limit 1;

    v_platform_fee := least(
      v_order.total,
      round(
        (v_order.total*coalesce(v_rule.platform_percent,0)/100)
        + coalesce(v_rule.fixed_fee,0),
        2
      )
    );
    v_owner_amount := greatest(
      round(v_order.total-v_provider_fee-v_platform_fee,2),
      0
    );
    v_total_fees := greatest(round(v_order.total-v_owner_amount,2),0);

    update public.payments
       set provider=p_provider,
           provider_payment_id=p_provider_payment_id,
           status='paid',
           payment_method=p_payment_method,
           paid_at=coalesce(paid_at,now()),
           updated_at=now()
     where id=v_payment.id;

    update public.orders
       set status='paid',
           updated_at=now()
     where id=v_order.id
       and status in ('awaiting_payment','paid');

    update public.profile_media_purchases
       set status='paid',
           provider=p_provider,
           provider_reference=p_provider_payment_id,
           purchased_at=coalesce(purchased_at,now()),
           expires_at=null,
           updated_at=now()
     where id=v_purchase.id
       and status in ('pending','paid');

    insert into public.ledger_entries(
      user_id,order_id,payment_id,entry_type,amount,currency,balance_after,
      description,idempotency_key,metadata
    )
    select
      v_advertiser.user_id,
      v_order.id,
      v_payment.id,
      'credit'::ledger_entry_type,
      v_owner_amount,
      v_order.currency,
      coalesce(sum(
        case
          when entry_type in ('credit','adjustment') then amount
          else -amount
        end
      ),0) + v_owner_amount,
      'Venda de mídia digital de anunciante',
      'profile-media-sale:'||v_purchase.id::text,
      jsonb_build_object(
        'source','pecatho',
        'kind','profile_media',
        'media_id',v_media.id,
        'purchase_id',v_purchase.id,
        'profile_id',v_media.profile_id,
        'gross_amount',v_order.total,
        'platform_fee',v_platform_fee,
        'provider_fee',v_provider_fee,
        'owner_amount',v_owner_amount
      )
    from public.ledger_entries
    where user_id=v_advertiser.user_id
    on conflict (idempotency_key) do nothing;

    if v_total_fees > 0 then
      insert into public.ledger_entries(
        user_id,order_id,payment_id,entry_type,amount,currency,balance_after,
        description,idempotency_key,metadata
      )
      select
        v_advertiser.user_id,
        v_order.id,
        v_payment.id,
        'fee'::ledger_entry_type,
        v_total_fees,
        v_order.currency,
        coalesce(sum(
          case
            when entry_type in ('credit','adjustment') then amount
            else -amount
          end
        ),0) - v_total_fees,
        'Taxas da venda de mídia digital',
        'profile-media-fee:'||v_purchase.id::text,
        jsonb_build_object(
          'source','pecatho',
          'kind','profile_media',
          'media_id',v_media.id,
          'purchase_id',v_purchase.id,
          'gross_amount',v_order.total,
          'platform_fee',v_platform_fee,
          'provider_fee',v_provider_fee,
          'total_fees',v_total_fees
        )
      from public.ledger_entries
      where user_id=v_advertiser.user_id
      on conflict (idempotency_key) do nothing;
    end if;

    select coalesce(sum(
      case
        when entry_type in ('credit','adjustment') then amount
        else -amount
      end
    ),0)
    into v_balance
    from public.ledger_entries
    where user_id=v_advertiser.user_id;

    return jsonb_build_object(
      'ok',true,
      'status','paid',
      'purchase_id',v_purchase.id,
      'media_id',v_purchase.media_id,
      'owner_amount',v_owner_amount,
      'platform_fee',v_platform_fee,
      'provider_fee',v_provider_fee,
      'balance',v_balance
    );
  end if;

  if p_payment_status in ('refunded','chargeback') then
    update public.payments
       set provider=p_provider,
           provider_payment_id=p_provider_payment_id,
           status=p_payment_status,
           updated_at=now()
     where id=v_payment.id;

    update public.orders
       set status='refunded',
           updated_at=now()
     where id=v_order.id;

    update public.profile_media_purchases
       set status=p_payment_status,
           updated_at=now()
     where id=v_purchase.id;

    select greatest(
      round(v_order.total-v_provider_fee-v_platform_fee,2),
      0
    ) into v_owner_amount;

    select coalesce(
      (metadata->>'owner_amount')::numeric,
      v_owner_amount
    )
    into v_owner_amount
    from public.ledger_entries
    where idempotency_key='profile-media-sale:'||v_purchase.id::text
    limit 1;

    insert into public.ledger_entries(
      user_id,order_id,payment_id,entry_type,amount,currency,balance_after,
      description,idempotency_key,metadata
    )
    select
      v_advertiser.user_id,
      v_order.id,
      v_payment.id,
      case when p_payment_status='chargeback'
        then 'chargeback'::ledger_entry_type
        else 'refund'::ledger_entry_type
      end,
      v_owner_amount,
      v_order.currency,
      coalesce(sum(
        case
          when entry_type in ('credit','adjustment') then amount
          else -amount
        end
      ),0) - v_owner_amount,
      case when p_payment_status='chargeback'
        then 'Chargeback de venda de mídia digital'
        else 'Estorno de venda de mídia digital'
      end,
      'profile-media-reversal:'||v_purchase.id::text||':'||p_payment_status,
      jsonb_build_object(
        'source','pecatho',
        'kind','profile_media',
        'media_id',v_media.id,
        'purchase_id',v_purchase.id,
        'owner_amount_reversed',v_owner_amount,
        'status',p_payment_status
      )
    from public.ledger_entries
    where user_id=v_advertiser.user_id
    on conflict (idempotency_key) do nothing;

    select coalesce(sum(
      case
        when entry_type in ('credit','adjustment') then amount
        else -amount
      end
    ),0)
    into v_balance
    from public.ledger_entries
    where user_id=v_advertiser.user_id;

    return jsonb_build_object(
      'ok',true,
      'status',p_payment_status,
      'purchase_id',v_purchase.id,
      'owner_amount_reversed',v_owner_amount,
      'balance',v_balance
    );
  end if;

  update public.payments
     set provider=p_provider,
         provider_payment_id=p_provider_payment_id,
         status=p_payment_status,
         payment_method=coalesce(p_payment_method,payment_method),
         updated_at=now()
   where id=v_payment.id;

  if p_payment_status in ('failed','cancelled') then
    update public.orders
       set status=p_payment_status,
           updated_at=now()
     where id=v_order.id
       and status='awaiting_payment';

    update public.profile_media_purchases
       set status=p_payment_status,
           updated_at=now()
     where id=v_purchase.id
       and status='pending';
  end if;

  return jsonb_build_object('ok',true,'status',p_payment_status,'purchase_id',v_purchase.id);
end;
$function$

