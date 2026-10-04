-- Registration-intent RPCs must only be callable by authenticated users.
-- Both functions validate auth.uid() = p_user_id internally; this grant change
-- removes the unnecessary anonymous/public execution path without changing the
-- authenticated user's own registration flow.
revoke execute on function public.complete_registration_intent(uuid) from public, anon;
grant execute on function public.complete_registration_intent(uuid) to authenticated;

revoke execute on function public.consume_registration_intent(uuid) from public, anon;
grant execute on function public.consume_registration_intent(uuid) to authenticated;
