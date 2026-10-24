-- Allow authorized staff to manage all campaign banners, including inactive and scheduled rows.
-- Public visitors remain restricted to currently active banners by the existing banners_public policy.
CREATE POLICY banners_staff_select
ON public.banners
FOR SELECT
TO authenticated
USING (private.is_staff());
