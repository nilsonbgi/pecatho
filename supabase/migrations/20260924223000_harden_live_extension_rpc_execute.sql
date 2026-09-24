revoke execute on function public.get_fans_live_extension_checkout(uuid) from anon;
revoke execute on function public.reject_fans_live_extension(uuid) from anon;
revoke execute on function public.request_fans_live_extension(uuid,integer) from anon;
revoke execute on function public.settle_fans_live_extension_checkout(uuid,text,text,public.payment_status,text,numeric) from anon;
revoke execute on function public.notify_fans_live_session_transition() from anon, authenticated;
revoke execute on function public.notify_fans_live_tip_transition() from anon, authenticated;
