-- Convert public pass-through RPCs to SECURITY INVOKER.
-- The private SECURITY DEFINER implementations perform their own staff/owner checks.
-- Grant only the authenticated role the execution needed for those guarded functions.
grant usage on schema private to authenticated;

grant execute on function private.admin_fans_payout_action(uuid,text,text,text,text) to authenticated;
grant execute on function private.admin_moderate_partner_venue(uuid,text,text) to authenticated;
grant execute on function private.admin_moderate_profile_media(uuid,text) to authenticated;
grant execute on function private.create_fans_checkout_intent(text,uuid,uuid) to authenticated;
grant execute on function private.request_fans_payout(uuid,numeric,text) to authenticated;
grant execute on function private.request_seller_payout(numeric,text) to authenticated;
grant execute on function private.submit_advertiser_for_review(uuid) to authenticated;

alter function public.admin_fans_payout_action(uuid,text,text,text,text) security invoker;
alter function public.admin_moderate_partner_venue(uuid,text,text) security invoker;
alter function public.admin_moderate_profile_media(uuid,text) security invoker;
alter function public.create_fans_checkout_intent(text,uuid,uuid) security invoker;
alter function public.request_fans_payout(uuid,numeric,text) security invoker;
alter function public.request_seller_payout(numeric,text) security invoker;
alter function public.submit_advertiser_for_review(uuid) security invoker;

revoke execute on function public.admin_fans_payout_action(uuid,text,text,text,text) from public, anon;
revoke execute on function public.admin_moderate_partner_venue(uuid,text,text) from public, anon;
revoke execute on function public.admin_moderate_profile_media(uuid,text) from public, anon;
revoke execute on function public.create_fans_checkout_intent(text,uuid,uuid) from public, anon;
revoke execute on function public.request_fans_payout(uuid,numeric,text) from public, anon;
revoke execute on function public.request_seller_payout(numeric,text) from public, anon;
revoke execute on function public.submit_advertiser_for_review(uuid) from public, anon;

grant execute on function public.admin_fans_payout_action(uuid,text,text,text,text) to authenticated, service_role;
grant execute on function public.admin_moderate_partner_venue(uuid,text,text) to authenticated, service_role;
grant execute on function public.admin_moderate_profile_media(uuid,text) to authenticated, service_role;
grant execute on function public.create_fans_checkout_intent(text,uuid,uuid) to authenticated, service_role;
grant execute on function public.request_fans_payout(uuid,numeric,text) to authenticated, service_role;
grant execute on function public.request_seller_payout(numeric,text) to authenticated, service_role;
grant execute on function public.submit_advertiser_for_review(uuid) to authenticated, service_role;
