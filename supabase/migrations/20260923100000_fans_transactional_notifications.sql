begin;

alter table public.fans_notifications
  add column if not exists event_key text;

create unique index if not exists fans_notifications_event_key_uidx
  on public.fans_notifications (user_id, event_key)
  where event_key is not null;

create or replace function public.enqueue_fans_transaction_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb,
  p_event_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
begin
  if p_user_id is null then
    return null;
  end if;

  if p_event_key is null then
    insert into public.fans_notifications (user_id, type, title, body, data)
    values (p_user_id, p_type, p_title, p_body, coalesce(p_data, '{}'::jsonb))
    returning id into v_id;
  else
    insert into public.fans_notifications (user_id, type, title, body, data, event_key)
    values (p_user_id, p_type, p_title, p_body, coalesce(p_data, '{}'::jsonb), p_event_key)
    on conflict (user_id, event_key) where event_key is not null
    do nothing
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.enqueue_fans_transaction_notification(uuid,text,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.enqueue_fans_transaction_notification(uuid,text,text,text,jsonb,text) to service_role;

create or replace function public.notify_fans_live_session_transition()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_creator_user_id uuid;
  v_route text;
  v_data jsonb;
  v_event_key text;
  v_schedule_label text;
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

  v_route := case
    when new.conversation_id is null then '/painel/notificacoes'
    else '/painel/mensagens/' || new.conversation_id::text
  end;

  v_data := jsonb_build_object(
    'session_id', new.id,
    'conversation_id', new.conversation_id,
    'creator_id', new.creator_id,
    'buyer_user_id', new.buyer_user_id,
    'route', v_route
  );

  if old.status = 'pending_payment' and new.status = 'paid' then
    v_event_key := 'fans_live:' || new.id::text || ':payment_confirmed';

    perform public.enqueue_fans_transaction_notification(
      new.buyer_user_id,
      'fans_live_payment_confirmed',
      'Pagamento confirmado',
      'Seu pagamento da videochamada foi confirmado. Agora você pode solicitar o horário da sessão.',
      v_data,
      v_event_key || ':buyer'
    );

    perform public.enqueue_fans_transaction_notification(
      v_creator_user_id,
      'fans_live_payment_confirmed',
      'Nova videochamada paga',
      'Uma nova videochamada foi paga e está aguardando a solicitação de horário pelo comprador.',
      v_data,
      v_event_key || ':creator'
    );
  end if;

  if old.status = 'paid'
     and new.status = 'scheduled'
     and new.scheduled_for is not null
     and (old.scheduled_for is distinct from new.scheduled_for) then
    v_schedule_label := to_char(new.scheduled_for at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI');

    v_data := v_data || jsonb_build_object(
      'scheduled_for', new.scheduled_for,
      'schedule_status', new.status
    );

    v_event_key := 'fans_live:' || new.id::text || ':schedule_requested:' ||
      to_char(new.scheduled_for, 'YYYYMMDDHH24MISSMS');

    perform public.enqueue_fans_transaction_notification(
      v_creator_user_id,
      'fans_live_schedule_requested',
      'Horário solicitado',
      'O comprador solicitou a videochamada para ' || v_schedule_label || '. Confirme ou recuse o horário.',
      v_data,
      v_event_key || ':creator'
    );
  end if;

  if old.confirmed_at is null and new.confirmed_at is not null then
    v_data := v_data || jsonb_build_object(
      'scheduled_for', new.scheduled_for,
      'confirmed_at', new.confirmed_at,
      'schedule_status', new.status
    );

    v_event_key := 'fans_live:' || new.id::text || ':schedule_confirmed';

    perform public.enqueue_fans_transaction_notification(
      new.buyer_user_id,
      'fans_live_schedule_confirmed',
      'Horário confirmado',
      'O criador confirmou sua videochamada para ' ||
        to_char(new.scheduled_for at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') ||
        '. A sala ficará disponível 15 minutos antes do horário.',
      v_data,
      v_event_key || ':buyer'
    );
  end if;

  if old.status = 'scheduled'
     and new.status = 'paid'
     and old.rejection_reason is distinct from new.rejection_reason then
    v_data := v_data || jsonb_build_object(
      'scheduled_for', old.scheduled_for,
      'rejection_reason', new.rejection_reason,
      'schedule_status', new.status
    );

    v_event_key := 'fans_live:' || new.id::text || ':schedule_rejected';

    perform public.enqueue_fans_transaction_notification(
      new.buyer_user_id,
      'fans_live_schedule_rejected',
      'Horário recusado',
      case
        when new.rejection_reason is null then
          'O criador recusou o horário solicitado. Escolha outro horário para sua videochamada.'
        else
          'O criador recusou o horário solicitado. Motivo: ' || new.rejection_reason
      end,
      v_data,
      v_event_key || ':buyer'
    );
  end if;

  if old.status <> 'active' and new.status = 'active' then
    v_data := v_data || jsonb_build_object(
      'room_id', new.room_id,
      'scheduled_for', new.scheduled_for,
      'started_at', new.started_at,
      'schedule_status', new.status
    );

    v_event_key := 'fans_live:' || new.id::text || ':room_opened';

    perform public.enqueue_fans_transaction_notification(
      new.buyer_user_id,
      'fans_live_room_open',
      'Sala disponível',
      'A sala privada da sua videochamada está aberta. Entre agora para iniciar a sessão.',
      v_data,
      v_event_key || ':buyer'
    );

    perform public.enqueue_fans_transaction_notification(
      v_creator_user_id,
      'fans_live_room_open',
      'Sala disponível',
      'A sala privada da videochamada está aberta. Entre agora para iniciar a sessão.',
      v_data,
      v_event_key || ':creator'
    );
  end if;

  if old.status <> 'completed' and new.status = 'completed' then
    v_data := v_data || jsonb_build_object(
      'ended_at', new.ended_at,
      'schedule_status', new.status
    );

    v_event_key := 'fans_live:' || new.id::text || ':completed';

    perform public.enqueue_fans_transaction_notification(
      new.buyer_user_id,
      'fans_live_session_completed',
      'Videochamada encerrada',
      'Sua videochamada foi encerrada e registrada como concluída.',
      v_data,
      v_event_key || ':buyer'
    );

    perform public.enqueue_fans_transaction_notification(
      v_creator_user_id,
      'fans_live_session_completed',
      'Videochamada encerrada',
      'A videochamada foi encerrada e registrada como concluída.',
      v_data,
      v_event_key || ':creator'
    );
  end if;

  if old.status <> 'cancelled' and new.status = 'cancelled' then
    v_data := v_data || jsonb_build_object(
      'cancelled_at', new.cancelled_at,
      'schedule_status', new.status
    );

    v_event_key := 'fans_live:' || new.id::text || ':cancelled';

    perform public.enqueue_fans_transaction_notification(
      new.buyer_user_id,
      'fans_live_session_cancelled',
      'Videochamada cancelada',
      'A videochamada foi cancelada. Consulte os detalhes da transação na central de notificações.',
      v_data,
      v_event_key || ':buyer'
    );

    perform public.enqueue_fans_transaction_notification(
      v_creator_user_id,
      'fans_live_session_cancelled',
      'Videochamada cancelada',
      'A videochamada foi cancelada. Consulte os detalhes da transação na central de notificações.',
      v_data,
      v_event_key || ':creator'
    );
  end if;

  if old.status <> 'refunded' and new.status = 'refunded' then
    v_data := v_data || jsonb_build_object(
      'schedule_status', new.status,
      'refunded_at', new.updated_at
    );

    v_event_key := 'fans_live:' || new.id::text || ':refunded';

    perform public.enqueue_fans_transaction_notification(
      new.buyer_user_id,
      'fans_live_refunded',
      'Pagamento reembolsado',
      'O pagamento da videochamada foi reembolsado. Consulte os detalhes da transação.',
      v_data,
      v_event_key || ':buyer'
    );

    perform public.enqueue_fans_transaction_notification(
      v_creator_user_id,
      'fans_live_refunded',
      'Videochamada reembolsada',
      'O pagamento da videochamada foi reembolsado e não gera crédito para o criador.',
      v_data,
      v_event_key || ':creator'
    );
  end if;

  if old.status <> 'expired' and new.status = 'expired' then
    v_data := v_data || jsonb_build_object(
      'schedule_status', new.status
    );

    v_event_key := 'fans_live:' || new.id::text || ':expired';

    perform public.enqueue_fans_transaction_notification(
      new.buyer_user_id,
      'fans_live_session_expired',
      'Sessão expirada',
      'A janela operacional da videochamada expirou sem conclusão.',
      v_data,
      v_event_key || ':buyer'
    );

    perform public.enqueue_fans_transaction_notification(
      v_creator_user_id,
      'fans_live_session_expired',
      'Sessão expirada',
      'A janela operacional da videochamada expirou sem conclusão.',
      v_data,
      v_event_key || ':creator'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists fans_live_sessions_transaction_notifications on public.fans_live_sessions;
create trigger fans_live_sessions_transaction_notifications
after update on public.fans_live_sessions
for each row execute function public.notify_fans_live_session_transition();

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

  select s.conversation_id
    into v_conversation_id
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

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='fans_notifications'
  ) then
    alter publication supabase_realtime add table public.fans_notifications;
  end if;
end
$$;

commit;