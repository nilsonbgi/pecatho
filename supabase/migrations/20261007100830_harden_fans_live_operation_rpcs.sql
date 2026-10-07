ALTER FUNCTION public.end_fans_live_session(uuid) SECURITY DEFINER;
ALTER FUNCTION public.end_fans_live_session(uuid) SET search_path TO pg_catalog, public;

ALTER FUNCTION public.extend_fans_live_session(uuid, integer) SECURITY DEFINER;
ALTER FUNCTION public.extend_fans_live_session(uuid, integer) SET search_path TO pg_catalog, public;

ALTER FUNCTION public.kick_fans_live_participant(uuid) SECURITY DEFINER;
ALTER FUNCTION public.kick_fans_live_participant(uuid) SET search_path TO pg_catalog, public;
