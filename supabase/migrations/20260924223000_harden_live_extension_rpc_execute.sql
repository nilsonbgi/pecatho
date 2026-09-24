revoke execute on function public.get_fans_live_extension_checkout(uuid) from public, anon, authenticated;
revoke execute on function public.reject_fans_live_extension(uuid) from public, anon, authenticated;
revoke execute on function public.request_fans_live_extension(uuid,integer) from public, anon, authenticated;
revoke execute on function public.settle_fans_live_extension_checkout(uuid,text,text,public.payment_status,text,numeric) from public, anon, authenticated;
revoke execute on function public.notify_fans_live_session_transition() from public, anon, authenticated;
revoke execute on function public.notify_fans_live_tip_transition() from public, anon, authenticated;
