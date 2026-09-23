begin;

create or replace function public.prepare_fans_live_refund(p_session_id uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  s public.fans_live_sessions%rowtype;
  p public.payments%rowtype;
  creator boolean;
  v_creator_amount numeric(12,2);
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into s from public.fans_live_sessions where id=p_session_id for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;

  creator:=exists(
    select 1 from public.fans_creators fc
    where fc.id=s.creator_id and fc.user_id=auth.uid()
  );
  if not creator then raise exception 'LIVE_REFUND_CREATOR_ONLY'; end if;
  if s.status<>'completed' then raise exception 'LIVE_SESSION_NOT_COMPLETED'; end if;
  if s.refund_status not in ('required','requested','failed') then
    raise exception 'LIVE_REFUND_NOT_REQUIRED';
  end if;

  select * into p
  from public.payments
  where id=s.payment_id or order_id=s.order_id
  order by created_at desc limit 1 for update;
  if not found then raise exception 'LIVE_PAYMENT_NOT_FOUND'; end if;

  if p.status in ('refunded','chargeback') then
    update public.fans_live_sessions
       set refund_status='refunded',
           refund_processed_at=coalesce(refund_processed_at,now()),
           updated_at=now()
     where id=s.id;
    return jsonb_build_object('ok',true,'already_refunded',true,'session_id',s.id);
  end if;

  if nullif(trim(p.provider_payment_id),'') is null then
    raise exception 'LIVE_PROVIDER_PAYMENT_NOT_READY';
  end if;

  select greatest(
    round(coalesce(sum(
      case
        when fl.entry_type='sale_gross' and fl.direction='credit' then fl.amount
        when fl.entry_type in ('provider_fee','platform_fee') and fl.direction='debit' then -fl.amount
        else 0
      end
    ),0),2),0
  )
  into v_creator_amount
  from public.fans_financial_ledger fl
  where fl.order_id=s.order_id
    and fl.creator_id=s.creator_id
    and fl.status='posted';

  if v_creator_amount <= 0 then
    raise exception 'LIVE_CREATOR_CREDIT_NOT_FOUND';
  end if;

  if not exists(
    select 1 from public.fans_financial_ledger fl
    where fl.order_id=s.order_id
      and fl.creator_id=s.creator_id
      and fl.entry_type='refund_creator_hold'
      and fl.status='posted'
      and fl.metadata->>'live_session_id'=s.id::text
  ) then
    insert into public.fans_financial_ledger(
      order_id,payment_id,purchase_id,subscription_id,creator_id,
      entry_type,direction,amount,currency,status,provider,
      provider_reference,metadata
    )
    values(
      s.order_id,p.id,null,null,s.creator_id,
      'refund_creator_hold','debit',v_creator_amount,s.currency,'posted',
      p.provider,p.provider_payment_id,
      jsonb_build_object(
        'live_session_id',s.id,
        'refund_amount',coalesce(s.refund_amount,s.amount),
        'creator_amount_reserved',v_creator_amount,
        'reason',s.refund_reason,
        'ended_reason',s.ended_reason,
        'commercial_outcome',s.commercial_outcome,
        'reservation_status','pending_provider_refund'
      )
    );
  end if;

  update public.fans_live_sessions
     set refund_status='requested',
         refund_requested_at=coalesce(refund_requested_at,now()),
         updated_at=now()
   where id=s.id;

  return jsonb_build_object(
    'ok',true,'session_id',s.id,'order_id',s.order_id,'payment_id',p.id,
    'provider',p.provider,'provider_payment_id',p.provider_payment_id,
    'refund_amount',coalesce(s.refund_amount,s.amount),
    'creator_amount_reserved',v_creator_amount,'reason',s.refund_reason
  );
end
$$;

create or replace function public.finalize_fans_live_refund_ledger()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  p public.payments%rowtype;
  hold_amount numeric(12,2);
begin
  if new.status<>'refunded' or old.status='refunded' then return new; end if;

  select * into p
  from public.payments
  where id=new.payment_id or order_id=new.order_id
  order by created_at desc limit 1;
  if not found then return new; end if;

  select fl.amount into hold_amount
  from public.fans_financial_ledger fl
  where fl.order_id=new.order_id
    and fl.creator_id=new.creator_id
    and fl.entry_type='refund_creator_hold'
    and fl.status='posted'
    and fl.metadata->>'live_session_id'=new.id::text
  order by fl.created_at desc limit 1;

  if hold_amount is null then
    select greatest(
      round(coalesce(sum(
        case
          when fl.entry_type='sale_gross' and fl.direction='credit' then fl.amount
          when fl.entry_type in ('provider_fee','platform_fee') and fl.direction='debit' then -fl.amount
          else 0
        end
      ),0),2),0
    )
    into hold_amount
    from public.fans_financial_ledger fl
    where fl.order_id=new.order_id
      and fl.creator_id=new.creator_id
      and fl.status='posted';

    if hold_amount > 0 then
      insert into public.fans_financial_ledger(
        order_id,payment_id,purchase_id,subscription_id,creator_id,
        entry_type,direction,amount,currency,status,provider,
        provider_reference,metadata
      )
      values(
        new.order_id,p.id,null,null,new.creator_id,
        'refund_creator_hold','debit',hold_amount,new.currency,'posted',
        p.provider,p.provider_payment_id,
        jsonb_build_object(
          'live_session_id',new.id,
          'refund_amount',coalesce(new.refund_amount,new.amount),
          'creator_amount_reserved',hold_amount,
          'reason',new.refund_reason,
          'ended_reason',new.ended_reason,
          'commercial_outcome',new.commercial_outcome,
          'reservation_status','finalized_by_refund'
        )
      );
    end if;
  end if;

  if hold_amount is not null and hold_amount > 0 then
    update public.fans_financial_ledger
       set metadata=metadata || jsonb_build_object(
         'reservation_status','refunded',
         'refund_processed_at',coalesce(new.refund_processed_at,now())
       )
     where order_id=new.order_id
       and creator_id=new.creator_id
       and entry_type='refund_creator_hold'
       and status='posted'
       and metadata->>'live_session_id'=new.id::text;
  end if;

  return new;
end
$$;

create or replace function public.mark_fans_live_refund_failed(p_session_id uuid)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  update public.fans_live_sessions
     set refund_status='failed',updated_at=now()
   where id=p_session_id and status='completed' and refund_status='requested';

  update public.fans_financial_ledger fl
     set metadata=fl.metadata || jsonb_build_object(
       'reservation_status','released','released_at',now()
     )
   where fl.entry_type='refund_creator_hold'
     and fl.direction='debit'
     and fl.status='posted'
     and fl.metadata->>'live_session_id'=p_session_id::text
     and fl.metadata->>'reservation_status'='pending_provider_refund';

  if found then
    insert into public.fans_financial_ledger(
      order_id,payment_id,purchase_id,subscription_id,creator_id,
      entry_type,direction,amount,currency,status,provider,
      provider_reference,metadata
    )
    select
      fl.order_id,fl.payment_id,fl.purchase_id,fl.subscription_id,fl.creator_id,
      'refund_creator_hold_release','credit',fl.amount,fl.currency,'posted',
      fl.provider,fl.provider_reference,
      fl.metadata || jsonb_build_object(
        'reservation_status','released',
        'release_reason','provider_refund_failed',
        'released_at',now()
      )
    from public.fans_financial_ledger fl
    where fl.entry_type='refund_creator_hold'
      and fl.direction='debit'
      and fl.status='posted'
      and fl.metadata->>'live_session_id'=p_session_id::text
      and fl.metadata->>'reservation_status'='released'
      and not exists(
        select 1 from public.fans_financial_ledger rel
        where rel.order_id=fl.order_id
          and rel.entry_type='refund_creator_hold_release'
          and rel.status='posted'
          and rel.metadata->>'live_session_id'=p_session_id::text
      );
  end if;
end
$$;

revoke all on function public.prepare_fans_live_refund(uuid) from public,anon;
grant execute on function public.prepare_fans_live_refund(uuid) to authenticated;
revoke all on function public.mark_fans_live_refund_failed(uuid) from public,anon,authenticated;

commit;
