-- Expand publication-plan feature configuration without changing existing prices or plan assignments.
-- New fields are optional for backward compatibility; old plans retain their current behavior.
alter table public.publication_plans
  add constraint publication_plans_feature_gallery_flags_check check (
    (not (features ? 'photo_gallery') or jsonb_typeof(features->'photo_gallery') = 'boolean')
    and (not (features ? 'video_gallery') or jsonb_typeof(features->'video_gallery') = 'boolean')
    and (not (features ? 'featured_photo') or jsonb_typeof(features->'featured_photo') = 'boolean')
    and (not (features ? 'featured_video') or jsonb_typeof(features->'featured_video') = 'boolean')
    and (not (features ? 'highlight_card_photo') or jsonb_typeof(features->'highlight_card_photo') = 'boolean')
    and (not (features ? 'advertiser_gallery') or jsonb_typeof(features->'advertiser_gallery') = 'boolean')
    and (not (features ? 'profile_audio') or jsonb_typeof(features->'profile_audio') = 'boolean')
    and (not (features ? 'allow_reviews') or jsonb_typeof(features->'allow_reviews') = 'boolean')
    and (not (features ? 'allow_gifts') or jsonb_typeof(features->'allow_gifts') = 'boolean')
    and (not (features ? 'max_photos') or features->'max_photos' = 'null'::jsonb or
      (jsonb_typeof(features->'max_photos') = 'number' and (features->>'max_photos')::numeric between 1 and 500 and trunc((features->>'max_photos')::numeric) = (features->>'max_photos')::numeric))
    and (not (features ? 'max_videos') or features->'max_videos' = 'null'::jsonb or
      (jsonb_typeof(features->'max_videos') = 'number' and (features->>'max_videos')::numeric between 1 and 200 and trunc((features->>'max_videos')::numeric) = (features->>'max_videos')::numeric))
  ) not valid;

alter table public.publication_plans
  validate constraint publication_plans_feature_gallery_flags_check;

-- Snapshot the complete feature matrix when a professional publication is assigned.
-- Existing assignments are not rewritten, preserving their original commercial entitlements.
create or replace function public.snapshot_publication_gallery_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_plan public.publication_plans%rowtype;
  v_snapshot jsonb;
begin
  select * into v_plan from public.publication_plans where id = new.plan_id;
  if not found then
    raise exception 'PUBLICATION_PLAN_NOT_FOUND';
  end if;

  v_snapshot := coalesce(new.plan_features_snapshot, '{}'::jsonb)
    || jsonb_build_object(
      'audience', v_plan.audience,
      'has_video', v_plan.has_video,
      'featured_card', v_plan.featured_card,
      'search_priority', v_plan.search_priority,
      'show_premium_badge', v_plan.show_premium_badge,
      'profile_theme', v_plan.profile_theme,
      'max_gallery_items', v_plan.max_gallery_items,
      'features', coalesce(v_plan.features, '{}'::jsonb)
    );

  -- Duplicate the operational fields at the snapshot root for consistent server-side checks.
  v_snapshot := v_snapshot || jsonb_build_object(
    'photo_gallery', coalesce(nullif(v_plan.features->>'photo_gallery','')::boolean, true),
    'video_gallery', coalesce(nullif(v_plan.features->>'video_gallery','')::boolean, v_plan.has_video),
    'featured_photo', coalesce(nullif(v_plan.features->>'featured_photo','')::boolean, false),
    'featured_video', coalesce(nullif(v_plan.features->>'featured_video','')::boolean, false),
    'highlight_card_photo', coalesce(nullif(v_plan.features->>'highlight_card_photo','')::boolean, false),
    'advertiser_gallery', coalesce(nullif(v_plan.features->>'advertiser_gallery','')::boolean, true),
    'profile_audio', coalesce(nullif(v_plan.features->>'profile_audio','')::boolean, false),
    'allow_reviews', coalesce(nullif(v_plan.features->>'allow_reviews','')::boolean, true),
    'allow_gifts', coalesce(nullif(v_plan.features->>'allow_gifts','')::boolean, false),
    'max_photos', coalesce(v_plan.features->'max_photos', 'null'::jsonb),
    'max_videos', coalesce(v_plan.features->'max_videos', 'null'::jsonb)
  );

  new.plan_features_snapshot := v_snapshot;
  return new;
end;
$function$;

revoke all on function public.snapshot_publication_gallery_limit() from public, anon, authenticated;
