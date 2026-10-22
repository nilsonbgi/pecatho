-- Enforce publication-plan review and gift entitlements at the database boundary.
-- Legacy assignments with no explicit flag keep their existing behavior.
-- No prices, plan assignments, subscriptions, orders, or existing reviews/gifts are rewritten.

create or replace function public.publication_feature_entitlement(
  p_entity_type text,
  p_entity_id uuid,
  p_feature text
) returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  with active_entitlements as (
    select
      case p_feature
        when 'allow_reviews' then coalesce(
          nullif(pub.plan_features_snapshot->>'allow_reviews','')::boolean,
          nullif(pub.plan_features_snapshot #>> '{features,allow_reviews}','')::boolean,
          nullif(pp.features->>'allow_reviews','')::boolean,
          true
        )
        when 'allow_gifts' then case
          when (coalesce(pub.plan_features_snapshot->'features','{}'::jsonb) ? 'allow_gifts')
            or (coalesce(pp.features,'{}'::jsonb) ? 'allow_gifts')
          then coalesce(
            nullif(pub.plan_features_snapshot->>'allow_gifts','')::boolean,
            nullif(pub.plan_features_snapshot #>> '{features,allow_gifts}','')::boolean,
            nullif(pp.features->>'allow_gifts','')::boolean,
            true
          )
          else true
        end
        else true
      end as allowed
    from public.profile_publications pub
    join public.publication_plans pp on pp.id = pub.plan_id
    where p_entity_type = 'advertiser'
      and pub.profile_id = p_entity_id
      and pub.status::text = 'published'
      and pub.starts_at <= now()
      and pub.ends_at > now()
      and coalesce(pub.plan_features_snapshot->>'audience', pp.audience) in (
        'both',
        case
          when exists (
            select 1 from public.fans_creators fc
            where fc.advertiser_profile_id = pub.profile_id and fc.status = 'active'
          ) then 'content_seller'
          else 'companion'
        end
      )

    union all

    select
      case p_feature
        when 'allow_reviews' then coalesce(
          nullif(cp.plan_features_snapshot->>'allow_reviews','')::boolean,
          nullif(cp.plan_features_snapshot #>> '{features,allow_reviews}','')::boolean,
          nullif(pp.features->>'allow_reviews','')::boolean,
          true
        )
        when 'allow_gifts' then case
          when (coalesce(cp.plan_features_snapshot->'features','{}'::jsonb) ? 'allow_gifts')
            or (coalesce(pp.features,'{}'::jsonb) ? 'allow_gifts')
          then coalesce(
            nullif(cp.plan_features_snapshot->>'allow_gifts','')::boolean,
            nullif(cp.plan_features_snapshot #>> '{features,allow_gifts}','')::boolean,
            nullif(pp.features->>'allow_gifts','')::boolean,
            true
          )
          else true
        end
        else true
      end as allowed
    from public.pecatho_creator_publications cp
    join public.publication_plans pp on pp.id = cp.plan_id
    join public.fans_creators fc on fc.id = cp.creator_id
    where p_entity_type = 'creator'
      and cp.creator_id = p_entity_id
      and fc.status = 'active'
      and cp.status = 'published'
      and cp.starts_at <= now()
      and cp.ends_at > now()
      and coalesce(cp.plan_features_snapshot->>'audience', pp.audience) in ('content_seller','both')
  )
  select case
    when count(*) = 0 then null
    else bool_or(allowed)
  end
  from active_entitlements;
$function$;

revoke all on function public.publication_feature_entitlement(text, uuid, text) from public, anon;
grant execute on function public.publication_feature_entitlement(text, uuid, text) to authenticated;

create or replace function public.enforce_publication_social_entitlements()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_entity_type text;
  v_entity_id uuid;
  v_feature text;
  v_allowed boolean;
begin
  if tg_table_name = 'profile_feedback' then
    v_entity_type := 'advertiser';
    v_entity_id := new.profile_id;
    v_feature := 'allow_reviews';
  elsif tg_table_name = 'content_seller_reviews' then
    v_entity_type := new.owner_type;
    v_entity_id := new.owner_id;
    v_feature := 'allow_reviews';
  elsif tg_table_name = 'pecatho_gifts' then
    v_entity_type := new.recipient_type;
    v_entity_id := new.recipient_id;
    v_feature := 'allow_gifts';
  else
    raise exception 'UNSUPPORTED_PUBLICATION_ENTITLEMENT_TARGET';
  end if;

  if v_entity_type is null or v_entity_type not in ('advertiser','creator') or v_entity_id is null then
    raise exception 'INVALID_PUBLICATION_ENTITLEMENT_TARGET';
  end if;

  v_allowed := public.publication_feature_entitlement(v_entity_type, v_entity_id, v_feature);

  -- NULL means no active publication plan: preserve the existing legacy behavior.
  if v_allowed is false then
    if v_feature = 'allow_reviews' then
      raise exception 'REVIEWS_NOT_INCLUDED_IN_PUBLICATION_PLAN';
    else
      raise exception 'GIFTS_NOT_INCLUDED_IN_PUBLICATION_PLAN';
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function public.enforce_publication_social_entitlements() from public, anon, authenticated;

drop trigger if exists profile_feedback_publication_entitlement on public.profile_feedback;
create trigger profile_feedback_publication_entitlement
before insert on public.profile_feedback
for each row execute function public.enforce_publication_social_entitlements();

drop trigger if exists content_seller_reviews_publication_entitlement on public.content_seller_reviews;
create trigger content_seller_reviews_publication_entitlement
before insert on public.content_seller_reviews
for each row execute function public.enforce_publication_social_entitlements();

drop trigger if exists pecatho_gifts_publication_entitlement on public.pecatho_gifts;
create trigger pecatho_gifts_publication_entitlement
before insert on public.pecatho_gifts
for each row execute function public.enforce_publication_social_entitlements();
