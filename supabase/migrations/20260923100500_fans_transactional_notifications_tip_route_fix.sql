begin;

create or replace function public.notify_fans_live_tip_transition()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_creator_user_id uuid;
  v_data jsonb;
  v_event_key text;
  v_conversation_id uuid;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  select fc.user_id into v_creator_user_id
  from public.fans_creators fc
  where fc.id = new.creator_id;

  if v_creator_user_id is null then
    return new;
  end if;

  select s.conversation_id into v_conversation_id
  from public.fans_live_sessions s
  where s.id = new.session_id;

  v_data := jsonb_build_object(
    'tip_id', new.id,
    'session_id', new.session_id,
    'order_id', new.order_id,
    'creator_id', new.creator_id,
    'buyer_user_id', new.buyer_user_id,
    'amount', new.amount,
    'currency', new.currency,
    'conversation_id', v_conversation_id,
    'route', case
      when v_conversation_id is not null then '/painel/mensagens/' || v_conversation_id::text
      else '/painel/notificacoes'
    end
  );

  if old.status <> 'paid' and new.status = 'paid' then
    v_event_key := 'fans_tip:' || new.id::text || ':paid';

    perform public.enqueue_fans_transaction_notification(
      new.buyer_user_id,
      'fans_tip_paid',
      'Gorjeta enviada',
      'Sua gorjeta foi confirmada e creditada ao criador.',
      v_data,
      v_event_key || ':buyer'
    );

    perform public.enqueue_fans_transaction_notification(
      v_creator_user_id,
      'fans_tip_received',
      'Gorjeta recebida',
      'Você recebeu uma gorjeta de R$ ' || to_char(new.amount, 'FM999G999G990D00') || '.',
      v_data,
      v_event_key || ':creator'
    );
  end if;

  if old.status <> 'refunded' and new.status = 'refunded' then
    v_event_key := 'fans_tip:' || new.id::text || ':refunded';

    perform public.enqueue_fans_transaction_notification(
      new.buyer_user_id,
      'fans_tip_refunded',
      'Gorjeta reembolsada',
      'O pagamento da gorjeta foi reembolsado.',
      v_data,
      v_event_key || ':buyer'
    );

    perform public.enqueue_fans_transaction_notification(
      v_creator_user_id,
      'fans_tip_refunded',
      'Gorjeta reembolsada',
      'Uma gorjeta recebida foi reembolsada e o respectivo crédito foi revertido.',
      v_data,
      v_event_key || ':creator'
    );
  end if;

  if old.status <> 'failed' and new.status = 'failed' then
    v_event_key := 'fans_tip:' || new.id::text || ':failed';

    perform public.enqueue_fans_transaction_notification(
      new.buyer_user_id,
      'fans_tip_failed',
      'Gorjeta não confirmada',
      'O pagamento da gorjeta não foi confirmado.',
      v_data,
      v_event_key || ':buyer'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists fans_tips_transaction_notifications on public.fans_tips;
create trigger fans_tips_transaction_notifications
after update on public.fans_tips
for each row execute function public.notify_fans_live_tip_transition();

commit;