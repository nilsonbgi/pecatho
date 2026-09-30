-- Generalize the existing Fans payout request table so advertiser sellers
-- can use the same payout lifecycle and ledger instead of a parallel system.

alter table public.fans_payout_requests add column if not exists seller_user_id uuid;
alter table public.fans_payout_requests alter column creator_id drop not null;
do $ begin
  if not exists (select 1 from pg_constraint where conname='fans_payout_requests_owner_check' and conrelid='public.fans_payout_requests'::regclass) then
    alter table public.fans_payout_requests add constraint fans_payout_requests_owner_check
      check ((creator_id is not null) <> (seller_user_id is not null));
  end if;
end $;
create index if not exists fans_payout_seller_user_idx
  on public.fans_payout_requests(seller_user_id, requested_at desc);
create index if not exists fans_payout_seller_outstanding_idx
  on public.fans_payout_requests(seller_user_id,status,requested_at desc)
  where status in ('requested','approved','processing');

create or replace function private.seller_payout_available(p_user_id uuid)
returns numeric language sql stable security definer
set search_path to pg_catalog,public,private as $$
  select greatest(
    coalesce((select sum(case when entry_type in ('credit','adjustment') then amount else -amount end)
      from public.ledger_entries where user_id=p_user_id),0)
    - coalesce((select sum(amount) from public.fans_payout_requests
      where seller_user_id=p_user_id and status in ('requested','approved','processing')),0),
    0
  );
$$;

create or replace function private.request_seller_payout(p_amount numeric,p_idempotency_key text)
returns table(payout_id uuid,amount numeric,currency character,status text,available_before numeric,available_after numeric)
language plpgsql security definer set search_path to public,private as $$
declare v_user_id uuid:=auth.uid(); v_available numeric; v_existing public.fans_payout_requests%rowtype;
begin
 if v_user_id is null then raise exception 'Não autenticado'; end if;
 if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) then raise exception 'Valor de recebimento inválido'; end if;
 if nullif(trim(coalesce(p_idempotency_key,'')),'') is null or length(trim(p_idempotency_key))>120 then raise exception 'Chave de idempotência inválida'; end if;
 select * into v_existing from public.fans_payout_requests where seller_user_id=v_user_id and idempotency_key=trim(p_idempotency_key) limit 1;
 if v_existing.id is not null then
   v_available:=private.seller_payout_available(v_user_id);
   return query select v_existing.id,v_existing.amount,v_existing.currency,v_existing.status,v_available+v_existing.amount,v_available; return;
 end if;
 v_available:=private.seller_payout_available(v_user_id);
 if p_amount<20 then raise exception 'O valor mínimo para recebimento é R$ 20,00'; end if;
 if p_amount>v_available then raise exception 'Saldo disponível insuficiente'; end if;
 insert into public.fans_payout_requests(seller_user_id,amount,currency,status,idempotency_key)
 values(v_user_id,round(p_amount,2),'BRL','requested',trim(p_idempotency_key))
 returning id, fans_payout_requests.amount, fans_payout_requests.currency, fans_payout_requests.status
 into payout_id,amount,currency,status;
 return query select payout_id,amount,currency,status,v_available,v_available-amount;
end; $$;

create or replace function private.admin_fans_payout_action(p_payout_id uuid,p_action text,p_provider text default null,p_provider_reference text default null,p_reason text default null)
returns public.fans_payout_requests language plpgsql security definer
set search_path to pg_catalog,public,private as $$
declare
 v_payout public.fans_payout_requests%rowtype; v_new_status text; v_actor uuid:=auth.uid();
 v_balance numeric; v_user_id uuid; v_entry_id uuid;
begin
 if v_actor is null or not coalesce(private.is_staff(),false) then raise exception 'Não autorizado'; end if;
 select * into v_payout from public.fans_payout_requests where id=p_payout_id for update;
 if not found then raise exception 'Solicitação de recebimento não encontrada'; end if;
 if p_action not in ('approve','reject','start','pay','fail','cancel') then raise exception 'Ação inválida'; end if;
 if p_action='approve' and v_payout.status<>'requested' then raise exception 'Somente solicitações solicitadas podem ser aprovadas'; end if;
 if p_action='reject' and v_payout.status not in ('requested','approved') then raise exception 'Esta solicitação não pode ser rejeitada neste estado'; end if;
 if p_action='start' and v_payout.status not in ('approved','failed') then raise exception 'Somente solicitações aprovadas ou com falha podem entrar em processamento'; end if;
 if p_action='pay' and v_payout.status<>'processing' then raise exception 'Somente solicitações em processamento podem ser pagas'; end if;
 if p_action='fail' and v_payout.status<>'processing' then raise exception 'Somente solicitações em processamento podem ser marcadas como falha'; end if;
 if p_action='cancel' and v_payout.status not in ('requested','approved') then raise exception 'Esta solicitação não pode ser cancelada neste estado'; end if;
 v_new_status:=case p_action when 'approve' then 'approved' when 'reject' then 'rejected' when 'start' then 'processing' when 'pay' then 'paid' when 'fail' then 'failed' when 'cancel' then 'cancelled' end;
 if p_action='pay' then
   if nullif(trim(coalesce(p_provider,'')),'') is null or nullif(trim(coalesce(p_provider_reference,'')),'') is null then raise exception 'Informe provedor e referência do pagamento'; end if;
   if v_payout.seller_user_id is not null then
     v_user_id:=v_payout.seller_user_id;
     v_balance:=private.seller_payout_available(v_user_id)+v_payout.amount;
     if v_balance<v_payout.amount then raise exception 'Saldo disponível insuficiente para liquidar este recebimento'; end if;
     if exists(select 1 from public.ledger_entries where idempotency_key='seller-payout:'||v_payout.id) then raise exception 'Recebimento já contabilizado'; end if;
     insert into public.ledger_entries(user_id,entry_type,amount,currency,description,idempotency_key,metadata)
     values(v_user_id,'payout',v_payout.amount,'BRL','Recebimento de saldo Pecatho','seller-payout:'||v_payout.id,
       jsonb_build_object('payout_id',v_payout.id,'provider',trim(p_provider),'provider_reference',trim(p_provider_reference),'processed_by',v_actor))
     returning id into v_entry_id;
   else
     select user_id into v_user_id from public.fans_creators where id=v_payout.creator_id for update;
     if v_user_id is null then raise exception 'Criador não encontrado'; end if;
     v_balance:=private.fans_payout_available(v_payout.creator_id)+v_payout.amount;
     if v_balance<v_payout.amount then raise exception 'Saldo disponível insuficiente para liquidar este recebimento'; end if;
     if exists(select 1 from public.fans_financial_ledger where provider=trim(p_provider) and provider_reference=trim(p_provider_reference) and status='posted') then raise exception 'A referência do provedor já foi utilizada'; end if;
     insert into public.fans_financial_ledger(creator_id,entry_type,direction,amount,currency,status,provider,provider_reference,metadata,occurred_at)
     values(v_payout.creator_id,'payout','debit',v_payout.amount,'BRL','posted',trim(p_provider),trim(p_provider_reference),
       jsonb_build_object('payout_id',v_payout.id,'processed_by',v_actor),now())
     returning id into v_entry_id;
   end if;
 end if;
 if p_action in ('reject','fail','cancel') and nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'Informe o motivo da decisão'; end if;
 update public.fans_payout_requests
 set status=v_new_status,
     provider=case when p_action='pay' then trim(p_provider) else provider end,
     provider_reference=case when p_action='pay' then trim(p_provider_reference) else provider_reference end,
     rejection_reason=case when p_action in ('reject','fail','cancel') then trim(p_reason) else null end,
     processed_at=case when p_action='pay' then coalesce(processed_at,now()) else null end
 where id=v_payout.id returning * into v_payout;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,metadata)
 values(v_actor,'fans_payout_'||v_new_status,'fans_payout_request',v_payout.id::text,
   jsonb_build_object('payout_id',v_payout.id,'creator_id',v_payout.creator_id,'seller_user_id',v_payout.seller_user_id,
   'amount',v_payout.amount,'reason',nullif(trim(coalesce(p_reason,'')),''),
   'provider',nullif(trim(coalesce(p_provider,'')),''),'provider_reference',nullif(trim(coalesce(p_provider_reference,'')),''),
   'ledger_entry_id',v_entry_id));
 return v_payout;
end; $$;