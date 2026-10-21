-- Standalone creator publication entitlements for content sellers who do not maintain an advertiser profile.
create table if not exists public.pecatho_creator_publications (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.fans_creators(id) on delete restrict,
  plan_id uuid not null references public.publication_plans(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','published','paused','expired')),
  starts_at timestamptz,
  ends_at timestamptz,
  paid boolean not null default false,
  order_id uuid unique references public.orders(id) on delete restrict,
  plan_features_snapshot jsonb not null default '{}'::jsonb,
  paid_amount numeric(12,2),
  created_at timestamptz not null default now(),
  check (status <> 'published' or (starts_at is not null and ends_at is not null and ends_at>starts_at))
);
alter table public.pecatho_creator_publications enable row level security;
revoke all on public.pecatho_creator_publications from anon,authenticated;
create index if not exists pecatho_creator_publications_active_idx on public.pecatho_creator_publications(creator_id,status,ends_at desc);

create or replace function public.get_public_fans_creator_plan_features(p_creator_ids uuid[])
returns table(creator_id uuid,featured_card boolean,show_premium_badge boolean,profile_theme text,search_priority integer)
language sql stable security definer set search_path='pg_catalog'
as $function$
  select fc.id,
    coalesce(bool_or(coalesce(nullif(pub.plan_features_snapshot->>'featured_card','')::boolean,pp.featured_card)),false),
    coalesce(bool_or(coalesce(nullif(pub.plan_features_snapshot->>'show_premium_badge','')::boolean,pp.show_premium_badge)),false),
    case when coalesce(bool_or(coalesce(pub.plan_features_snapshot->>'profile_theme',pp.profile_theme)='premium'),false) then 'premium'
         when coalesce(bool_or(coalesce(pub.plan_features_snapshot->>'profile_theme',pp.profile_theme)='highlighted'),false) then 'highlighted'
         else 'standard' end,
    coalesce(max(coalesce(nullif(pub.plan_features_snapshot->>'search_priority','')::integer,pp.search_priority)),0)
  from public.fans_creators fc
  join public.pecatho_creator_publications pub on pub.creator_id=fc.id
  join public.publication_plans pp on pp.id=pub.plan_id
  where fc.id=any(coalesce(p_creator_ids,'{}'::uuid[])) and fc.status='active'
    and pub.status='published' and pub.starts_at<=now() and pub.ends_at>now()
    and coalesce(pub.plan_features_snapshot->>'audience',pp.audience) in ('content_seller','both')
  group by fc.id;
$function$;
revoke all on function public.get_public_fans_creator_plan_features(uuid[]) from public;
grant execute on function public.get_public_fans_creator_plan_features(uuid[]) to anon,authenticated;
