-- Pecatho: unified paid digital-content store for advertisers and Fans creators.

create table if not exists public.digital_content_products (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('advertiser','creator')),
  owner_id uuid not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 180),
  description text,
  product_type text not null default 'single' check (product_type in ('single_image','single_video','package')),
  price numeric(12,2) not null check (price > 0 and price <= 100000),
  currency char(3) not null default 'BRL' check (currency='BRL'),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  cover_bucket text,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.digital_content_product_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.digital_content_products(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text not null default 'pecatho-private',
  storage_path text not null unique,
  original_filename text,
  mime_type text,
  size_bytes bigint,
  media_type text not null check (media_type in ('image','video','audio','document')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.digital_content_sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.digital_content_products(id) on delete restrict,
  buyer_user_id uuid not null references auth.users(id) on delete restrict,
  owner_type text not null check (owner_type in ('advertiser','creator')),
  owner_id uuid not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  order_id uuid unique references public.orders(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0),
  owner_amount numeric(12,2) not null default 0 check (owner_amount >= 0),
  currency char(3) not null default 'BRL',
  status text not null default 'pending' check (status in ('pending','paid','refunded','chargeback','cancelled','failed')),
  provider text,
  provider_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists digital_content_products_owner_idx on public.digital_content_products(owner_type, owner_id, status, created_at desc);
create index if not exists digital_content_product_items_product_idx on public.digital_content_product_items(product_id, sort_order);
create index if not exists digital_content_sales_buyer_idx on public.digital_content_sales(buyer_user_id, status, created_at desc);
create index if not exists digital_content_sales_owner_idx on public.digital_content_sales(owner_user_id, status, created_at desc);

alter table public.digital_content_products enable row level security;
alter table public.digital_content_product_items enable row level security;
alter table public.digital_content_sales enable row level security;

revoke all on public.digital_content_products, public.digital_content_product_items, public.digital_content_sales from anon, authenticated;
grant select,insert,update,delete on public.digital_content_products, public.digital_content_product_items to authenticated;
grant select on public.digital_content_products to anon, authenticated;
grant select on public.digital_content_sales to authenticated;

create policy digital_products_public_select on public.digital_content_products for select to anon, authenticated using (status='published');
create policy digital_products_owner_write on public.digital_content_products for all to authenticated
using (owner_user_id=(select auth.uid()))
with check (owner_user_id=(select auth.uid()) and (
 (owner_type='creator' and exists(select 1 from public.fans_creators c where c.id=owner_id and c.user_id=(select auth.uid())))
 or
 (owner_type='advertiser' and exists(select 1 from public.advertiser_profiles p where p.id=owner_id and p.user_id=(select auth.uid())))
));

create policy digital_items_owner_write on public.digital_content_product_items for all to authenticated
using (owner_user_id=(select auth.uid()))
with check (owner_user_id=(select auth.uid()) and exists(select 1 from public.digital_content_products p where p.id=product_id and p.owner_user_id=(select auth.uid())));

create policy digital_sales_buyer_select on public.digital_content_sales for select to authenticated using (buyer_user_id=(select auth.uid()));
create policy digital_sales_owner_select on public.digital_content_sales for select to authenticated using (owner_user_id=(select auth.uid()));

create or replace function public.create_digital_content_checkout_intent(p_product_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_user uuid:=auth.uid(); v_product public.digital_content_products%rowtype; v_order uuid; v_order_number text; v_payment uuid; v_sale uuid;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into v_product from public.digital_content_products where id=p_product_id and status='published';
 if not found then raise exception 'PRODUCT_NOT_AVAILABLE'; end if;
 if v_product.owner_user_id=v_user then raise exception 'SELF_PURCHASE'; end if;
 select id into v_sale from public.digital_content_sales where product_id=v_product.id and buyer_user_id=v_user and status in ('pending','paid') order by created_at desc limit 1;
 if v_sale is not null and exists(select 1 from public.digital_content_sales where id=v_sale and status='paid') then return jsonb_build_object('already_owned',true,'sale_id',v_sale); end if;
 v_order_number:='PEC-CONT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
 insert into public.orders(order_number,user_id,subtotal,discount,fee,total,currency,metadata)
 values(v_order_number,v_user,v_product.price,0,0,v_product.price,v_product.currency,jsonb_build_object('source','pecatho','kind','digital_content','product_type','digital_content','product_id',v_product.id,'owner_type',v_product.owner_type,'owner_id',v_product.owner_id,'owner_user_id',v_product.owner_user_id,'title',v_product.title)) returning id into v_order;
 insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
 values(v_order,v_user,'pending',v_product.price,v_product.currency,'pending','pending','{}'::jsonb) returning id into v_payment;
 insert into public.digital_content_sales(product_id,buyer_user_id,owner_type,owner_id,owner_user_id,order_id,payment_id,amount,platform_fee,owner_amount,currency,status)
 values(v_product.id,v_user,v_product.owner_type,v_product.owner_id,v_product.owner_user_id,v_order,v_payment,v_product.price,0,v_product.price,v_product.currency,'pending') returning id into v_sale;
 return jsonb_build_object('already_owned',false,'sale_id',v_sale,'order_id',v_order,'order_number',v_order_number,'amount',v_product.price,'currency',v_product.currency);
end; $$;
revoke all on function public.create_digital_content_checkout_intent(uuid) from public,anon;
grant execute on function public.create_digital_content_checkout_intent(uuid) to authenticated;

create or replace function public.settle_digital_content_checkout(p_order_id uuid,p_provider text,p_provider_payment_id text,p_payment_status public.payment_status,p_payment_method text default null,p_provider_fee numeric default 0)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_order public.orders%rowtype; v_payment public.payments%rowtype; v_meta jsonb; v_product public.digital_content_products%rowtype; v_sale public.digital_content_sales%rowtype; v_rule public.fans_fee_rules%rowtype; v_platform_fee numeric:=0; v_owner_amount numeric:=0;
begin
 select * into v_order from public.orders where id=p_order_id for update; if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 select * into v_payment from public.payments where order_id=p_order_id order by created_at desc limit 1 for update; if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
 v_meta:=coalesce(v_order.metadata,'{}'::jsonb); if coalesce(v_meta->>'product_type',v_meta->>'kind')<>'digital_content' then raise exception 'INVALID_DIGITAL_CONTENT_ORDER'; end if;
 select * into v_product from public.digital_content_products where id=(v_meta->>'product_id')::uuid for update; if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
 select * into v_sale from public.digital_content_sales where order_id=v_order.id for update; if not found then raise exception 'SALE_NOT_FOUND'; end if;
 if p_payment_status='paid' then
   select * into v_rule from public.fans_fee_rules where active=true and effective_from<=now() and (effective_until is null or effective_until>now()) order by effective_from desc limit 1;
   v_platform_fee:=least(v_order.total,round((v_order.total*coalesce(v_rule.platform_percent,0)/100)+coalesce(v_rule.fixed_fee,0),2));
   v_owner_amount:=greatest(round(v_order.total-greatest(coalesce(p_provider_fee,0),0)-v_platform_fee,2),0);
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status='paid',payment_method=p_payment_method,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_payment.id;
   update public.orders set status='paid',updated_at=now() where id=v_order.id;
   update public.digital_content_sales set status='paid',platform_fee=v_platform_fee,owner_amount=v_owner_amount,provider=p_provider,provider_reference=p_provider_payment_id,paid_at=coalesce(paid_at,now()),updated_at=now() where id=v_sale.id;
   return jsonb_build_object('ok',true,'status','paid','sale_id',v_sale.id,'owner_amount',v_owner_amount,'platform_fee',v_platform_fee);
 end if;
 if p_payment_status in ('refunded','chargeback') then
   update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,updated_at=now() where id=v_payment.id;
   update public.orders set status='refunded',updated_at=now() where id=v_order.id;
   update public.digital_content_sales set status=p_payment_status,updated_at=now() where id=v_sale.id;
   return jsonb_build_object('ok',true,'status',p_payment_status,'sale_id',v_sale.id);
 end if;
 update public.payments set provider=p_provider,provider_payment_id=p_provider_payment_id,status=p_payment_status,updated_at=now() where id=v_payment.id;
 return jsonb_build_object('ok',true,'status',p_payment_status,'sale_id',v_sale.id);
end; $$;
revoke all on function public.settle_digital_content_checkout(uuid,text,text,public.payment_status,text,numeric) from public,anon,authenticated;
grant execute on function public.settle_digital_content_checkout(uuid,text,text,public.payment_status,text,numeric) to service_role;

create or replace function public.get_digital_content_downloads(p_sale_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_user uuid:=auth.uid(); v_sale public.digital_content_sales%rowtype; v_items jsonb;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into v_sale from public.digital_content_sales where id=p_sale_id and buyer_user_id=v_user and status='paid';
 if not found then raise exception 'CONTENT_ACCESS_DENIED'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'filename',coalesce(i.original_filename,'Conteúdo'),'storage_bucket',i.storage_bucket,'storage_path',i.storage_path) order by i.sort_order,i.created_at),'[]'::jsonb') into v_items from public.digital_content_product_items i where i.product_id=v_sale.product_id;
 return jsonb_build_object('sale_id',v_sale.id,'product_id',v_sale.product_id,'items',v_items);
end; $$;
revoke all on function public.get_digital_content_downloads(uuid) from public,anon;
grant execute on function public.get_digital_content_downloads(uuid) to authenticated;
