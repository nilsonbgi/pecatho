-- Convert public pass-through wrappers to SECURITY INVOKER.
-- Privileged work remains inside private SECURITY DEFINER functions with explicit authorization.
alter function public.admin_fans_payout_action(uuid,text,text,text,text) security invoker;
alter function public.admin_moderate_partner_venue(uuid,text,text) security invoker;
alter function public.admin_moderate_profile_media(uuid,text) security invoker;
alter function public.create_fans_checkout_intent(text,uuid,uuid) security invoker;
alter function public.request_fans_payout(uuid,numeric,text) security invoker;
alter function public.request_seller_payout(numeric,text) security invoker;
alter function public.submit_advertiser_for_review(uuid) security invoker;
