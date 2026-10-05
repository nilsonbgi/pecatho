-- Reduce SQL grants that are broader than the RLS/business workflows require.
-- Public visitors can read active offers and publication plans, but cannot mutate either catalog.
-- Payout state transitions are performed by the staff-only admin_fans_payout_action RPC.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.fans_live_offers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.publication_plans FROM anon;
REVOKE UPDATE ON TABLE public.fans_payout_requests FROM authenticated;
