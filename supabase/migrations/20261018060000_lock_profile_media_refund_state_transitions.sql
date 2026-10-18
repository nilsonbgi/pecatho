-- Prevent terminal-state changes from creating a second reversal in profile-media settlement.
do $body$
declare
  v_definition text;
  v_old text := $$if v_payment.status in ('refunded','chargeback') and p_payment_status not in ('refunded','chargeback') then$$;
  v_new text := $$if v_payment.status in ('refunded','chargeback') and p_payment_status <> v_payment.status then$$;
begin
  select pg_get_functiondef('public.settle_profile_media_checkout(uuid,text,text,payment_status,text,numeric)'::regprocedure) into v_definition;
  if v_definition is null then raise exception 'settle_profile_media_checkout function not found'; end if;
  if position(v_old in v_definition) = 0 then raise exception 'Expected payment-state guard not found; migration aborted'; end if;
  execute replace(v_definition, v_old, v_new);
end;
$body$;