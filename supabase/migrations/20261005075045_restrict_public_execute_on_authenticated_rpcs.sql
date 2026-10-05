-- Restrict authenticated-only SECURITY DEFINER RPCs from inherited PUBLIC/anon execution.
-- Preserve authenticated access for application flows; each function retains its own authorization checks.
REVOKE EXECUTE ON FUNCTION public.complete_registration_intent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_registration_intent(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.confirm_fans_live_schedule(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_fans_live_schedule(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.consume_registration_intent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_registration_intent(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_digital_content_checkout_intent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_digital_content_checkout_intent(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_fans_checkout_intent(text, uuid, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_fans_checkout_intent(text, uuid, uuid, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_fans_live_checkout_intent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_fans_live_checkout_intent(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_fans_live_tip_checkout_intent(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_fans_live_tip_checkout_intent(uuid, numeric, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_pecatho_gift_checkout_intent(text, uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_pecatho_gift_checkout_intent(text, uuid, numeric, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_profile_media_checkout_intent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_profile_media_checkout_intent(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.fans_financial_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fans_financial_summary(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.fans_live_financial_reconciliation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fans_live_financial_reconciliation(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.fans_live_financial_statement(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fans_live_financial_statement(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.fans_sales_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fans_sales_summary(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_digital_content_downloads(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_digital_content_downloads(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_fans_live_room_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_fans_live_room_access(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reject_fans_live_schedule(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_fans_live_schedule(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.request_fans_live_schedule(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_fans_live_schedule(uuid, timestamptz) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.set_primary_profile_media(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_primary_profile_media(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.set_profile_media_presentation(uuid, boolean, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_profile_media_presentation(uuid, boolean, boolean, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_partner_venue_for_review(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_partner_venue_for_review(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.touch_fans_live_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_fans_live_session(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_my_address(text, text, text, text, bigint, bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_address(text, text, text, text, bigint, bigint, bigint) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_my_profile(text, text, text, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text, text, date, text) TO authenticated;