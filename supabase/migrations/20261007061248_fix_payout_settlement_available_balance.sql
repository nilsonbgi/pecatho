CREATE OR REPLACE FUNCTION private.admin_fans_payout_action(
  p_payout_id uuid,
  p_action text,
  p_provider text DEFAULT NULL::text,
  p_provider_reference text DEFAULT NULL::text,
  p_reason text DEFAULT NULL::text
)
RETURNS public.fans_payout_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_payout public.fans_payout_requests%rowtype;
  v_new_status text;
  v_actor uuid := auth.uid();
  v_balance numeric;
  v_user_id uuid;
  v_entry_id uuid;
  v_locked_user_id uuid;
begin
  if v_actor is null or not coalesce(private.is_staff(), false) then raise exception 'Não autorizado'; end if;

  select * into v_payout
    from public.fans_payout_requests
   where id = p_payout_id
   for update;

  if not found then raise exception 'Solicitação de recebimento não encontrada'; end if;
  if p_action not in ('approve','reject','start','pay','fail','cancel') then raise exception 'Ação inválida'; end if;
  if p_action='approve' and v_payout.status<>'requested' then raise exception 'Somente solicitações solicitadas podem ser aprovadas'; end if;
  if p_action='reject' and v_payout.status not in ('requested','approved') then raise exception 'Esta solicitação não pode ser rejeitada neste estado'; end if;
  if p_action='start' and v_payout.status not in ('approved','failed') then raise exception 'Somente solicitações aprovadas ou com falha podem entrar em processamento'; end if;
  if p_action='pay' and v_payout.status<>'processing' then raise exception 'Somente solicitações em processamento podem ser pagas'; end if;
  if p_action='fail' and v_payout.status<>'processing' then raise exception 'Somente solicitações em processamento podem ser marcadas como falha'; end if;
  if p_action='cancel' and v_payout.status not in ('requested','approved') then raise exception 'Esta solicitação não pode ser cancelada neste estado'; end if;
  if p_action in ('reject','fail','cancel') and nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'Informe o motivo da decisão'; end if;

  v_new_status := case p_action
    when 'approve' then 'approved'
    when 'reject' then 'rejected'
    when 'start' then 'processing'
    when 'pay' then 'paid'
    when 'fail' then 'failed'
    when 'cancel' then 'cancelled'
  end;

  if v_payout.seller_user_id is not null then
    v_user_id := v_payout.seller_user_id;
  else
    select user_id into v_user_id
      from public.fans_creators
     where id = v_payout.creator_id
     for update;
    if v_user_id is null then raise exception 'Criador não encontrado'; end if;
  end if;

  if p_action='pay' then
    if nullif(trim(coalesce(p_provider,'')),'') is null
       or nullif(trim(coalesce(p_provider_reference,'')),'') is null
    then
      raise exception 'Informe provedor e referência do pagamento';
    end if;

    if v_payout.seller_user_id is not null then
      select id into v_locked_user_id
        from public.profiles
       where id = v_user_id
       for update;

      if v_locked_user_id is null then raise exception 'Perfil do vendedor não encontrado'; end if;

      -- The available-balance function already subtracts outstanding requests,
      -- including this payout. Add this request back before validating settlement.
      v_balance := private.seller_payout_available(v_user_id) + v_payout.amount;

      if v_balance < v_payout.amount then raise exception 'Saldo disponível insuficiente para liquidar este recebimento'; end if;
      if exists(
        select 1
          from public.ledger_entries
         where idempotency_key = 'seller-payout:' || v_payout.id
      ) then
        raise exception 'Recebimento já contabilizado';
      end if;

      insert into public.ledger_entries(
        user_id, entry_type, amount, currency, description, idempotency_key, metadata
      )
      values(
        v_user_id, 'payout', v_payout.amount, 'BRL',
        'Recebimento de saldo Pecatho',
        'seller-payout:' || v_payout.id,
        jsonb_build_object(
          'payout_id', v_payout.id,
          'provider', trim(p_provider),
          'provider_reference', trim(p_provider_reference),
          'processed_by', v_actor
        )
      )
      returning id into v_entry_id;
    else
      -- The available-balance function already subtracts outstanding requests,
      -- including this payout. Add this request back before validating settlement.
      v_balance := private.fans_payout_available(v_payout.creator_id) + v_payout.amount;

      if v_balance < v_payout.amount then raise exception 'Saldo disponível insuficiente para liquidar este recebimento'; end if;
      if exists(
        select 1
          from public.fans_financial_ledger
         where provider = trim(p_provider)
           and provider_reference = trim(p_provider_reference)
           and status = 'posted'
      ) then
        raise exception 'A referência do provedor já foi utilizada';
      end if;

      insert into public.fans_financial_ledger(
        creator_id, entry_type, direction, amount, currency, status,
        provider, provider_reference, metadata, occurred_at
      )
      values(
        v_payout.creator_id, 'payout', 'debit', v_payout.amount, 'BRL', 'posted',
        trim(p_provider), trim(p_provider_reference),
        jsonb_build_object('payout_id', v_payout.id, 'processed_by', v_actor),
        now()
      )
      returning id into v_entry_id;
    end if;
  end if;

  update public.fans_payout_requests
     set status = v_new_status,
         provider = case when p_action='pay' then trim(p_provider) else provider end,
         provider_reference = case when p_action='pay' then trim(p_provider_reference) else provider_reference end,
         rejection_reason = case when p_action in ('reject','fail','cancel') then trim(p_reason) else null end,
         processed_at = case when p_action='pay' then coalesce(processed_at, now()) else null end
   where id = v_payout.id
  returning * into v_payout;

  insert into public.audit_events(actor_user_id, action, entity_type, entity_id, metadata)
  values(
    v_actor,
    'fans_payout_' || v_new_status,
    'fans_payout_request',
    v_payout.id::text,
    jsonb_build_object(
      'payout_id', v_payout.id,
      'creator_id', v_payout.creator_id,
      'seller_user_id', v_payout.seller_user_id,
      'amount', v_payout.amount,
      'reason', nullif(trim(coalesce(p_reason,'')), ''),
      'provider', nullif(trim(coalesce(p_provider,'')), ''),
      'provider_reference', nullif(trim(coalesce(p_provider_reference,'')), ''),
      'ledger_entry_id', v_entry_id
    )
  );

  perform public.enqueue_fans_transaction_notification(
    v_user_id,
    case v_new_status
      when 'paid' then 'payout_paid'
      when 'rejected' then 'payout_rejected'
      when 'failed' then 'payout_failed'
      when 'cancelled' then 'payout_cancelled'
      when 'approved' then 'payout_approved'
      when 'processing' then 'payout_processing'
      else 'payout_update'
    end,
    case v_new_status
      when 'paid' then 'Recebimento pago'
      when 'rejected' then 'Recebimento rejeitado'
      when 'failed' then 'Falha no recebimento'
      when 'cancelled' then 'Recebimento cancelado'
      when 'approved' then 'Recebimento aprovado'
      when 'processing' then 'Recebimento em processamento'
      else 'Atualização do recebimento'
    end,
    case v_new_status
      when 'paid' then 'Seu recebimento de R$ ' || to_char(v_payout.amount,'FM999999990D00') || ' foi marcado como pago.'
      when 'rejected' then 'Seu recebimento foi rejeitado: ' || coalesce(v_payout.rejection_reason,'motivo não informado') || '.'
      when 'failed' then 'O processamento do seu recebimento falhou: ' || coalesce(v_payout.rejection_reason,'consulte o financeiro') || '.'
      when 'cancelled' then 'Seu recebimento foi cancelado: ' || coalesce(v_payout.rejection_reason,'motivo não informado') || '.'
      when 'approved' then 'Seu recebimento foi aprovado e seguirá para processamento.'
      when 'processing' then 'Seu recebimento entrou em processamento.'
      else 'Seu recebimento foi atualizado.'
    end,
    jsonb_build_object(
      'payout_id', v_payout.id,
      'status', v_new_status,
      'amount', v_payout.amount,
      'provider', v_payout.provider,
      'provider_reference', v_payout.provider_reference
    ),
    'payout:' || v_payout.id || ':' || v_new_status
  );

  return v_payout;
end;
$function$;
