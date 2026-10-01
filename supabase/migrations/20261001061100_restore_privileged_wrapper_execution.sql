-- Preserve the privileged public wrappers as SECURITY DEFINER.
-- Their private targets are protected from direct Data API execution and enforce authorization.
alter function public.admin_fans_payout_action(uuid,text,text,text,text) security definer;
alter function public.admin_moderate_partner_venue(uuid,text,text) security definer;
alter function public.admin_moderate_profile_media(uuid,text) security definer;
alter function public.create_fans_checkout_intent(text,uuid,uuid) security definer;
alter function public.request_fans_payout(uuid,numeric,text) security definer;
alter function public.request_seller_payout(numeric,text) security definer;
alter function public.submit_advertiser_for_review(uuid) security definer;
