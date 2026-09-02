create or replace function private.guard_fans_post_publication()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  creator_active boolean;
  advertiser_verified boolean;
begin
  select c.status = 'active', coalesce(ap.verification_status = 'verified', true)
    into creator_active, advertiser_verified
  from public.fans_creators c
  left join public.advertiser_profiles ap on ap.id = c.advertiser_profile_id
  where c.id = new.creator_id;

  if new.status = 'published' then
    if not coalesce(creator_active, false) then
      raise exception 'O criador Fans precisa estar ativo para publicar conteúdo.';
    end if;
    if not coalesce(advertiser_verified, false) then
      raise exception 'O criador vinculado a um anunciante precisa estar verificado para publicar conteúdo Fans.';
    end if;
  end if;

  if not coalesce(private.is_staff(), false) then
    if tg_op = 'INSERT' and new.status = 'published' then
      raise exception 'Publicação de conteúdo Fans exige aprovação administrativa.';
    elsif tg_op = 'UPDATE' and new.status = 'published' and old.status <> 'published' then
      raise exception 'Publicação de conteúdo Fans exige aprovação administrativa.';
    end if;
  end if;

  if new.status = 'published' then
    new.published_at := coalesce(new.published_at, now());
  elsif tg_op = 'UPDATE' and old.status = 'published' and new.status <> 'published' then
    new.published_at := null;
  end if;

  return new;
end;
$$;

create or replace function private.guard_fans_post_media_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  owns_post boolean;
begin
  select exists (
    select 1 from public.fans_posts p
    join public.fans_creators c on c.id = p.creator_id
    where p.id = new.post_id and c.user_id = auth.uid()
  ) into owns_post;

  if not private.is_staff() and not owns_post then
    raise exception 'A mídia Fans não pertence a uma publicação do usuário autenticado.';
  end if;

  if tg_op = 'UPDATE' and not private.is_staff() then
    if new.post_id is distinct from old.post_id
       or new.storage_bucket is distinct from old.storage_bucket
       or new.storage_path is distinct from old.storage_path
       or new.media_type is distinct from old.media_type
       or new.mime_type is distinct from old.mime_type
       or new.size_bytes is distinct from old.size_bytes
       or new.width is distinct from old.width
       or new.height is distinct from old.height
       or new.duration_seconds is distinct from old.duration_seconds then
      raise exception 'Metadados estruturais da mídia Fans não podem ser alterados após o upload.';
    end if;
  end if;

  if new.sort_order < 0 then
    raise exception 'A ordem da mídia não pode ser negativa.';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_fans_post_publication() from public, anon, authenticated;
revoke all on function private.guard_fans_post_media_integrity() from public, anon, authenticated;

drop trigger if exists trg_guard_fans_post_media_integrity on public.fans_post_media;
create trigger trg_guard_fans_post_media_integrity
before insert or update on public.fans_post_media
for each row execute function private.guard_fans_post_media_integrity();
