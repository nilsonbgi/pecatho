-- Published digital content products contain owner_user_id and private cover storage paths.
-- Public catalog and detail pages already use server-side handlers with explicit public projections.
-- Remove direct Data API access to complete rows; owners retain their authenticated owner policy.
drop policy if exists digital_products_public_select on public.digital_content_products;
