-- All application objects referenced by search_public_advertisers are schema-qualified.
-- Keep only pg_catalog in the function search_path to reduce SECURITY DEFINER risk
-- without removing the anonymous execution required by the public catalog.
ALTER FUNCTION public.search_public_advertisers(bigint,bigint,bigint,text,jsonb,text[],integer,integer,numeric,numeric,integer,text,integer,integer)
  SET search_path TO pg_catalog;
