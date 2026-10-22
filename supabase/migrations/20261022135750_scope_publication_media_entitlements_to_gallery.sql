-- Keep publication-plan gallery entitlements scoped to media explicitly placed in the profile gallery.
-- Private/paid media stored in profile_media must not consume gallery quotas or require a public-gallery video entitlement.

create or replace function public.enforce_publication_media_feature_matrix()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_entitlement_count integer := 0;
  v_photo_gallery boolean := true;
  v_video_gallery boolean := false;
  v_max_photos integer;
  v_max_videos integer;
  v_media_count integer := 0;
begin
  -- The publication feature matrix applies only to media that the owner is adding to the public profile gallery.
  if not coalesce(new.show_in_gallery, false) then
    return new;
  end if;

  with active_entitlements as (
    select
      coalesce(nullif(pub.plan_features_snapshot->>'photo_gallery','')::boolean,
        coalesce(nullif(pp.features->>'photo_gallery','')::boolean,true)) as photo_gallery,
      coalesce(nullif(pub.plan_features_snapshot->>'video_gallery','')::boolean,
        coalesce(nullif(pp.features->>'video_gallery','')::boolean,pp.has_video)) as video_gallery,
      case when pub.plan_features_snapshot ? 'max_photos'
        then nullif(pub.plan_features_snapshot->>'max_photos','')::integer
        else nullif(pp.features->>'max_photos','')::integer end as max_photos,
      case when pub.plan_features_snapshot ? 'max_videos'
        then nullif(pub.plan_features_snapshot->>'max_videos','')::integer
        else nullif(pp.features->>'max_videos','')::integer end as max_videos
    from public.profile_publications pub
    join public.publication_plans pp on pp.id=pub.plan_id
    where pub.profile_id=new.profile_id and pub.status::text='published'
      and pub.starts_at<=now() and pub.ends_at>now()
      and coalesce(pub.plan_features_snapshot->>'audience',pp.audience) in (
        'both', case when exists(select 1 from public.fans_creators fc where fc.advertiser_profile_id=new.profile_id and fc.status='active')
          then 'content_seller' else 'companion' end
      )
    union all
    select
      coalesce(nullif(cp.plan_features_snapshot->>'photo_gallery','')::boolean,
        coalesce(nullif(pp.features->>'photo_gallery','')::boolean,true)) as photo_gallery,
      coalesce(nullif(cp.plan_features_snapshot->>'video_gallery','')::boolean,
        coalesce(nullif(pp.features->>'video_gallery','')::boolean,pp.has_video)) as video_gallery,
      case when cp.plan_features_snapshot ? 'max_photos'
        then nullif(cp.plan_features_snapshot->>'max_photos','')::integer
        else nullif(pp.features->>'max_photos','')::integer end as max_photos,
      case when cp.plan_features_snapshot ? 'max_videos'
        then nullif(cp.plan_features_snapshot->>'max_videos','')::integer
        else nullif(pp.features->>'max_videos','')::integer end as max_videos
    from public.pecatho_creator_publications cp
    join public.fans_creators fc on fc.id=cp.creator_id
    join public.publication_plans pp on pp.id=cp.plan_id
    where fc.advertiser_profile_id=new.profile_id and fc.status='active'
      and cp.status='published' and cp.starts_at<=now() and cp.ends_at>now()
      and coalesce(cp.plan_features_snapshot->>'audience',pp.audience) in ('content_seller','both')
  )
  select count(*)::integer, coalesce(bool_or(photo_gallery),true), coalesce(bool_or(video_gallery),false),
    max(max_photos), max(max_videos)
  into v_entitlement_count,v_photo_gallery,v_video_gallery,v_max_photos,v_max_videos
  from active_entitlements;

  if v_entitlement_count=0 then
    return new;
  end if;

  if new.kind='video' and not v_video_gallery then
    raise exception 'VIDEO_REQUIRES_ELIGIBLE_PUBLICATION_PLAN';
  end if;
  if new.kind<>'video' and not v_photo_gallery then
    raise exception 'PHOTO_GALLERY_NOT_INCLUDED_IN_PLAN';
  end if;

  if tg_op='UPDATE' then
    select count(*)::integer into v_media_count
    from public.profile_media pm
    where pm.profile_id=new.profile_id and pm.kind=new.kind
      and pm.show_in_gallery=true and pm.id<>new.id;
  else
    select count(*)::integer into v_media_count
    from public.profile_media pm
    where pm.profile_id=new.profile_id and pm.kind=new.kind
      and pm.show_in_gallery=true;
  end if;

  if new.kind='video' and v_max_videos is not null and v_media_count>=v_max_videos then
    raise exception 'PUBLICATION_VIDEO_LIMIT_REACHED'
      using detail=format('O plano vigente permite até %s vídeos.',v_max_videos);
  end if;
  if new.kind<>'video' and v_max_photos is not null and v_media_count>=v_max_photos then
    raise exception 'PUBLICATION_PHOTO_LIMIT_REACHED'
      using detail=format('O plano vigente permite até %s fotos.',v_max_photos);
  end if;

  return new;
end;
$function$;

create or replace function public.enforce_publication_video_entitlement()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  -- A video that is not being exposed in the public gallery is not a publication-plan gallery item.
  if coalesce(new.show_in_gallery, false) and new.kind='video' and not exists (
    select 1
    from public.profile_publications pub
    join public.publication_plans pp on pp.id=pub.plan_id
    where pub.profile_id=new.profile_id and pub.status::text='published'
      and pub.starts_at<=now() and pub.ends_at>now()
      and coalesce(nullif(pub.plan_features_snapshot->>'has_video','')::boolean,pp.has_video)=true
      and coalesce(pub.plan_features_snapshot->>'audience',pp.audience) in ('both',
        case when exists(select 1 from public.fans_creators fc where fc.advertiser_profile_id=new.profile_id and fc.status='active') then 'content_seller' else 'companion' end)
  ) then
    raise exception 'VIDEO_REQUIRES_ELIGIBLE_PUBLICATION_PLAN';
  end if;
  return new;
end;
$function$;

revoke all on function public.enforce_publication_media_feature_matrix() from public, anon, authenticated;
revoke all on function public.enforce_publication_video_entitlement() from public, anon, authenticated;
