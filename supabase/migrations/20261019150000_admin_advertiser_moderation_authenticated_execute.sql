grant execute on function public.admin_moderate_advertiser(uuid, text) to authenticated;

revoke execute on function public.admin_moderate_advertiser(uuid, text) from anon, public;
