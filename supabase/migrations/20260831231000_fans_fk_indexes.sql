-- Indexes for Fans foreign keys. They prevent avoidable sequential scans and
-- improve deletes/updates on referenced rows as the marketplace grows.
create index if not exists fans_creators_advertiser_profile_idx on public.fans_creators(advertiser_profile_id);
create index if not exists fans_plans_creator_idx on public.fans_plans(creator_id);
create index if not exists fans_posts_creator_idx on public.fans_posts(creator_id);
create index if not exists fans_post_media_post_idx on public.fans_post_media(post_id);
create index if not exists fans_subscriptions_creator_idx on public.fans_subscriptions(creator_id);
create index if not exists fans_subscriptions_plan_idx on public.fans_subscriptions(plan_id);
create index if not exists fans_subscriptions_subscriber_idx on public.fans_subscriptions(subscriber_user_id);
create index if not exists fans_purchases_creator_idx on public.fans_purchases(creator_id);
create index if not exists fans_purchases_post_idx on public.fans_purchases(post_id);
create index if not exists fans_purchases_subscription_idx on public.fans_purchases(subscription_id);
create index if not exists fans_purchases_buyer_idx on public.fans_purchases(buyer_user_id);
create index if not exists fans_boosts_creator_idx on public.fans_boosts(creator_id);
create index if not exists fans_boosts_post_idx on public.fans_boosts(post_id);
create index if not exists fans_boosts_plan_idx on public.fans_boosts(plan_id);
create index if not exists fans_likes_user_idx on public.fans_likes(user_id);
create index if not exists fans_comments_post_idx on public.fans_comments(post_id);
create index if not exists fans_comments_user_idx on public.fans_comments(user_id);
create index if not exists fans_tips_creator_idx on public.fans_tips(creator_id);
create index if not exists fans_tips_buyer_idx on public.fans_tips(buyer_user_id);
create index if not exists fans_payout_creator_idx on public.fans_payout_requests(creator_id);
create index if not exists fans_reports_creator_idx on public.fans_reports(creator_id);
create index if not exists fans_reports_post_idx on public.fans_reports(post_id);
create index if not exists fans_reports_reporter_idx on public.fans_reports(reporter_user_id);
