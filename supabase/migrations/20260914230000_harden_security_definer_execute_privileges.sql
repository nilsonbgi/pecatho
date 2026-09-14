-- Restrict direct execution of privileged SECURITY DEFINER functions.
-- Public discovery functions remain explicitly available to anon/authenticated.

revoke execute on function public.admin_moderate_advertiser(uuid, text) from anon, authenticated;
revoke execute on function public.admin_fans_payout_action(uuid, text, text, text, text) from anon, authenticated;
revoke execute on function public.notify_advertiser_on_follow() from anon, authenticated;
revoke execute on function public.notify_fans_like() from anon, authenticated;
revoke execute on function public.notify_fans_comment() from anon, authenticated;

revoke execute on function public.create_fans_checkout_intent(text, uuid, uuid, boolean) from anon;
revoke execute on function public.fans_prepare_subscription_purchase_period() from anon;
revoke execute on function public.fans_financial_summary(uuid) from anon;
revoke execute on function public.fans_sales_summary(uuid) from anon;
revoke execute on function public.request_fans_payout(uuid, numeric, text) from anon;
revoke execute on function public.submit_advertiser_for_review(uuid) from anon;
revoke execute on function public.update_my_address(text, text, text, text, bigint, bigint, bigint) from anon;
revoke execute on function public.update_my_profile(text, text, text, date, text) from anon;

revoke execute on function public.get_public_advertiser_location(uuid) from public;
grant execute on function public.get_public_advertiser_location(uuid) to anon, authenticated;

revoke execute on function public.search_public_advertisers(bigint, bigint, bigint, text, jsonb, text[], integer, integer, numeric, numeric, integer, integer) from public;
grant execute on function public.search_public_advertisers(bigint, bigint, bigint, text, jsonb, text[], integer, integer, numeric, numeric, integer, integer) to anon, authenticated;
