revoke insert on table public.fans_payout_requests from authenticated, anon, public;

drop policy if exists "fans_payout_owner_insert" on public.fans_payout_requests;

create or replace function private.admin_fans_payout_action(
  p_payout_id uuid,
  p_action text,
  p_provider text default null,
  p_provider_reference text default null,
  p_reason text default null
)
returns public.fans_payout_requests
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_payout public.fans_payout_requests%rowtype;
  v_new_status text;
  v_actor uuid := auth.uid();
  v_balance numeric;
  v_outstanding numeric;
  v_ledger_debits numeric;
  v_ledger_credits numeric;
  v_entry_id uuid;
begin
  if v_actor is null or not coalesce(private.is_staff(),false) then
    raise exception 'Não autorizado';
  end if;

  select * into v_payout
    from public.fans_payout_requests
   where id=p_payout_id
   for update;
  if not found then
    raise exception 'Solicitação de recebimento não encontrada';
  end if;

  if p_action not in ('approve','reject','start','pay','fail','cancel') then
    raise exception 'Ação inválida';
  end if;

  if p_action='approve' and v_payout.status <> 'requested' then
    raise exception 'Somente solicitações solicitadas podem ser aprovadas';
  end if;
  if p_action='reject' and v_payout.status not in ('requested','approved') then
    raise exception 'Esta solicitação não pode ser rejeitada neste estado';
  end if;
  if p_action='start' and v_payout.status not in ('approved','failed') then
    raise exception 'Somente solicitações aprovadas ou com falha podem entrar em processamento';
  end if;
  if p_action='pay' and v_payout.status <> 'processing' then
    raise exception 'Somente solicitações em processamento podem ser pagas';
  end if;
  if p_action='fail' and v_payout.status <> 'processing' then
    raise exception 'Somente solicitações em processamento podem ser marcadas como falha';
  end if;
  if p_action='cancel' and v_payout.status not in ('requested','approved') then
    raise exception 'Esta solicitação não pode ser cancelada neste estado';
  end if;

  v_new_status := case p_action
    when 'approve' then 'approved'
    when 'reject' then 'rejected'
    when 'start' then 'processing'
    when 'pay' then 'paid'
    when 'fail' then 'failed'
    when 'cancel' then 'cancelled'
  end;

  if p_action='pay' then
    if nullif(trim(coalesce(p_provider,'')),'') is null
       or nullif(trim(coalesce(p_provider_reference,'')),'') is null then
      raise exception 'Informe provedor e referência do pagamento';
    end if;

    perform 1
      from public.fans_creators
     where id=v_payout.creator_id
     for update;

    if not found then
      raise exception 'Criador não encontrado';
    end if;

    select coalesce(sum(case when direction='credit' then amount else 0 end),0),
           coalesce(sum(case when direction='debit' then amount else 0 end),0)
      into v_ledger_credits,v_ledger_debits
      from public.fans_financial_ledger
     where creator_id=v_payout.creator_id
       and status='posted';

    select coalesce(sum(amount),0)
      into v_outstanding
      from public.fans_payout_requests
     where creator_id=v_payout.creator_id
       and status in ('requested','approved','processing')
       and id<>v_payout.id;

    v_balance := greatest(v_ledger_credits-v_ledger_debits-v_outstanding,0);
    if v_balance < v_payout.amount then
      raise exception 'Saldo disponível insuficiente para liquidar este recebimento';
    end if;

    if exists (
      select 1 from public.fans_financial_ledger
       where provider=trim(p_provider)
         and provider_reference=trim(p_provider_reference)
         and status='posted'
    ) then
      raise exception 'A referência do provedor já foi utilizada';
    end if;

    insert into public.fans_financial_ledger(
      creator_id,entry_type,direction,amount,currency,status,provider,
      provider_reference,metadata,occurred_at
    ) values (
      v_payout.creator_id,'payout','debit',v_payout.amount,'BRL','posted',
      trim(p_provider),trim(p_provider_reference),
      jsonb_build_object('payout_id',v_payout.id,'processed_by',v_actor),now()
    ) returning id into v_entry_id;
  end if;

  if p_action in ('reject','fail','cancel')
     and nullif(trim(coalesce(p_reason,'')),'') is null then
    raise exception 'Informe o motivo da decisão';
  end if;

  update public.fans_payout_requests
     set status=v_new_status,
         provider=case when p_action='pay' then trim(p_provider) else provider end,
         provider_reference=case when p_action='pay' then trim(p_provider_reference) else provider_reference end,
         rejection_reason=case when p_action in ('reject','fail','cancel') then trim(p_reason) else null end,
         processed_at=case when p_action='pay' then coalesce(processed_at,now()) else null end
   where id=v_payout.id
  returning * into v_payout;

  insert into public.audit_events(actor_user_id,action,entity_type,entity_id,metadata)
  values(
    v_actor,'fans_payout_'||v_new_status,'fans_payout_request',v_payout.id::text,
    jsonb_build_object(
      'payout_id',v_payout.id,
      'creator_id',v_payout.creator_id,
      'amount',v_payout.amount,
      'reason',nullif(trim(coalesce(p_reason,'')),''),
      'provider',nullif(trim(coalesce(p_provider,'')),''),
      'provider_reference',nullif(trim(coalesce(p_provider_reference,'')),''),
      'ledger_entry_id',v_entry_id
    )
  );

  return v_payout;
end;
$$;

revoke all on function private.admin_fans_payout_action(uuid,text,text,text,text) from public, anon, authenticated;
revoke all on function public.admin_fans_payout_action(uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.admin_fans_payout_action(uuid,text,text,text,text) to authenticated;
