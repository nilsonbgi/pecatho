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
  order by m.is_primary desc, m.sort_order, m.created_at;
$$;

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
as $$
  select * from private.get_public_partner_venue_media(p_venue_id);
$$;

revoke all on function private.get_public_partner_venue_media(uuid) from public, anon, authenticated;
revoke all on function public.get_public_partner_venue_media(uuid) from public, anon, authenticated;
grant execute on function public.get_public_partner_venue_media(uuid) to anon, authenticated;

drop policy if exists partner_venue_media_public_select on public.partner_venue_media;
