-- Preserve existing SELECT/INSERT/DELETE behavior while removing redundant permissive policies.
-- The former ALL policies on follows/blocks also allowed UPDATE, which is not required
-- for these relationship rows and could permit changing the target of an existing row.
drop policy if exists block_self on public.user_blocks;
drop policy if exists follow_self on public.user_follows;

-- Keep the equivalent, optimized INSERT policy and the broader staff-aware SELECT policy.
drop policy if exists message_member_insert on public.messages;
drop policy if exists conversation_member_select on public.conversation_members;
drop policy if exists report_owner_insert on public.reports;
drop policy if exists report_owner_select on public.reports;
drop policy if exists profiles_self_select on public.profiles;
