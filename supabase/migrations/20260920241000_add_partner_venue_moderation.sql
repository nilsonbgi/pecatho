create or replace function private.admin_moderate_partner_venue(p_venue_id uuid,p_action text,p_reason text default null)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public','private' as $$
declare v public.partner_venues%rowtype; v_status text;
begin
 if auth.uid() is null or not private.is_staff() then raise exception 'STAFF_REQUIRED'; end if;
 if p_action not in ('publish','reject','pause','draft') then raise exception 'INVALID_ACTION'; end if;
 select * into v from public.partner_venues where id=p_venue_id for update;
 if not found then raise exception 'PARTNER_VENUE_NOT_FOUND'; end if;
 v_status:=case p_action when 'publish' then 'published' when 'reject' then 'rejected' when 'pause' then 'paused' else 'draft' end;
 update public.partner_venues set status=v_status,rejection_reason=case when p_action='reject' then nullif(trim(coalesce(p_reason,'')),'') else null end,updated_at=now() where id=v.id;
 return jsonb_build_object('ok',true,'venue_id',v.id,'status',v_status);
end $$;
create or replace function public.admin_moderate_partner_venue(p_venue_id uuid,p_action text,p_reason text default null)
returns jsonb language sql security definer set search_path='public','private' as $$ select private.admin_moderate_partner_venue(p_venue_id,p_action,p_reason); $$;
revoke all on function public.admin_moderate_partner_venue(uuid,text,text) from public;
grant execute on function public.admin_moderate_partner_venue(uuid,text,text) to authenticated;