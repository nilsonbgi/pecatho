-- Test-only catalog: four content-seller publication tiers mirroring the companion tier structure.
-- Prices and benefit limits are fictional validation values and must be reviewed in the admin catalog.
-- Idempotent: existing content_seller plans are preserved and never overwritten.
insert into public.publication_plans (
  name, description, duration_days, price, currency, active, free, position_id,
  has_video, features, audience, featured_card, search_priority, show_premium_badge,
  profile_theme, max_gallery_items
)
select
  seed.name, seed.description, seed.duration_days, seed.price, 'BRL', true, seed.free, null,
  seed.has_video, seed.features, 'content_seller', seed.featured_card, seed.search_priority,
  seed.show_premium_badge, seed.profile_theme, seed.max_gallery_items
from (
  values
    (
      'Plano Grátis',
      'PLANO DE TESTE — valores e limites fictícios para validação. Edite antes da publicação comercial.',
      365, 0.00::numeric, true, false, 0, false, false, 'standard'::text, 20,
      jsonb_build_object(
        'photo_gallery', true, 'video_gallery', false, 'max_photos', 20, 'max_videos', null,
        'featured_photo', false, 'featured_video', false, 'highlight_card_photo', false,
        'advertiser_gallery', true, 'profile_audio', false, 'allow_reviews', true, 'allow_gifts', false
      )
    ),
    (
      'Pecatho Destaque',
      'PLANO DE TESTE — valores e limites fictícios para validação. Edite antes da publicação comercial.',
      30, 19.90::numeric, false, true, 10, true, true, 'highlighted'::text, 98,
      jsonb_build_object(
        'photo_gallery', true, 'video_gallery', true, 'max_photos', 80, 'max_videos', 5,
        'featured_photo', true, 'featured_video', false, 'highlight_card_photo', true,
        'advertiser_gallery', true, 'profile_audio', false, 'allow_reviews', true, 'allow_gifts', false
      )
    ),
    (
      'Pecatho Premium',
      'PLANO DE TESTE — valores e limites fictícios para validação. Edite antes da publicação comercial.',
      30, 39.90::numeric, false, true, 20, true, true, 'standard'::text, 200,
      jsonb_build_object(
        'photo_gallery', true, 'video_gallery', true, 'max_photos', 150, 'max_videos', 15,
        'featured_photo', true, 'featured_video', true, 'highlight_card_photo', true,
        'advertiser_gallery', true, 'profile_audio', true, 'allow_reviews', true, 'allow_gifts', true
      )
    ),
    (
      'Plano Elite',
      'PLANO DE TESTE — valores e limites fictícios para validação. Edite antes da publicação comercial.',
      30, 59.90::numeric, false, true, 30, true, true, 'premium'::text, 301,
      jsonb_build_object(
        'photo_gallery', true, 'video_gallery', true, 'max_photos', 250, 'max_videos', 30,
        'featured_photo', true, 'featured_video', true, 'highlight_card_photo', true,
        'advertiser_gallery', true, 'profile_audio', true, 'allow_reviews', true, 'allow_gifts', true
      )
    )
) as seed(name, description, duration_days, price, free, has_video, search_priority, featured_card, show_premium_badge, profile_theme, max_gallery_items, features)
where not exists (
  select 1 from public.publication_plans existing
  where existing.audience = 'content_seller' and existing.name = seed.name
);
