-- Harden the public advertiser catalog search after the structured-services rollout.
-- Keep the public search RPC available to anonymous visitors, but remove the
-- obsolete overload and optimize selected-service filtering.

drop function if exists public.search_public_advertisers(
  bigint,
  bigint,
  bigint,
  text,
  jsonb,
  text[],
  integer,
  integer
);

create index if not exists idx_profile_services_selected_service_profile
  on public.profile_services (service_id, profile_id)
  where selected = true;

alter function public.search_public_advertisers(
  bigint,
  bigint,
  bigint,
  text,
  jsonb,
  text[],
  integer,
  integer,
  numeric,
  numeric,
  integer,
  integer
) set search_path = pg_catalog, public;

revoke execute on function public.search_public_advertisers(
  bigint,
  bigint,
  bigint,
  text,
  jsonb,
  text[],
  integer,
  integer,
  numeric,
  numeric,
  integer,
  integer
) from public;

grant execute on function public.search_public_advertisers(
  bigint,
  bigint,
  bigint,
  text,
  jsonb,
  text[],
  integer,
  integer,
  numeric,
  numeric,
  integer,
  integer
) to anon, authenticated;
