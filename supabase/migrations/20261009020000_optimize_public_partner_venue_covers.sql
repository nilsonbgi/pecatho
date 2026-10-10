CREATE OR REPLACE FUNCTION private.get_public_partner_venue_covers(p_venue_ids uuid[])
RETURNS TABLE(venue_id uuid, preview_storage_bucket text, preview_storage_path text, is_primary boolean, sort_order integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT ranked.venue_id,
         ranked.preview_storage_bucket,
         ranked.preview_storage_path,
         ranked.is_primary,
         ranked.sort_order
  FROM (
    SELECT m.venue_id,
           m.preview_storage_bucket,
           m.preview_storage_path,
           m.is_primary,
           m.sort_order,
           row_number() OVER (
             PARTITION BY m.venue_id
             ORDER BY m.is_primary DESC, m.sort_order, m.created_at
           ) AS cover_rank
    FROM public.partner_venue_media AS m
    JOIN public.partner_venues AS v ON v.id = m.venue_id
    WHERE m.venue_id = ANY (COALESCE(p_venue_ids, ARRAY[]::uuid[]))
      AND v.status = 'published'
      AND m.moderation_status = 'approved'
      AND m.kind = 'image'
      AND m.preview_storage_bucket = 'pecatho-partner-media'
      AND NULLIF(m.preview_storage_path, '') IS NOT NULL
  ) AS ranked
  WHERE ranked.cover_rank = 1
  ORDER BY ranked.venue_id;
$function$;

REVOKE ALL ON FUNCTION private.get_public_partner_venue_covers(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_public_partner_venue_covers(uuid[]) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_public_partner_venue_covers(p_venue_ids uuid[])
RETURNS TABLE(venue_id uuid, preview_storage_bucket text, preview_storage_path text, is_primary boolean, sort_order integer)
LANGUAGE sql
SET search_path TO ''
AS $function$
  SELECT * FROM private.get_public_partner_venue_covers(p_venue_ids);
$function$;

REVOKE ALL ON FUNCTION public.get_public_partner_venue_covers(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_partner_venue_covers(uuid[]) TO anon, authenticated, service_role;
