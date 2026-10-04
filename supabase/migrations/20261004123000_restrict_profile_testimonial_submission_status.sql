-- Prevent authenticated users from bypassing testimonial moderation by inserting
-- already-approved testimonials or setting a publication timestamp.
-- Staff moderation remains governed by the dedicated staff UPDATE policy.
drop policy if exists testimonials_insert on public.profile_testimonials;
create policy testimonials_insert
  on public.profile_testimonials
  for insert
  to authenticated
  with check (
    (author_user_id is null or author_user_id = (select auth.uid()))
    and status = 'pending'::moderation_status
    and published_at is null
  );
