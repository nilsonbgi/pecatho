-- Pecatho: public gallery visibility is an explicit owner choice.
-- Existing approved partner media stays visible to avoid silently removing already-published material.
alter table public.partner_venue_media
  add column if not exists is_public boolean not null default false;

update public.partner_venue_media m
set is_public = true
from public.partner_venues v
where v.id = m.venue_id
  and v.status = 'published'
  and m.moderation_status = 'approved'
  and m.is_public = false;

create or replace function private.get_public_profile_media(p_profile_ids uuid[])
returns table(
  id uuid,
  profile_id uuid,
  storage_bucket text,
  storage_path text,
  preview_storage_bucket text,
  preview_storage_path text,
  kind text,
  access_type text,
  price numeric,
  currency text,
  width integer,
  height integer,
  is_primary boolean,
  is_featured boolean,
  show_in_cards boolean,
  show_in_gallery boolean,
  sort_order integer,
  moderation_status text,
  is_public boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    m.id,
    m.profile_id,
    m.storage_bucket,
    m.storage_path,
    m.preview_storage_bucket,
    m.preview_storage_path,
    m.kind::text,
    m.access_type::text,
    m.price,
    m.currency,
    m.width,
    m.height,
    m.is_primary,
    m.is_featured,
    m.show_in_cards,
    m.show_in_gallery,
    m.sort_order,
    m.moderation_status::text,
    m.is_public
  from public.profile_media m
  join public.advertiser_profiles p on p.id = m.profile_id
  where m.profile_id = any(coalesce(p_profile_ids, array[]::uuid[]))
    and p.status = 'published'
    and m.moderation_status = 'approved'
    and m.access_type = 'public'
    and m.is_public = true
    and m.show_in_gallery = true;
$$;

revoke all on function private.get_public_profile_media(uuid[]) from public, anon, authenticated;

create or replace function public.get_public_profile_media(p_profile_ids uuid[])
returns table(
  id uuid,
  profile_id uuid,
  storage_bucket text,
  storage_path text,
  preview_storage_bucket text,
  preview_storage_path text,
  kind text,
  access_type text,
  price numeric,
  currency text,
  width integer,
  height integer,
  is_primary boolean,
  is_featured boolean,
  show_in_cards boolean,
  show_in_gallery boolean,
  sort_order integer,
  moderation_status text,
  is_public boolean
)
language sql
security invoker
set search_path = ''
stable
as $$
  select * from private.get_public_profile_media(p_profile_ids);
$$;

revoke all on function public.get_public_profile_media(uuid[]) from public;
grant execute on function public.get_public_profile_media(uuid[]) to anon, authenticated;

create or replace function private.get_public_partner_venue_media(p_venue_id uuid)
returns table(
  id uuid,
  kind text,
  preview_storage_bucket text,
  preview_storage_path text,
  original_filename text,
  is_primary boolean,
  sort_order integer,
  width integer,
  height integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    m.id,
    m.kind,
    m.preview_storage_bucket,
    m.preview_storage_path,
    m.original_filename,
    m.is_primary,
    m.sort_order,
    m.width,
    m.height
  from public.partner_venue_media m
  join public.partner_venues v on v.id = m.venue_id
  where m.venue_id = p_venue_id
    and v.status = 'published'
    and m.moderation_status = 'approved'
    and m.is_public = true
  order by m.is_primary desc, m.sort_order, m.created_at;
$$;

revoke all on function private.get_public_partner_venue_media(uuid) from public, anon, authenticated;

create or replace function public.get_public_partner_venue_media(p_venue_id uuid)
returns table(
  id uuid,
  kind text,
  preview_storage_bucket text,
  preview_storage_path text,
  original_filename text,
  is_primary boolean,
  sort_order integer,
  width integer,
  height integer
)
language sql
security invoker
set search_path = ''
stable
as $$
  select * from private.get_public_partner_venue_media(p_venue_id);
$$;

revoke all on function public.get_public_partner_venue_media(uuid) from public;
grant execute on function public.get_public_partner_venue_media(uuid) to anon, authenticated;

create or replace function public.set_partner_venue_media_public(p_media_id uuid, p_is_public boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media public.partner_venue_media%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select m.*
    into v_media
    from public.partner_venue_media m
    join public.partner_venues v on v.id = m.venue_id
   where m.id = p_media_id
     and v.owner_user_id = auth.uid()
   for update of m;

  if not found then
    raise exception 'MEDIA_NOT_FOUND';
  end if;

  if p_is_public and v_media.moderation_status <> 'approved' then
    raise exception 'MEDIA_NOT_APPROVED';
  end if;

  update public.partner_venue_media
     set is_public = coalesce(p_is_public, false)
   where id = v_media.id;

  return true;
end;
$$;

revoke all on function public.set_partner_venue_media_public(uuid, boolean) from public, anon;
grant execute on function public.set_partner_venue_media_public(uuid, boolean) to authenticated;
