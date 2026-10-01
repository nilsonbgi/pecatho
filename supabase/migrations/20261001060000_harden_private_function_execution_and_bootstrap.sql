-- Pecatho security hardening: internal SECURITY DEFINER execution and bootstrap lockdown.
-- Applied to production through Supabase MCP migration:
-- harden_private_function_execution_and_bootstrap

revoke execute on all functions in schema private from public;
revoke execute on all functions in schema private from anon;
revoke execute on all functions in schema private from authenticated;

grant execute on function private.is_staff() to authenticated;
grant execute on function private.has_role(user_role) to authenticated;

revoke execute on function public.bootstrap_first_super_admin() from public;
revoke execute on function public.bootstrap_first_super_admin() from anon;
revoke execute on function public.bootstrap_first_super_admin() from authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to authenticated;
