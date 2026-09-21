-- Normalize legacy advertiser reference prices into the structured periods model.
-- 1 hour is the canonical reference period.
update public.advertiser_profiles
set pricing = jsonb_set(
  coalesce(pricing, '{}'::jsonb),
  '{periods}',
  jsonb_build_array(
    jsonb_build_object(
      'minutes', 60,
      'price', (pricing->>'price')::numeric,
      'period', '1 Hora'
    )
  ),
  true
)
where pricing ? 'price'
  and not (pricing ? 'periods')
  and nullif(pricing->>'price', '') is not null
  and (pricing->>'price')::numeric >= 0;