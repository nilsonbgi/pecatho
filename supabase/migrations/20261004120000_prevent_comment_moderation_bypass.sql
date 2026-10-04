-- Users may create and delete their own Fans comments, but must not edit moderation state.
-- In particular, an author must not be able to restore a comment hidden by moderation.
-- Staff retain the separate fans_comments_staff_update policy.
drop policy if exists fans_comments_owner_update on public.fans_comments;
