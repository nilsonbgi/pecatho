-- Live-session rows contain buyer identity, payment references, schedule and moderation data.
-- Public discovery uses the published offers/creator surfaces; raw session rows are
-- available only to authenticated participants through the existing participant RLS policy.
revoke select on table public.fans_live_sessions from anon;
