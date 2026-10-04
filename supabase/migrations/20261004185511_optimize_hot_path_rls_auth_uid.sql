-- Optimize hot-path RLS predicates by evaluating auth.uid() once per statement.
-- Predicates are semantically unchanged; row ownership and staff authorization remain intact.
alter policy profile_owner_insert on public.advertiser_profiles
  with check (user_id = (select auth.uid()));

alter policy profile_owner_select on public.advertiser_profiles
  using (user_id = (select auth.uid()));

alter policy profile_owner_update on public.advertiser_profiles
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy message_member_select on public.messages
  using (exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = messages.conversation_id
      and m.user_id = (select auth.uid())
  ));

alter policy order_owner_select on public.orders
  using (user_id = (select auth.uid()));

alter policy payment_owner_select on public.payments
  using (user_id = (select auth.uid()));

alter policy profiles_self_insert on public.profiles
  with check (id = (select auth.uid()));

alter policy profiles_self_update on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
