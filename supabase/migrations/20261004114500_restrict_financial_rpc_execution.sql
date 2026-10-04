-- Financial and paid-content RPCs require an authenticated caller.
-- The functions retain their internal ownership/purchase checks; this migration
-- removes the unnecessary anonymous/PUBLIC execute surface without changing
-- authenticated application flows or service-role backend access.
revoke all on function public.fans_financial_summary(uuid) from public, anon;
revoke all on function public.fans_live_financial_reconciliation(uuid) from public, anon;
revoke all on function public.fans_live_financial_statement(uuid) from public, anon;
revoke all on function public.fans_sales_summary(uuid) from public, anon;
revoke all on function public.request_fans_payout(uuid, numeric, text) from public, anon;
revoke all on function public.request_seller_payout(numeric, text) from public, anon;
revoke all on function public.get_digital_content_downloads(uuid) from public, anon;

grant execute on function public.fans_financial_summary(uuid) to authenticated, service_role;
grant execute on function public.fans_live_financial_reconciliation(uuid) to authenticated, service_role;
grant execute on function public.fans_live_financial_statement(uuid) to authenticated, service_role;
grant execute on function public.fans_sales_summary(uuid) to authenticated, service_role;
grant execute on function public.request_fans_payout(uuid, numeric, text) to authenticated, service_role;
grant execute on function public.request_seller_payout(numeric, text) to authenticated, service_role;
grant execute on function public.get_digital_content_downloads(uuid) to authenticated, service_role;
