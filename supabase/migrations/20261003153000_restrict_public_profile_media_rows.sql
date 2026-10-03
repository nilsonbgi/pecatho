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
    case when m.access_type = 'public' and m.is_public then m.storage_bucket else null end,
    case when m.access_type = 'public' and m.is_public then m.storage_path else null end,
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
    (m.access_type = 'public' and m.is_public)
  from public.profile_media m
  join public.advertiser_profiles p on p.id = m.profile_id
  where m.profile_id = any(coalesce(p_profile_ids, array[]::uuid[]))
    and p.status = 'published'
    and m.moderation_status = 'approved';
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

drop policy if exists "profile_media_public_catalog_select" on public.profile_media;
