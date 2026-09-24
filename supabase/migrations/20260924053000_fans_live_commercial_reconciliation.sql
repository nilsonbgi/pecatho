create or replace function public.reconcile_fans_live_commercial_state(
  p_session_id uuid default null
)
returns table(
  scanned bigint,
  linked_order_count bigint,
  linked_payment_count bigint,
  refunded_state_count bigint,
  inferred_outcome_count bigint,
  unresolved_paid_count bigint,
  paid_without_ledger_count bigint
)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  r record;
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_scanned bigint := 0;
  v_linked_order bigint := 0;
  v_linked_payment bigint := 0;
  v_refunded bigint := 0;
  v_outcome bigint := 0;
  v_unresolved bigint := 0;
  v_ledger_missing bigint := 0;
  v_ledger_count bigint := 0;
begin
  for r in
    select s.*
      from public.fans_live_sessions s
     where p_session_id is null or s.id = p_session_id
     for update
  loop
    v_scanned := v_scanned + 1;

    if r.order_id is null and r.payment_id is not null then
      select o.*
        into v_order
        from public.orders o
        join public.payments p on p.order_id = o.id
       where p.id = r.payment_id
         and p.user_id = r.buyer_user_id
         and coalesce(o.metadata->>'product_type',o.metadata->>'kind') = 'live_call'
         and nullif(o.metadata->>'session_id','')::uuid = r.id
       order by o.created_at desc
       limit 1;

      if found then
        update public.fans_live_sessions
           set order_id = v_order.id,
               updated_at = now()
         where id = r.id
           and order_id is null;
        if found then
          v_linked_order := v_linked_order + 1;
        end if;
      end if;
    end if;

    if r.payment_id is null and r.order_id is not null then
      select p.*
        into v_payment
        from public.payments p
       where p.order_id = r.order_id
         and p.user_id = r.buyer_user_id
       order by
         case when p.status in ('paid','refunded','chargeback','partially_refunded') then 0 else 1 end,
         p.created_at desc
       limit 1;

      if found and v_payment.status in ('paid','refunded','chargeback','partially_refunded') then
        update public.fans_live_sessions
           set payment_id = v_payment.id,
               updated_at = now()
         where id = r.id
           and payment_id is null;
        if found then
          v_linked_payment := v_linked_payment + 1;
        end if;
      end if;
    end if;

    select p.*
      into v_payment
      from public.payments p
     where p.id = (select payment_id from public.fans_live_sessions where id=r.id);

    if found and v_payment.status in ('refunded','chargeback') then
      update public.fans_live_sessions
         set status = case
                       when status in ('pending_payment','paid','scheduled','active','completed') then 'refunded'
                       else status
                     end,
             refund_status = case
                       when refund_status <> 'failed' then 'refunded'
                       else refund_status
                     end,
             refund_amount = coalesce(refund_amount, amount),
             refund_processed_at = coalesce(refund_processed_at, now()),
             updated_at = now()
       where id = r.id
         and (
           status in ('pending_payment','paid','scheduled','active','completed')
           or (refund_status <> 'refunded' and refund_status <> 'failed')
         );
      if found then
        v_refunded := v_refunded + 1;
      end if;
    end if;

    update public.fans_live_sessions
       set commercial_outcome = ended_reason,
           updated_at = now()
     where id = r.id
       and status = 'completed'
       and commercial_outcome is null
       and ended_reason in (
         'creator_removed_participant','creator_ended_early',
         'creator_completed','buyer_left','system_expired'
       );

    if found then
      v_outcome := v_outcome + 1;
    end if;

    select count(*) into v_ledger_count
      from public.fans_financial_ledger l
     where l.order_id = (select order_id from public.fans_live_sessions where id=r.id)
       and l.entry_type = 'sale_gross'
       and l.status = 'posted';

    if (select paid_at from public.fans_live_sessions where id=r.id) is not null
       and (select order_id from public.fans_live_sessions where id=r.id) is null then
      v_unresolved := v_unresolved + 1;
    end if;

    if (select paid_at from public.fans_live_sessions where id=r.id) is not null
       and (select order_id from public.fans_live_sessions where id=r.id) is not null
       and v_ledger_count = 0 then
      v_ledger_missing := v_ledger_missing + 1;
    end if;
  end loop;

  scanned := v_scanned;
  linked_order_count := v_linked_order;
  linked_payment_count := v_linked_payment;
  refunded_state_count := v_refunded;
  inferred_outcome_count := v_outcome;
  unresolved_paid_count := v_unresolved;
  paid_without_ledger_count := v_ledger_missing;
  return next;
end;
$function$;

revoke all on function public.reconcile_fans_live_commercial_state(uuid) from public, anon, authenticated;
grant execute on function public.reconcile_fans_live_commercial_state(uuid) to service_role;