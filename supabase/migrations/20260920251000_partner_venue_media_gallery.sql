create table if not exists public.partner_venue_media (
 id uuid primary key default gen_random_uuid(),
 venue_id uuid not null references public.partner_venues(id) on delete cascade,
 owner_user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null default 'image' check (kind in ('image','video')),
 storage_bucket text not null default 'pecatho-media',
 storage_path text not null unique,
 original_filename text,
 mime_type text,
 size_bytes bigint,
 moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected')),
 rejection_reason text,
 is_primary boolean not null default false,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists partner_venue_media_venue_idx on public.partner_venue_media(venue_id,sort_order);
create index if not exists partner_venue_media_owner_idx on public.partner_venue_media(owner_user_id);
create unique index if not exists partner_venue_media_primary_idx on public.partner_venue_media(venue_id) where is_primary=true;
alter table public.partner_venue_media enable row level security;
drop policy if exists partner_venue_media_owner_select on public.partner_venue_media;
create policy partner_venue_media_owner_select on public.partner_venue_media for select to authenticated using (owner_user_id=auth.uid());
drop policy if exists partner_venue_media_owner_insert on public.partner_venue_media;
create policy partner_venue_media_owner_insert on public.partner_venue_media for insert to authenticated with check (owner_user_id=auth.uid() and exists(select 1 from public.partner_venues v where v.id=venue_id and v.owner_user_id=auth.uid() and v.status in ('draft','rejected','paused','published')));
drop policy if exists partner_venue_media_owner_update on public.partner_venue_media;
create policy partner_venue_media_owner_update on public.partner_venue_media for update to authenticated using (owner_user_id=auth.uid()) with check (owner_user_id=auth.uid());
drop policy if exists partner_venue_media_owner_delete on public.partner_venue_media;
create policy partner_venue_media_owner_delete on public.partner_venue_media for delete to authenticated using (owner_user_id=auth.uid());
drop policy if exists partner_venue_media_public_select on public.partner_venue_media;
create policy partner_venue_media_public_select on public.partner_venue_media for select to anon,authenticated using (moderation_status='approved' and exists(select 1 from public.partner_venues v where v.id=venue_id and v.status='published'));
create or replace function public.update_partner_venue_media_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists partner_venue_media_updated_at on public.partner_venue_media;
create trigger partner_venue_media_updated_at before update on public.partner_venue_media for each row execute function public.update_partner_venue_media_updated_at();
create or replace function private.admin_moderate_partner_venue_media(p_media_id uuid,p_action text,p_reason text default null)
returns public.partner_venue_media language plpgsql security definer set search_path=public,private as $$
declare result public.partner_venue_media;
begin
 if not private.is_staff() then raise exception 'Acesso administrativo não autorizado'; end if;
 if p_action not in ('approve','reject','delete') then raise exception 'Ação de moderação inválida'; end if;
 if p_action='delete' then delete from public.partner_venue_media where id=p_media_id returning * into result;
 elsif p_action='approve' then update public.partner_venue_media set moderation_status='approved',rejection_reason=null where id=p_media_id returning * into result;
 else update public.partner_venue_media set moderation_status='rejected',rejection_reason=nullif(btrim(coalesce(p_reason,'')),'') where id=p_media_id returning * into result;
 end if;
 if result.id is null then raise exception 'Mídia não encontrada'; end if;
 return result;
end $$;
revoke all on function private.admin_moderate_partner_venue_media(uuid,text,text) from public;
create or replace function public.admin_moderate_partner_venue_media(p_media_id uuid,p_action text,p_reason text default null)
returns public.partner_venue_media language sql security invoker set search_path=public as $$ select private.admin_moderate_partner_venue_media(p_media_id,p_action,p_reason); $$;
revoke all on function public.admin_moderate_partner_venue_media(uuid,text,text) from public;
grant execute on function public.admin_moderate_partner_venue_media(uuid,text,text) to authenticated;
