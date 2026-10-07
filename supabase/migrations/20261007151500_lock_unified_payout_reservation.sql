create or replace function private.request_fans_payout(p_creator_id uuid,p_amount numeric,p_idempotency_key text)
returns table(payout_id uuid, amount numeric, currency character, status text, available_before numeric, available_after numeric)
language plpgsql security definer set search_path to public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_creator public.fans_creators%rowtype;
  v_locked_user_id uuid;
  v_available numeric;
begin
  if v_user_id is null then raise exception 'Não autenticado'; end if;
  if p_creator_id is null then raise exception 'Criador inválido'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'O valor do recebimento deve ser maior que zero'; end if;
  if p_amount <> round(p_amount, 2) then raise exception 'O valor do recebimento deve ter no máximo duas casas decimais'; end if;
  if nullif(trim(coalesce(p_idempotency_key,'')), '') is null then raise exception 'Chave de idempotência obrigatória'; end if;
  if length(trim(p_idempotency_key)) > 120 then raise exception 'Chave de idempotência inválida'; end if;
  select * into v_creator from public.fans_creators where id=p_creator_id and user_id=v_user_id and status='active' for update;
  if not found then raise exception 'Criador não autorizado'; end if;
  select id into v_locked_user_id from public.profiles where id=v_user_id for update;
  if v_locked_user_id is null then raise exception 'Perfil não encontrado'; end if;
  select fpr.id,fpr.amount,fpr.currency,fpr.status into payout_id,amount,currency,status from public.fans_payout_requests fpr where fpr.creator_id=p_creator_id and fpr.idempotency_key=trim(p_idempotency_key) limit 1;
  if payout_id is not null then
    v_available := private.fans_payout_available(p_creator_id);
    return query select payout_id,amount,currency,status,v_available+amount,v_available;
    return;
  end if;
  v_available := private.fans_payout_available(p_creator_id);
  if p_amount < 50 then raise exception 'O valor mínimo para recebimento é R$ 50,00'; end if;
  if p_amount > v_available then raise exception 'Saldo disponível insuficiente'; end if;
  insert into public.fans_payout_requests(creator_id,amount,currency,status,idempotency_key) values(p_creator_id,round(p_amount,2),'BRL','requested',trim(p_idempotency_key))
  returning id,fans_payout_requests.amount,fans_payout_requests.currency,fans_payout_requests.status into payout_id,amount,currency,status;
  return query select payout_id,amount,currency,status,v_available,v_available-amount;
exception
  when unique_violation then
    select fpr.id,fpr.amount,fpr.currency,fpr.status into payout_id,amount,currency,status from public.fans_payout_requests fpr where fpr.creator_id=p_creator_id and fpr.idempotency_key=trim(p_idempotency_key) limit 1;
    if payout_id is null then raise; end if;
    v_available := private.fans_payout_available(p_creator_id);
    return query select payout_id,amount,currency,status,v_available+amount,v_available;
end;
$$;