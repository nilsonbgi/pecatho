ALTER FUNCTION public.prepare_fans_live_refund(uuid)
  SECURITY DEFINER;

ALTER FUNCTION public.prepare_fans_live_refund(uuid)
  SET search_path TO pg_catalog, public;

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.fans_live_sessions
  FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.fans_live_extension_requests
  FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.fans_purchases
  FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.fans_subscriptions
  FROM anon, authenticated;

REVOKE SELECT
  ON TABLE public.fans_live_extension_requests
  FROM anon;
