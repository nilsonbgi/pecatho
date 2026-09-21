create table if not exists public.partner_venue_leads (
 id uuid primary key default gen_random_uuid(),
 venue_id uuid not null references public.partner_venues(id) on delete cascade,
 visitor_user_id uuid references auth.users(id) on delete set null,
 name text not null,
 email text,
 phone text,
 message text,
 source text not null default 'profile' check (source in ('profile','service','event','whatsapp')),
 service_id uuid references public.partner_venue_services(id) on delete set null,
 event_id uuid references public.partner_venue_events(id) on delete set null,
 status text not null default 'new' check (status in ('new','contacted','closed','archived')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint partner_venue_leads_name_len check (char_length(trim(name)) between 2 and 120),
 constraint partner_venue_leads_email_len check (email is null or char_length(trim(email)) between 5 and 180),
 constraint partner_venue_leads_phone_len check (phone is null or char_length(trim(phone)) between 8 and 40),
 constraint partner_venue_leads_message_len check (message is null or char_length(trim(message)) between 5 and 2000)
);
create index if not exists partner_venue_leads_venue_created_idx on public.partner_venue_leads(venue_id,created_at desc);
create index if not exists partner_venue_leads_venue_status_idx on public.partner_venue_leads(venue_id,status);
create index if not exists partner_venue_leads_visitor_idx on public.partner_venue_leads(visitor_user_id);
drop trigger if exists touch_partner_venue_leads_updated_at on public.partner_venue_leads;
create trigger touch_partner_venue_leads_updated_at before update on public.partner_venue_leads for each row execute function public.touch_partner_commercial_updated_at();
alter table public.partner_venue_leads enable row level security;
drop policy if exists partner_venue_leads_owner_select on public.partner_venue_leads;
create policy partner_venue_leads_owner_select on public.partner_venue_leads for select to authenticated using (exists (select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid()));
drop policy if exists partner_venue_leads_owner_update on public.partner_venue_leads;
create policy partner_venue_leads_owner_update on public.partner_venue_leads for update to authenticated using (exists (select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid())) with check (exists (select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid()));
revoke insert, update, delete on public.partner_venue_leads from anon, authenticated;
create or replace function public.create_partner_venue_lead(
 p_venue_id uuid,p_name text,p_email text default null,p_phone text default null,p_message text default null,p_source text default 'profile',p_service_id uuid default null,p_event_id uuid default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_owner uuid; v_status text; v_source text:=coalesce(nullif(trim(p_source),'profile'),'profile');
begin
 if p_venue_id is null or nullif(trim(p_name),'') is null then raise exception 'Dados obrigatórios não informados'; end if;
 if char_length(trim(p_name)) not between 2 and 120 then raise exception 'Nome inválido'; end if;
 if p_email is not null and char_length(trim(p_email)) not between 5 and 180 then raise exception 'E-mail inválido'; end if;
 if p_phone is not null and char_length(trim(p_phone)) not between 8 and 40 then raise exception 'Telefone inválido'; end if;
 if p_message is not null and char_length(trim(p_message)) not between 5 and 2000 then raise exception 'Mensagem inválida'; end if;
 if v_source not in ('profile','service','event','whatsapp') then raise exception 'Origem inválida'; end if;
 select owner_user_id,status into v_owner,v_status from public.partner_venues where id=p_venue_id;
 if v_owner is null or v_status<>'published' then raise exception 'Parceiro não disponível'; end if;
 if p_service_id is not null and not exists(select 1 from public.partner_venue_services where id=p_service_id and venue_id=p_venue_id and active=true) then raise exception 'Serviço inválido'; end if;
 if p_event_id is not null and not exists(select 1 from public.partner_venue_events where id=p_event_id and venue_id=p_venue_id and status='published' and starts_at>=now()) then raise exception 'Evento inválido'; end if;
 if exists (select 1 from public.partner_venue_leads where venue_id=p_venue_id and created_at>now()-interval '10 minutes' and coalesce(nullif(lower(trim(email)),''),'')=coalesce(nullif(lower(trim(p_email)),''),'') and coalesce(nullif(regexp_replace(phone,'\\D','','g'),''),'')=coalesce(nullif(regexp_replace(p_phone,'\\D','','g'),'') ,'') and char_length(trim(p_name))=char_length(trim(name))) then raise exception 'Solicitação já registrada recentemente'; end if;
 insert into public.partner_venue_leads(venue_id,visitor_user_id,name,email,phone,message,source,service_id,event_id) values(p_venue_id,auth.uid(),trim(p_name),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_message),''),v_source,p_service_id,p_event_id) returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.create_partner_venue_lead(uuid,text,text,text,text,text,uuid,uuid) from public;
grant execute on function public.create_partner_venue_lead(uuid,text,text,text,text,text,uuid,uuid) to anon,authenticated;