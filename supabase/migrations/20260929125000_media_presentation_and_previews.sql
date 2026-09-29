-- Media presentation controls and lightweight public previews.
alter table public.profile_media
  add column if not exists is_featured boolean not null default false,
  add column if not exists show_in_cards boolean not null default true,
  add column if not exists show_in_gallery boolean not null default true;

alter table public.partner_venue_media
  add column if not exists preview_storage_bucket text,
  add column if not exists preview_storage_path text,
  add column if not exists width integer,
  add column if not exists height integer;

create index if not exists profile_media_profile_surface_idx
on public.profile_media(profile_id,moderation_status,is_public,show_in_gallery,show_in_cards);

update public.profile_media set is_featured=true where is_primary=true and is_featured=false;

create or replace function public.set_profile_media_presentation(p_media_id uuid,p_is_featured boolean,p_show_in_cards boolean,p_show_in_gallery boolean)
returns public.profile_media language plpgsql security definer set search_path='pg_catalog','public'
as $function$
declare v_user uuid:=auth.uid(); v_media public.profile_media;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into v_media from public.profile_media where id=p_media_id and exists(select 1 from public.advertiser_profiles ap where ap.id=profile_media.profile_id and ap.user_id=v_user) for update;
 if not found then raise exception 'MEDIA_NOT_FOUND'; end if;
 if p_is_featured and v_media.kind<>'image' then raise exception 'FEATURED_MEDIA_MUST_BE_IMAGE'; end if;
 if p_is_featured and v_media.moderation_status<>'approved' then raise exception 'FEATURED_MEDIA_MUST_BE_APPROVED'; end if;
 if p_is_featured then update public.profile_media set is_featured=false,updated_at=now() where profile_id=v_media.profile_id and id<>v_media.id; end if;
 update public.profile_media set is_featured=p_is_featured,show_in_cards=p_show_in_cards,show_in_gallery=p_show_in_gallery,updated_at=now() where id=v_media.id returning * into v_media;
 return v_media;
end;
$function$;
revoke all on function public.set_profile_media_presentation(uuid,boolean,boolean,boolean) from public;
grant execute on function public.set_profile_media_presentation(uuid,boolean,boolean,boolean) to authenticated;

create or replace function private.guard_profile_media_integrity()
returns trigger language plpgsql security definer set search_path='public','private'
as $function$
begin
 if private.is_staff() then return new; end if;
 if tg_op='INSERT' then
   new.moderation_status:='pending'; new.is_public:=(new.access_type='public');
   if new.price is null or new.price<0 then new.price:=0; end if;
   if new.currency is null or new.currency<>'BRL' then new.currency:='BRL'; end if;
   return new;
 end if;
 if tg_op='UPDATE' then
   new.moderation_status:=old.moderation_status; new.is_primary:=old.is_primary;
   new.storage_bucket:=old.storage_bucket; new.storage_path:=old.storage_path;
   new.original_filename:=old.original_filename; new.mime_type:=old.mime_type; new.size_bytes:=old.size_bytes;
   new.preview_storage_bucket:=old.preview_storage_bucket; new.preview_storage_path:=old.preview_storage_path;
   new.is_public:=(new.access_type='public');
   if new.price is null or new.price<0 then new.price:=0; end if;
   if new.currency is null or new.currency<>'BRL' then new.currency:='BRL'; end if;
   return new;
 end if;
 return new;
end;
$function$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('pecatho-media-preview','pecatho-media-preview',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "media preview owner insert" on storage.objects;
drop policy if exists "media preview owner update" on storage.objects;
drop policy if exists "media preview owner delete" on storage.objects;
create policy "media preview owner insert" on storage.objects for insert to authenticated with check(bucket_id='pecatho-media-preview' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "media preview owner update" on storage.objects for update to authenticated using(bucket_id='pecatho-media-preview' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='pecatho-media-preview' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "media preview owner delete" on storage.objects for delete to authenticated using(bucket_id='pecatho-media-preview' and (storage.foldername(name))[1]=(select auth.uid())::text);
