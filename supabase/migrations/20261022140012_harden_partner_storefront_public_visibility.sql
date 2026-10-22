-- Only expose partner storefront products when both the product and venue are published.
-- The SECURITY DEFINER helper reveals only the public publication state, not venue fields.
create or replace function public.is_published_partner_venue(p_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select exists (
    select 1
    from public.partner_venues v
    where v.id = p_venue_id
      and v.status = 'published'
  );
$function$;

revoke all on function public.is_published_partner_venue(uuid) from public, anon, authenticated;
grant execute on function public.is_published_partner_venue(uuid) to anon, authenticated;

drop policy if exists partner_store_products_public_read on public.partner_store_products;
create policy partner_store_products_public_read on public.partner_store_products
  for select to anon, authenticated
  using (is_published = true and public.is_published_partner_venue(venue_id));
