-- Partner moderation state guards
-- Keeps the administrative publication cycle explicit:
-- pending_review -> published/rejected
-- published -> paused
-- rejected/paused/pending_review -> draft

create or replace function private.admin_moderate_partner_venue(p_venue_id uuid, p_action text, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $function$
declare
  v public.partner_venues%rowtype;
  v_status text;
begin
  if auth.uid() is null or not private.is_staff() then
    raise exception 'STAFF_REQUIRED';
  end if;

  if p_action not in ('publish','reject','pause','draft') then
    raise exception 'INVALID_ACTION';
  end if;

  select * into v
  from public.partner_venues
  where id = p_venue_id
  for update;

  if not found then
    raise exception 'PARTNER_VENUE_NOT_FOUND';
  end if;

  if p_action = 'publish' then
    if v.status <> 'pending_review' then
      raise exception 'PARTNER_VENUE_NOT_PENDING_REVIEW';
    end if;
    if char_length(btrim(coalesce(v.name,''))) < 2 then
      raise exception 'PARTNER_VENUE_NAME_REQUIRED';
    end if;
    v_status := 'published';
  elsif p_action = 'reject' then
    if v.status <> 'pending_review' then
      raise exception 'PARTNER_VENUE_NOT_PENDING_REVIEW';
    end if;
    v_status := 'rejected';
  elsif p_action = 'pause' then
    if v.status <> 'published' then
      raise exception 'PARTNER_VENUE_NOT_PUBLISHED';
    end if;
    v_status := 'paused';
  else
    if v.status not in ('pending_review','rejected','paused') then
      raise exception 'PARTNER_VENUE_NOT_DRAFTABLE';
    end if;
    v_status := 'draft';
  end if;

  update public.partner_venues
  set status = v_status,
      rejection_reason = case
        when p_action = 'reject' then nullif(trim(coalesce(p_reason,'')),'')
        else null
      end,
      updated_at = now()
  where id = v.id;

  return jsonb_build_object('ok',true,'venue_id',v.id,'status',v_status);
end
$function$;