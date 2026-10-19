-- Revoke the visibility benefit when the underlying gift is refunded or charged back.
-- The boost must not remain active after the supporting payment has been reversed.
create or replace function public.revoke_gift_creator_boost_on_reversal()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $function$
begin
  if old.status = 'paid' and new.status in ('refunded','chargeback') then
    update public.fans_boosts
       set status = 'cancelled'
     where order_id = new.order_id
       and status in ('active','pending');
  end if;
  return new;
end;
$function$;

drop trigger if exists pecatho_gift_revoke_creator_boost_on_reversal on public.pecatho_gifts;
create trigger pecatho_gift_revoke_creator_boost_on_reversal
after update of status on public.pecatho_gifts
for each row
when (old.status is distinct from new.status)
execute function public.revoke_gift_creator_boost_on_reversal();

revoke all on function public.revoke_gift_creator_boost_on_reversal() from public, anon, authenticated;
grant execute on function public.revoke_gift_creator_boost_on_reversal() to service_role;
