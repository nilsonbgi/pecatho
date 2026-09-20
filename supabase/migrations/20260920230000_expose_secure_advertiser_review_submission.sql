create or replace function public.submit_advertiser_for_review(p_profile_id uuid)
returns public.advertiser_profiles
language plpgsql
security definer
set search_path = public, private
as $function$
begin
  return private.submit_advertiser_for_review(p_profile_id);
end;
$function$;

revoke all on function public.submit_advertiser_for_review(uuid) from public;
grant execute on function public.submit_advertiser_for_review(uuid) to authenticated;
