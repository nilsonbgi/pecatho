-- Digital-content packs: seller-defined image/video entitlements and buyer-selected files.
alter table public.digital_content_products
  add column if not exists package_image_limit integer,
  add column if not exists package_video_limit integer;

create table if not exists public.digital_content_sale_selections (
  sale_id uuid not null references public.digital_content_sales(id) on delete cascade,
  product_item_id uuid not null references public.digital_content_product_items(id) on delete restrict,
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (sale_id, product_item_id)
);
create index if not exists digital_content_sale_selections_buyer_idx
  on public.digital_content_sale_selections(buyer_user_id, sale_id);
alter table public.digital_content_sale_selections enable row level security;
revoke all on public.digital_content_sale_selections from anon, authenticated;
grant select on public.digital_content_sale_selections to authenticated;
create policy digital_content_sale_selections_buyer_read
  on public.digital_content_sale_selections for select to authenticated
  using (buyer_user_id = (select auth.uid()));

-- Existing package products receive limits matching their current contents, preserving
-- purchases and listings that existed before the selection feature.
update public.digital_content_products p
set package_image_limit = coalesce(x.images, 0),
    package_video_limit = coalesce(x.videos, 0)
from (
  select p2.id,
         count(i.id) filter (where i.media_type = 'image')::integer as images,
         count(i.id) filter (where i.media_type = 'video')::integer as videos
  from public.digital_content_products p2
  left join public.digital_content_product_items i on i.product_id = p2.id
  where p2.product_type = 'package'
  group by p2.id
) x
where p.id = x.id and p.product_type = 'package'
  and (p.package_image_limit is null or p.package_video_limit is null);

alter table public.digital_content_products
  drop constraint if exists digital_content_products_package_limits_check;
alter table public.digital_content_products
  add constraint digital_content_products_package_limits_check
  check (
    (product_type <> 'package' and package_image_limit is null and package_video_limit is null)
    or
    (product_type = 'package'
      and package_image_limit is not null and package_image_limit >= 0
      and package_video_limit is not null and package_video_limit >= 0
      and package_image_limit + package_video_limit >= 0)
  );

-- Backfill paid historical sales with all files they already had access to.
insert into public.digital_content_sale_selections(sale_id, product_item_id, buyer_user_id)
select s.id, i.id, s.buyer_user_id
from public.digital_content_sales s
join public.digital_content_product_items i on i.product_id = s.product_id
where s.status = 'paid'
on conflict (sale_id, product_item_id) do nothing;

create or replace function public.set_digital_content_sale_selection(
  p_sale_id uuid,
  p_product_item_ids uuid[]
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_sale public.digital_content_sales%rowtype;
  v_product public.digital_content_products%rowtype;
  v_images integer;
  v_videos integer;
  v_selected integer;
  v_available_images integer;
  v_available_videos integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_sale from public.digital_content_sales
   where id = p_sale_id and buyer_user_id = v_user and status = 'paid'
   for update;
  if not found then raise exception 'CONTENT_ACCESS_DENIED'; end if;
  select * into v_product from public.digital_content_products where id = v_sale.product_id;
  if not found then raise exception 'PRODUCT_NOT_AVAILABLE'; end if;

  if p_product_item_ids is null or cardinality(p_product_item_ids) = 0 then
    raise exception 'SELECTION_REQUIRED';
  end if;
  if cardinality(p_product_item_ids) <> (select count(distinct x) from unnest(p_product_item_ids) x) then
    raise exception 'DUPLICATE_SELECTION';
  end if;

  select count(*) filter (where i.media_type = 'image'),
         count(*) filter (where i.media_type = 'video'),
         count(*)
    into v_images, v_videos, v_selected
    from public.digital_content_product_items i
   where i.product_id = v_sale.product_id
     and i.id = any(p_product_item_ids);

  if v_selected <> cardinality(p_product_item_ids) then
    raise exception 'INVALID_SELECTION_ITEM';
  end if;

  select count(*) filter (where i.media_type = 'image'),
         count(*) filter (where i.media_type = 'video')
    into v_available_images, v_available_videos
    from public.digital_content_product_items i
   where i.product_id = v_sale.product_id;

  if v_product.product_type = 'package' then
    if v_images > coalesce(v_product.package_image_limit, 0)
       or v_videos > coalesce(v_product.package_video_limit, 0) then
      raise exception 'SELECTION_LIMIT_EXCEEDED';
    end if;
    if v_images + v_videos <> v_selected then
      raise exception 'UNSUPPORTED_MEDIA_SELECTION';
    end if;
  elsif v_selected <> 1 then
    raise exception 'SELECTION_LIMIT_EXCEEDED';
  end if;

  if exists (select 1 from public.digital_content_sale_selections where sale_id = v_sale.id) then
    raise exception 'SELECTION_ALREADY_LOCKED';
  end if;

  insert into public.digital_content_sale_selections(sale_id, product_item_id, buyer_user_id)
  select v_sale.id, i.id, v_user
    from public.digital_content_product_items i
   where i.product_id = v_sale.product_id and i.id = any(p_product_item_ids);

  return jsonb_build_object(
    'sale_id', v_sale.id, 'selected_count', v_selected,
    'images_selected', v_images, 'videos_selected', v_videos,
    'images_limit', case when v_product.product_type = 'package' then v_product.package_image_limit else 1 end,
    'videos_limit', case when v_product.product_type = 'package' then v_product.package_video_limit else 1 end
  );
end;
$function$;
revoke all on function public.set_digital_content_sale_selection(uuid, uuid[]) from public, anon;
grant execute on function public.set_digital_content_sale_selection(uuid, uuid[]) to authenticated;

create or replace function public.get_digital_content_downloads(p_sale_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_sale public.digital_content_sales%rowtype;
  v_items jsonb;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_sale from public.digital_content_sales
   where id = p_sale_id and buyer_user_id = v_user and status = 'paid';
  if not found then raise exception 'CONTENT_ACCESS_DENIED'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'filename', coalesce(i.original_filename, 'Conteúdo'),
    'storage_bucket', i.storage_bucket,
    'storage_path', i.storage_path
  ) order by i.sort_order, i.created_at), '[]'::jsonb)
  into v_items
  from public.digital_content_sale_selections ss
  join public.digital_content_product_items i on i.id = ss.product_item_id
  where ss.sale_id = v_sale.id and ss.buyer_user_id = v_user
    and i.product_id = v_sale.product_id;

  return jsonb_build_object('sale_id', v_sale.id, 'product_id', v_sale.product_id, 'items', v_items);
end;
$function$;
revoke all on function public.get_digital_content_downloads(uuid) from public, anon;
grant execute on function public.get_digital_content_downloads(uuid) to authenticated;
