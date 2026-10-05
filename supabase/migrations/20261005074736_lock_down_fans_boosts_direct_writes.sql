-- Prevent creators from creating or activating boosts directly through the Data API.
-- The current schema has no payment/order reference or settlement RPC for fans_boosts,
-- so authenticated writes cannot be safely tied to a confirmed payment.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.fans_boosts FROM authenticated;
REVOKE INSERT (
  id, creator_id, post_id, plan_id, starts_at, ends_at, status, view_count, created_at
) ON TABLE public.fans_boosts FROM authenticated;
REVOKE UPDATE (
  id, creator_id, post_id, plan_id, starts_at, ends_at, status, view_count, created_at
) ON TABLE public.fans_boosts FROM authenticated;

DROP POLICY IF EXISTS fans_boosts_owner_write ON public.fans_boosts;

-- Keep fans_boosts_owner_select unchanged so creators can still inspect their own boosts.
