revoke all on function public.mark_conversation_read(uuid) from anon, public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

revoke all on function public.start_advertiser_conversation(uuid) from anon, public;
grant execute on function public.start_advertiser_conversation(uuid) to authenticated;
