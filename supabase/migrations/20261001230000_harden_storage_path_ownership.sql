-- Harden storage-path ownership across user-controlled media records.
-- Applied to production before this migration was committed.

create or replace function private.guard_profile_media_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $function$
declare
  v_owner_user_id uuid;
begin
  select p.user_id into v_owner_user_id
  from public.advertiser_profiles p
  where p.id = new.profile_id;

  if not private.is_staff() then
    if v_owner_user_id is null or v_owner_user_id <> auth.uid() then
      raise exception 'A mídia não pertence ao perfil do usuário autenticado.';
    end if;

    if tg_op = 'INSERT' then
      if new.storage_bucket <> 'pecatho-media'
         or new.storage_path !~ ('^' || v_owner_user_id::text || '/')
      then
        raise exception 'Caminho de armazenamento da mídia inválido.';
      end if;

      if new.preview_storage_path is not null
         and (
           new.preview_storage_bucket <> 'pecatho-media-preview'
           or new.preview_storage_path !~ ('^' || v_owner_user_id::text || '/')
         )
      then
        raise exception 'Caminho de preview da mídia inválido.';
      end if;
    end if;
  end if;

  if private.is_staff() then
    if tg_op='INSERT' then
      new.moderation_status := coalesce(new.moderation_status, 'pending');
    end if;
    return new;
  end if;

  if tg_op='INSERT' then
    new.moderation_status := 'pending';
    new.is_public := (new.access_type='public');
    if new.price is null or new.price<0 then new.price:=0; end if;
    if new.currency is null or new.currency<>'BRL' then new.currency:='BRL'; end if;
    return new;
  end if;

  if tg_op='UPDATE' then
    new.moderation_status := old.moderation_status;
    new.is_primary := old.is_primary;
    new.storage_bucket := old.storage_bucket;
    new.storage_path := old.storage_path;
    new.original_filename := old.original_filename;
    new.mime_type := old.mime_type;
    new.size_bytes := old.size_bytes;
    new.preview_storage_bucket := old.preview_storage_bucket;
    new.preview_storage_path := old.preview_storage_path;
    new.is_public := (new.access_type='public');
    if new.price is null or new.price<0 then new.price:=0; end if;
    if new.currency is null or new.currency<>'BRL' then new.currency:='BRL'; end if;
    return new;
  end if;

  return new;
end;
$function$;

create or replace function private.guard_fans_post_media_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $function$
declare
  v_owner_user_id uuid;
begin
  select c.user_id into v_owner_user_id
  from public.fans_posts p
  join public.fans_creators c on c.id = p.creator_id
  where p.id = new.post_id;

  if not private.is_staff() then
    if v_owner_user_id is null or v_owner_user_id <> auth.uid() then
      raise exception 'A mídia Fans não pertence a uma publicação do usuário autenticado.';
    end if;

    if new.storage_bucket <> 'fans-private'
       or new.storage_path !~ ('^' || v_owner_user_id::text || '/')
    then
      raise exception 'Caminho de armazenamento da mídia Fans inválido.';
    end if;
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
$function$;

create or replace function private.guard_digital_content_product_item_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $function$
declare
  v_product_owner uuid;
begin
  select p.owner_user_id into v_product_owner
  from public.digital_content_products p
  where p.id = new.product_id;

  if not private.is_staff() then
    if v_product_owner is null
       or new.owner_user_id <> auth.uid()
       or v_product_owner <> auth.uid()
    then
      raise exception 'O item de conteúdo digital não pertence ao usuário autenticado.';
    end if;

    if new.storage_bucket <> 'pecatho-private'
       or new.storage_path !~ ('^' || auth.uid()::text || '/')
    then
      raise exception 'Caminho de armazenamento do conteúdo digital inválido.';
    end if;

    if position('..' in new.storage_path) > 0
       or left(new.storage_path, 1) = '/'
    then
      raise exception 'Caminho de armazenamento do conteúdo digital inválido.';
    end if;
  end if;

  if new.sort_order < 0 then
    raise exception 'A ordem do conteúdo digital não pode ser negativa.';
  end if;

  return new;
end;
$function$;

create or replace function private.guard_partner_venue_media_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $function$
declare
  v_owner_user_id uuid;
begin
  select v.owner_user_id into v_owner_user_id
  from public.partner_venues v
  where v.id = new.venue_id;

  if not private.is_staff() then
    if v_owner_user_id is null
       or v_owner_user_id <> auth.uid()
       or new.owner_user_id <> auth.uid()
    then
      raise exception 'A mídia do estabelecimento não pertence ao usuário autenticado.';
    end if;

    if new.storage_bucket <> 'pecatho-partner-media'
       or new.storage_path !~ ('^' || auth.uid()::text || '/')
    then
      raise exception 'Caminho de armazenamento da mídia do estabelecimento inválido.';
    end if;

    if new.preview_storage_path is not null
       and (
         new.preview_storage_bucket <> 'pecatho-media-preview'
         or new.preview_storage_path !~ ('^' || auth.uid()::text || '/')
       )
    then
      raise exception 'Caminho de preview da mídia do estabelecimento inválido.';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_guard_digital_content_product_item_integrity on public.digital_content_product_items;
create trigger trg_guard_digital_content_product_item_integrity
before insert or update on public.digital_content_product_items
for each row execute function private.guard_digital_content_product_item_integrity();

drop trigger if exists trg_guard_partner_venue_media_integrity on public.partner_venue_media;
create trigger trg_guard_partner_venue_media_integrity
before insert or update on public.partner_venue_media
for each row execute function private.guard_partner_venue_media_integrity();

create or replace function public.get_digital_content_downloads(p_sale_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_user uuid := auth.uid();
  v_sale public.digital_content_sales%rowtype;
  v_items jsonb;
  v_owner_user_id uuid;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_sale
  from public.digital_content_sales
  where id = p_sale_id and buyer_user_id = v_user and status = 'paid';
  if not found then raise exception 'CONTENT_ACCESS_DENIED'; end if;

  select p.owner_user_id into v_owner_user_id
  from public.digital_content_products p
  where p.id = v_sale.product_id;
  if v_owner_user_id is null then raise exception 'CONTENT_OWNER_NOT_FOUND'; end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'filename', coalesce(i.original_filename, 'Conteúdo'),
      'storage_bucket', i.storage_bucket,
      'storage_path', i.storage_path
    ) order by i.sort_order, i.created_at
  ), '[]'::jsonb)
  into v_items
  from public.digital_content_product_items i
  where i.product_id = v_sale.product_id
    and i.owner_user_id = v_owner_user_id
    and i.storage_bucket = 'pecatho-private'
    and position('..' in i.storage_path) = 0
    and left(i.storage_path, 1) <> '/'
    and i.storage_path ~ ('^' || v_owner_user_id::text || '/');

  return jsonb_build_object('sale_id',v_sale.id,'product_id',v_sale.product_id,'items',v_items);
end;
$function$;

revoke all on function private.guard_profile_media_integrity() from public, anon, authenticated;
revoke all on function private.guard_fans_post_media_integrity() from public, anon, authenticated;
revoke all on function private.guard_digital_content_product_item_integrity() from public, anon, authenticated;
revoke all on function private.guard_partner_venue_media_integrity() from public, anon, authenticated;
revoke all on function public.get_digital_content_downloads(uuid) from public, anon;
grant execute on function public.get_digital_content_downloads(uuid) to authenticated;
