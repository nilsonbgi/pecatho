-- Harden exposed SECURITY DEFINER RPCs without changing application behavior.
revoke execute on function public.request_fans_live_schedule(uuid, timestamptz) from public, anon;
grant execute on function public.request_fans_live_schedule(uuid, timestamptz) to authenticated;

revoke execute on function public.confirm_fans_live_schedule(uuid) from public, anon;
grant execute on function public.confirm_fans_live_schedule(uuid) to authenticated;

revoke execute on function public.reject_fans_live_schedule(uuid, text) from public, anon;
grant execute on function public.reject_fans_live_schedule(uuid, text) to authenticated;

revoke execute on function public.set_primary_profile_media(uuid) from public, anon;
grant execute on function public.set_primary_profile_media(uuid) to authenticated;

revoke execute on function public.submit_partner_venue_for_review(uuid) from public, anon;
grant execute on function public.submit_partner_venue_for_review(uuid) to authenticated;

alter function public.update_partner_venue_media_updated_at()
  set search_path = pg_catalog, public;

alter function public.touch_partner_commercial_updated_at()
  set search_path = pg_catalog, public;
