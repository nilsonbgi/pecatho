begin;

alter table public.fans_payout_requests
  add column if not exists idempotency_key text;

create unique index if not exists fans_payout_idempotency_uq
  on public.fans_payout_requests (creator_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists fans_payout_outstanding_idx
  on public.fans_payout_requests (creator_id, status, requested_at desc)
  where status in ('requested','approved','processing');

create or replace function private.guard_fans_payout_request()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  if tg_op = 'INSERT' and not coalesce(private.is_staff(), false) then
    new.status := 'requested'; new.provider := null; new.provider_reference := null;
    new.processed_at := null; new.rejection_reason := null; new.requested_at := now();
  end if;
  if tg_op = 'UPDATE' and not coalesce(private.is_staff(), false) then
    if new.creator_id is distinct from old.creator_id or new.amount is distinct from old.amount
      or new.currency is distinct from old.currency or new.status is distinct from old.status
      or new.provider is distinct from old.provider or new.provider_reference is distinct from old.provider_reference
      or new.processed_at is distinct from old.processed_at or new.rejection_reason is distinct from old.rejection_reason
      or new.requested_at is distinct from old.requested_at or new.idempotency_key is distinct from old.idempotency_key then
      raise exception 'Solicitação de recebimento não pode ser alterada pelo criador';
    end if;
  end if;
  if new.amount <= 0 then raise exception 'Valor de recebimento inválido'; end if;
  if upper(trim(new.currency)) <> 'BRL' then raise exception 'Moeda de recebimento não suportada'; end if;
  if new.status not in ('requested','approved','processing','paid','rejected','failed','cancelled') then raise exception 'Status de recebimento inválido'; end if;
  return new;
end; $$;

create or replace function private.request_fans_payout(p_creator_id uuid, p_amount numeric, p_idempotency_key text)
returns table (payout_id uuid, amount numeric, currency char(3), status text, available_before numeric, available_after numeric)
language plpgsql security definer set search_path = public, private as $$
declare
  v_user_id uuid := auth.uid(); v_creator public.fans_creators%rowtype; v_id uuid;
  v_available numeric; v_outstanding numeric; v_credits numeric; v_debits numeric; v_minimum numeric := 20.00;
begin
  if v_user_id is null then raise exception 'Não autenticado'; end if;
  if p_creator_id is null then raise exception 'Criador inválido'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount,2) then raise exception 'Valor de recebimento inválido'; end if;
  if nullif(trim(coalesce(p_idempotency_key,'')), '') is null or length(trim(p_idempotency_key)) > 120 then raise exception 'Chave de idempotência inválida'; end if;

  select * into v_creator from public.fans_creators where id=p_creator_id and user_id=v_user_id and status='active' for update;
  if not found then raise exception 'Criador não autorizado'; end if;

  select id,amount,currency,status into payout_id,amount,currency,status
    from public.fans_payout_requests where creator_id=p_creator_id and idempotency_key=trim(p_idempotency_key) limit 1;
  if payout_id is not null then
    select coalesce(sum(case when direction='credit' then amount else 0 end),0), coalesce(sum(case when direction='debit' then amount else 0 end),0)
      into v_credits,v_debits from public.fans_financial_ledger where creator_id=p_creator_id and status='posted';
    select coalesce(sum(amount),0) into v_outstanding from public.fans_payout_requests where creator_id=p_creator_id and status in ('requested','approved','processing');
    v_available:=greatest(v_credits-v_debits-v_outstanding,0);
    return query select payout_id,amount,currency,status,v_available+case when status in ('requested','approved','processing') then amount else 0 end,v_available;
    return;
  end if;

  select coalesce(sum(case when direction='credit' then amount else 0 end),0), coalesce(sum(case when direction='debit' then amount else 0 end),0)
    into v_credits,v_debits from public.fans_financial_ledger where creator_id=p_creator_id and status='posted';
  select coalesce(sum(amount),0) into v_outstanding from public.fans_payout_requests where creator_id=p_creator_id and status in ('requested','approved','processing');
  v_available:=greatest(v_credits-v_debits-v_outstanding,0);
  if p_amount < v_minimum then raise exception 'O valor mínimo para recebimento é R$ 20,00'; end if;
  if p_amount > v_available then raise exception 'Saldo disponível insuficiente'; end if;

  insert into public.fans_payout_requests(creator_id,amount,currency,status,idempotency_key)
    values(p_creator_id,round(p_amount,2),'BRL','requested',trim(p_idempotency_key))
    returning id,fans_payout_requests.amount,fans_payout_requests.currency,fans_payout_requests.status into payout_id,amount,currency,status;
  return query select payout_id,amount,currency,status,v_available,v_available-amount;
exception when unique_violation then
  select id,amount,currency,status into payout_id,amount,currency,status from public.fans_payout_requests where creator_id=p_creator_id and idempotency_key=trim(p_idempotency_key) limit 1;
  if payout_id is null then raise; end if;
  return query select payout_id,amount,currency,status,null::numeric,null::numeric;
end; $$;

create or replace function public.request_fans_payout(p_creator_id uuid,p_amount numeric,p_idempotency_key text)
returns table (payout_id uuid,amount numeric,currency char(3),status text,available_before numeric,available_after numeric)
language sql security definer set search_path=public,private as $$ select * from private.request_fans_payout(p_creator_id,p_amount,p_idempotency_key); $$;
revoke all on function public.request_fans_payout(uuid,numeric,text) from public,anon;
grant execute on function public.request_fans_payout(uuid,numeric,text) to authenticated;

commit;