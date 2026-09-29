-- Reconcile the Fans financial summary with the unified seller ledger.
create or replace function public.fans_financial_summary(p_creator_id uuid)
returns table(credits numeric,debits numeric,outstanding_payouts numeric,available numeric)
language plpgsql stable security definer set search_path to pg_catalog,public,private as $$
declare v_user_id uuid:=auth.uid(); v_is_staff boolean:=coalesce(private.is_staff(),false); v_creator_user_id uuid;
begin
 select user_id into v_creator_user_id from public.fans_creators where id=p_creator_id;
 if not v_is_staff and (v_user_id is null or v_creator_user_id is distinct from v_user_id) then raise exception 'Não autorizado'; end if;
 return query
 select
   coalesce((select sum(amount) from public.fans_financial_ledger where creator_id=p_creator_id and status='posted' and direction='credit'),0)
   +coalesce((select sum(amount) from public.ledger_entries le where le.user_id=v_creator_user_id and le.entry_type in ('credit','adjustment')),0),
   coalesce((select sum(amount) from public.fans_financial_ledger where creator_id=p_creator_id and status='posted' and direction='debit'),0)
   +coalesce((select sum(amount) from public.ledger_entries le where le.user_id=v_creator_user_id and le.entry_type not in ('credit','adjustment')),0),
   coalesce((select sum(amount) from public.fans_payout_requests where creator_id=p_creator_id and status in ('requested','approved','processing')),0),
   private.fans_payout_available(p_creator_id);
end; $$;
