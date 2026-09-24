create or replace function public.prepare_fans_live_refund_system(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  s public.fans_live_sessions%rowtype;
  p public.payments%rowtype;
  v_creator_amount numeric(12,2);
begin
  select * into s from public.fans_live_sessions where id=p_session_id for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if s.status <> 'completed' or s.refund_status not in ('required','failed') then
    raise exception 'LIVE_REFUND_NOT_QUEUED';
  end if;

  select * into p from public.payments
   where id=s.payment_id or order_id=s.order_id
   order by created_at desc limit 1 for update;
  if not found then raise exception 'LIVE_PAYMENT_NOT_FOUND'; end if;
  if p.status in ('refunded','chargeback') then
    update public.fans_live_sessions set refund_status='refunded',refund_processed_at=coalesce(refund_processed_at,now()),updated_at=now() where id=s.id;
    return jsonb_build_object('ok',true,'already_refunded',true,'session_id',s.id);
  end if;
  if nullif(trim(p.provider_payment_id),'') is null then raise exception 'LIVE_PROVIDER_PAYMENT_NOT_READY'; end if;

  select greatest(round(coalesce(sum(
    case
      when fl.entry_type='sale_gross' and fl.direction='credit' then fl.amount
      when fl.entry_type in ('provider_fee','platform_fee') and fl.direction='debit' then -fl.amount
      else 0
    end),0),2),0)
    into v_creator_amount
    from public.fans_financial_ledger fl
   where fl.order_id=s.order_id and fl.creator_id=s.creator_id and fl.status='posted';

  if v_creator_amount <= 0 then raise exception 'LIVE_CREATOR_CREDIT_NOT_FOUND'; end if;

  if not exists (
    select 1 from public.fans_financial_ledger fl
     where fl.order_id=s.order_id and fl.creator_id=s.creator_id
       and fl.entry_type='refund_creator_hold' and fl.status='posted'
       and fl.metadata->>'live_session_id'=s.id::text
  ) then
    insert into public.fans_financial_ledger(
      order_id,payment_id,purchase_id,subscription_id,creator_id,entry_type,direction,
      amount,currency,status,provider,provider_reference,metadata
    ) values (
      s.order_id,p.id,null,null,s.creator_id,'refund_creator_hold','debit',
      v_creator_amount,s.currency,'posted',p.provider,p.provider_payment_id,
      jsonb_build_object(
        'live_session_id',s.id,'refund_amount',coalesce(s.refund_amount,s.amount),
        'creator_amount_reserved',v_creator_amount,'reason',s.refund_reason,
        'ended_reason',s.ended_reason,'commercial_outcome',s.commercial_outcome,
        'reservation_status','pending_provider_refund','system_queue',true
      )
    );
  end if;

  update public.fans_live_sessions
     set refund_status='requested',refund_requested_at=coalesce(refund_requested_at,now()),updated_at=now()
   where id=s.id;

  return jsonb_build_object(
    'ok',true,'session_id',s.id,'order_id',s.order_id,'payment_id',p.id,
    'provider',p.provider,'provider_payment_id',p.provider_payment_id,
    'refund_amount',coalesce(s.refund_amount,s.amount),'creator_amount_reserved',v_creator_amount
  );
end;
$$;

revoke all on function public.prepare_fans_live_refund_system(uuid) from public,anon,authenticated;
grant execute on function public.prepare_fans_live_refund_system(uuid) to service_role;
