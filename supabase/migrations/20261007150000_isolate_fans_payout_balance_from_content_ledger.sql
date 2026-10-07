-- Isolate Fans payout balances from the generic content-seller ledger.
-- A user may legitimately have both roles; each commercial balance must remain independent.

CREATE OR REPLACE FUNCTION private.fans_payout_available(p_creator_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO pg_catalog, public, private
AS $function$
  select greatest(
    coalesce((
      select sum(amount)
      from public.fans_financial_ledger
      where creator_id=p_creator_id
        and status='posted'
        and direction='credit'
    ),0)
    - coalesce((
      select sum(amount)
      from public.fans_financial_ledger
      where creator_id=p_creator_id
        and status='posted'
        and direction='debit'
    ),0)
    - coalesce((
      select sum(amount)
      from public.fans_payout_requests
      where creator_id=p_creator_id
        and status in ('requested','approved','processing')
    ),0),
    0
  )
$function$;

CREATE OR REPLACE FUNCTION private.request_fans_payout(
  p_creator_id uuid,
  p_amount numeric,
  p_idempotency_key text
)
RETURNS TABLE(
  payout_id uuid,
  amount numeric,
  currency character,
  status text,
  available_before numeric,
  available_after numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $function$
declare
  v_user_id uuid:=auth.uid();
  v_creator public.fans_creators%rowtype;
  v_available numeric;
  v_outstanding numeric;
  v_credits numeric;
  v_debits numeric;
begin
  if v_user_id is null then raise exception 'Não autenticado'; end if;
  if p_creator_id is null then raise exception 'Criador inválido'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'O valor do recebimento deve ser maior que zero'; end if;
  if p_amount<>round(p_amount,2) then raise exception 'O valor do recebimento deve ter no máximo duas casas decimais'; end if;
  if nullif(trim(coalesce(p_idempotency_key,'')),'') is null then raise exception 'Chave de idempotência obrigatória'; end if;
  if length(trim(p_idempotency_key))>120 then raise exception 'Chave de idempotência inválida'; end if;

  select * into v_creator
  from public.fans_creators
  where id=p_creator_id
    and user_id=v_user_id
    and status='active'
  for update;

  if not found then raise exception 'Criador não autorizado'; end if;

  select id,amount,currency,status
    into payout_id,amount,currency,status
  from public.fans_payout_requests
  where creator_id=p_creator_id
    and idempotency_key=trim(p_idempotency_key)
  limit 1;

  if payout_id is not null then
    select
      coalesce((
        select sum(amount)
        from public.fans_financial_ledger
        where creator_id=p_creator_id
          and status='posted'
          and direction='credit'
      ),0),
      coalesce((
        select sum(amount)
        from public.fans_financial_ledger
        where creator_id=p_creator_id
          and status='posted'
          and direction='debit'
      ),0)
    into v_credits,v_debits;

    select coalesce(sum(amount),0)
      into v_outstanding
    from public.fans_payout_requests
    where creator_id=p_creator_id
      and status in ('requested','approved','processing');

    v_available:=greatest(v_credits-v_debits-v_outstanding,0);

    return query
      select payout_id,amount,currency,status,v_available+amount,v_available;
    return;
  end if;

  select
    coalesce((
      select sum(amount)
      from public.fans_financial_ledger
      where creator_id=p_creator_id
        and status='posted'
        and direction='credit'
    ),0),
    coalesce((
      select sum(amount)
      from public.fans_financial_ledger
      where creator_id=p_creator_id
        and status='posted'
        and direction='debit'
    ),0)
  into v_credits,v_debits;

  select coalesce(sum(amount),0)
    into v_outstanding
  from public.fans_payout_requests
  where creator_id=p_creator_id
    and status in ('requested','approved','processing');

  v_available:=greatest(v_credits-v_debits-v_outstanding,0);

  if p_amount<50 then
    raise exception 'O valor mínimo para recebimento é R$ 50,00';
  end if;

  if p_amount>v_available then
    raise exception 'Saldo disponível insuficiente';
  end if;

  insert into public.fans_payout_requests(
    creator_id,amount,currency,status,idempotency_key
  )
  values(
    p_creator_id,round(p_amount,2),'BRL','requested',trim(p_idempotency_key)
  )
  returning id,fans_payout_requests.amount,fans_payout_requests.currency,
            fans_payout_requests.status
  into payout_id,amount,currency,status;

  return query
    select payout_id,amount,currency,status,v_available,v_available-amount;

exception when unique_violation then
  select id,amount,currency,status
    into payout_id,amount,currency,status
  from public.fans_payout_requests
  where creator_id=p_creator_id
    and idempotency_key=trim(p_idempotency_key)
  limit 1;

  if payout_id is null then raise; end if;

  return query
    select payout_id,amount,currency,status,null::numeric,null::numeric;
end;
$function$;

REVOKE ALL ON FUNCTION private.fans_payout_available(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.request_fans_payout(uuid,numeric,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.request_fans_payout(uuid,numeric,text) TO authenticated;