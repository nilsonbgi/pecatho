begin;

create or replace function public.mark_fans_live_refund_failed(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path=pg_catalog,public
as $function$
begin
  update public.fans_live_sessions
     set refund_status='failed',
         updated_at=now()
   where id=p_session_id
     and status='completed'
     and refund_status='requested';
end;
$function$;

revoke all on function public.mark_fans_live_refund_failed(uuid) from public,anon,authenticated;

commit;