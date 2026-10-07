CREATE POLICY fans_payout_seller_owner_select
ON public.fans_payout_requests
FOR SELECT
TO authenticated
USING (seller_user_id = (SELECT auth.uid()));
