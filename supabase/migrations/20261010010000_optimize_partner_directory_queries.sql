CREATE INDEX IF NOT EXISTS partner_venues_city_id_idx
  ON public.partner_venues (city_id)
  WHERE city_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS partner_venue_events_published_start_idx
  ON public.partner_venue_events (venue_id, starts_at)
  WHERE status = 'published';
