do $$
declare v_def text;
begin
  select pg_get_functiondef('public.create_partner_venue_lead(uuid,text,text,text,text,text,uuid,uuid)'::regprocedure) into v_def;
  v_def := replace(v_def,'public.create_partner_venue_lead','private.create_partner_venue_lead');
  execute v_def;
end $$;

alter function private.create_partner_venue_lead(uuid,text,text,text,text,text,uuid,uuid) security definer set search_path='';

revoke execute on function private.create_partner_venue_lead(uuid,text,text,text,text,text,uuid,uuid) from public;
revoke execute on function private.create_partner_venue_lead(uuid,text,text,text,text,text,uuid,uuid) from anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.create_partner_venue_lead(uuid,text,text,text,text,text,uuid,uuid) to anon, authenticated;

create or replace function public.create_partner_venue_lead(
  p_venue_id uuid,p_name text,p_email text default null,p_phone text default null,
  p_message text default null,p_source text default 'profile',p_service_id uuid default null,p_event_id uuid default null
)
returns uuid language sql security invoker set search_path=''
as $$
  select private.create_partner_venue_lead(p_venue_id,p_name,p_email,p_phone,p_message,p_source,p_service_id,p_event_id);
$$;

revoke execute on function public.create_partner_venue_lead(uuid,text,text,text,text,text,uuid,uuid) from public;
grant execute on function public.create_partner_venue_lead(uuid,text,text,text,text,text,uuid,uuid) to anon, authenticated;
