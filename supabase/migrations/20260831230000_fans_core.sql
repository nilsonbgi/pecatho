-- Pecatho Fans: core service schema
-- This migration is intentionally isolated to fans_* tables so the main Pecatho
-- advertiser platform remains independent from the content-selling service.

create table if not exists public.fans_creators (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  advertiser_profile_id uuid references public.advertiser_profiles(id) on delete set null,
  slug text not null unique, display_name text not null, bio text, avatar_url text,
  status text not null default 'active' check (status in ('active','suspended','inactive')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.fans_plans (
  id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.fans_creators(id) on delete cascade,
  name text not null, description text, price numeric(12,2) not null check (price >= 0), currency char(3) not null default 'BRL',
  duration_days integer not null check (duration_days > 0), status text not null default 'active' check (status in ('draft','active','inactive')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (creator_id,name)
);
create table if not exists public.fans_posts (
  id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.fans_creators(id) on delete cascade,
  title text not null, body text, price numeric(12,2) not null default 0 check (price >= 0), currency char(3) not null default 'BRL',
  access_type text not null default 'paid' check (access_type in ('free','paid','subscriber')),
  status text not null default 'draft' check (status in ('draft','pending_review','published','rejected','archived')),
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.fans_post_media (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.fans_posts(id) on delete cascade,
  storage_bucket text not null default 'fans-private', storage_path text not null,
  media_type text not null check (media_type in ('image','video','audio','document')), mime_type text, size_bytes bigint,
  width integer, height integer, duration_seconds numeric(12,3), sort_order integer not null default 0,
  is_preview boolean not null default false, created_at timestamptz not null default now(), unique(storage_bucket,storage_path)
);
create table if not exists public.fans_subscriptions (
  id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.fans_creators(id) on delete cascade,
  subscriber_user_id uuid not null references auth.users(id) on delete cascade, plan_id uuid not null references public.fans_plans(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled','refunded')),
  starts_at timestamptz, ends_at timestamptz, auto_renew boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(creator_id,subscriber_user_id,plan_id,starts_at)
);
create table if not exists public.fans_purchases (
  id uuid primary key default gen_random_uuid(), buyer_user_id uuid not null references auth.users(id) on delete restrict,
  creator_id uuid not null references public.fans_creators(id) on delete restrict, post_id uuid references public.fans_posts(id) on delete restrict,
  subscription_id uuid references public.fans_subscriptions(id) on delete restrict, amount numeric(12,2) not null check (amount >= 0),
  platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0), creator_amount numeric(12,2) not null default 0 check (creator_amount >= 0),
  currency char(3) not null default 'BRL', status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled')),
  provider text, provider_reference text, paid_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(post_id is not null or subscription_id is not null)
);
create table if not exists public.fans_boost_plans (
  id uuid primary key default gen_random_uuid(), name text not null unique, price numeric(12,2) not null check(price>=0),
  duration_hours integer not null check(duration_hours>0), multiplier numeric(8,2) not null default 1 check(multiplier>=1),
  status text not null default 'active' check(status in ('draft','active','inactive')), created_at timestamptz not null default now()
);
create table if not exists public.fans_boosts (
  id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.fans_creators(id) on delete cascade,
  post_id uuid not null references public.fans_posts(id) on delete cascade, plan_id uuid not null references public.fans_boost_plans(id) on delete restrict,
  starts_at timestamptz not null, ends_at timestamptz not null, status text not null default 'active' check(status in ('pending','active','expired','cancelled')),
  view_count bigint not null default 0, created_at timestamptz not null default now(), check(ends_at>starts_at)
);
create table if not exists public.fans_likes (post_id uuid not null references public.fans_posts(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now(), primary key(post_id,user_id));
create table if not exists public.fans_comments (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.fans_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, body text not null check(length(trim(body)) between 1 and 2000),
  status text not null default 'visible' check(status in ('visible','hidden','deleted')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.fans_tips (
  id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.fans_creators(id) on delete restrict,
  buyer_user_id uuid not null references auth.users(id) on delete restrict, amount numeric(12,2) not null check(amount>0),
  platform_fee numeric(12,2) not null default 0 check(platform_fee>=0), creator_amount numeric(12,2) not null check(creator_amount>=0),
  currency char(3) not null default 'BRL', message text, status text not null default 'pending' check(status in ('pending','paid','failed','refunded','cancelled')),
  provider text, provider_reference text, paid_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.fans_payout_requests (
  id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.fans_creators(id) on delete restrict,
  amount numeric(12,2) not null check(amount>0), currency char(3) not null default 'BRL', status text not null default 'requested' check(status in ('requested','processing','paid','rejected','cancelled')),
  provider text, provider_reference text, requested_at timestamptz not null default now(), processed_at timestamptz, rejection_reason text
);
create table if not exists public.fans_notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, title text not null, body text, data jsonb not null default '{}'::jsonb, read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.fans_reports (
  id uuid primary key default gen_random_uuid(), reporter_user_id uuid references auth.users(id) on delete set null,
  post_id uuid references public.fans_posts(id) on delete cascade, creator_id uuid references public.fans_creators(id) on delete cascade,
  reason text not null, details text, status text not null default 'open' check(status in ('open','reviewing','resolved','rejected')),
  resolution text, created_at timestamptz not null default now(), resolved_at timestamptz
);

create index if not exists fans_posts_creator_status_idx on public.fans_posts(creator_id,status,created_at desc);
create index if not exists fans_media_post_idx on public.fans_post_media(post_id,sort_order);
create index if not exists fans_subscriptions_user_idx on public.fans_subscriptions(subscriber_user_id,status,ends_at desc);
create index if not exists fans_purchases_buyer_idx on public.fans_purchases(buyer_user_id,status,created_at desc);
create index if not exists fans_purchases_creator_idx on public.fans_purchases(creator_id,status,created_at desc);
create index if not exists fans_notifications_user_idx on public.fans_notifications(user_id,read_at,created_at desc);

-- RLS: every Fans table is protected; the main Pecatho tables are not changed by this migration.
alter table public.fans_creators enable row level security;
alter table public.fans_plans enable row level security;
alter table public.fans_posts enable row level security;
alter table public.fans_post_media enable row level security;
alter table public.fans_subscriptions enable row level security;
alter table public.fans_purchases enable row level security;
alter table public.fans_boost_plans enable row level security;
alter table public.fans_boosts enable row level security;
alter table public.fans_likes enable row level security;
alter table public.fans_comments enable row level security;
alter table public.fans_tips enable row level security;
alter table public.fans_payout_requests enable row level security;
alter table public.fans_notifications enable row level security;
alter table public.fans_reports enable row level security;

revoke all on table public.fans_creators,public.fans_plans,public.fans_posts,public.fans_post_media,public.fans_subscriptions,public.fans_purchases,public.fans_boost_plans,public.fans_boosts,public.fans_likes,public.fans_comments,public.fans_tips,public.fans_payout_requests,public.fans_notifications,public.fans_reports from anon,authenticated;
grant select on public.fans_creators,public.fans_plans,public.fans_posts,public.fans_boost_plans to anon,authenticated;
grant select,insert,update on public.fans_creators,public.fans_plans,public.fans_posts,public.fans_post_media,public.fans_subscriptions,public.fans_purchases,public.fans_boosts,public.fans_likes,public.fans_comments,public.fans_tips,public.fans_payout_requests,public.fans_notifications,public.fans_reports to authenticated;
grant delete on public.fans_likes,public.fans_comments to authenticated;

create policy fans_creators_public_select on public.fans_creators for select to anon,authenticated using(status='active');
create policy fans_creators_owner_write on public.fans_creators for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy fans_plans_public_select on public.fans_plans for select to anon,authenticated using(status='active');
create policy fans_plans_owner_write on public.fans_plans for all to authenticated using(creator_id in(select id from public.fans_creators where user_id=(select auth.uid()))) with check(creator_id in(select id from public.fans_creators where user_id=(select auth.uid())));
create policy fans_posts_public_select on public.fans_posts for select to anon,authenticated using(status='published' and(access_type='free' or price=0));
create policy fans_posts_owner_write on public.fans_posts for all to authenticated using(creator_id in(select id from public.fans_creators where user_id=(select auth.uid()))) with check(creator_id in(select id from public.fans_creators where user_id=(select auth.uid())));
create policy fans_media_owner_write on public.fans_post_media for all to authenticated using(post_id in(select p.id from public.fans_posts p join public.fans_creators c on c.id=p.creator_id where c.user_id=(select auth.uid()))) with check(post_id in(select p.id from public.fans_posts p join public.fans_creators c on c.id=p.creator_id where c.user_id=(select auth.uid())));
create policy fans_subscriptions_participant_select on public.fans_subscriptions for select to authenticated using(subscriber_user_id=(select auth.uid()) or creator_id in(select id from public.fans_creators where user_id=(select auth.uid())));
create policy fans_purchases_participant_select on public.fans_purchases for select to authenticated using(buyer_user_id=(select auth.uid()) or creator_id in(select id from public.fans_creators where user_id=(select auth.uid())));
create policy fans_boost_plans_public_select on public.fans_boost_plans for select to anon,authenticated using(status='active');
create policy fans_boosts_owner_select on public.fans_boosts for select to authenticated using(creator_id in(select id from public.fans_creators where user_id=(select auth.uid())));
create policy fans_boosts_owner_write on public.fans_boosts for all to authenticated using(creator_id in(select id from public.fans_creators where user_id=(select auth.uid()))) with check(creator_id in(select id from public.fans_creators where user_id=(select auth.uid())));
create policy fans_likes_select on public.fans_likes for select to authenticated using(true);
create policy fans_likes_insert on public.fans_likes for insert to authenticated with check(user_id=(select auth.uid()));
create policy fans_likes_delete on public.fans_likes for delete to authenticated using(user_id=(select auth.uid()));
create policy fans_comments_select on public.fans_comments for select to anon,authenticated using(status='visible');
create policy fans_comments_insert on public.fans_comments for insert to authenticated with check(user_id=(select auth.uid()));
create policy fans_comments_owner_update on public.fans_comments for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy fans_comments_owner_delete on public.fans_comments for delete to authenticated using(user_id=(select auth.uid()));
create policy fans_tips_participant_select on public.fans_tips for select to authenticated using(buyer_user_id=(select auth.uid()) or creator_id in(select id from public.fans_creators where user_id=(select auth.uid())));
create policy fans_tips_buyer_insert on public.fans_tips for insert to authenticated with check(buyer_user_id=(select auth.uid()));
create policy fans_payout_owner_select on public.fans_payout_requests for select to authenticated using(creator_id in(select id from public.fans_creators where user_id=(select auth.uid())));
create policy fans_payout_owner_insert on public.fans_payout_requests for insert to authenticated with check(creator_id in(select id from public.fans_creators where user_id=(select auth.uid())));
create policy fans_notifications_owner_select on public.fans_notifications for select to authenticated using(user_id=(select auth.uid()));
create policy fans_notifications_owner_update on public.fans_notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy fans_reports_insert on public.fans_reports for insert to authenticated with check(reporter_user_id=(select auth.uid()));
create policy fans_reports_owner_select on public.fans_reports for select to authenticated using(reporter_user_id=(select auth.uid()));
