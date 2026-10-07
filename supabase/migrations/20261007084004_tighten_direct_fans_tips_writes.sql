REVOKE INSERT, UPDATE, DELETE ON TABLE public.fans_tips FROM authenticated;

DROP POLICY IF EXISTS fans_tips_buyer_insert ON public.fans_tips;
