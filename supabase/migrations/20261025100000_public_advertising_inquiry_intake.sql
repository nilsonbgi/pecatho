-- Public intake for advertising inquiries, stored in the existing banners campaign ledger.
-- Requests remain inactive until staff reviews them and prepares the campaign creative.
CREATE OR REPLACE FUNCTION public.submit_public_advertising_inquiry(
  p_contact_name text,
  p_company_name text,
  p_email text,
  p_whatsapp text,
  p_placement text,
  p_budget text,
  p_message text,
  p_website text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_id uuid;
  v_name text := left(trim(coalesce(p_contact_name, '')), 120);
  v_company text := left(trim(coalesce(p_company_name, '')), 160);
  v_email text := lower(left(trim(coalesce(p_email, '')), 254));
  v_whatsapp text := left(trim(coalesce(p_whatsapp, '')), 40);
  v_placement text := left(trim(coalesce(p_placement, 'home')), 40);
  v_budget text := left(trim(coalesce(p_budget, '')), 80);
  v_message text := left(trim(coalesce(p_message, '')), 3000);
BEGIN
  -- Honeypot: silently discard bot submissions without exposing internal state.
  IF nullif(trim(coalesce(p_website, '')), '') IS NOT NULL THEN
    RETURN NULL;
  END IF;

  IF v_name = '' OR v_company = '' OR v_email = '' OR v_message = '' THEN
    RAISE EXCEPTION 'Preencha nome, empresa, e-mail e mensagem.';
  END IF;
  IF v_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$' THEN
    RAISE EXCEPTION 'Informe um e-mail válido.';
  END IF;
  IF length(trim(coalesce(p_contact_name, ''))) > 120
    OR length(trim(coalesce(p_company_name, ''))) > 160
    OR length(trim(coalesce(p_message, ''))) > 3000 THEN
    RAISE EXCEPTION 'Um dos campos excede o limite permitido.';
  END IF;

  IF v_placement NOT IN ('home', 'home_top', 'home_mid', 'home_bottom', 'fans', 'catalog') THEN
    v_placement := 'home';
  END IF;

  INSERT INTO public.banners (
    title, image_path, link_url, target, placement, sort_order, active, starts_at, ends_at, metadata
  ) VALUES (
    'Solicitação comercial: ' || v_company,
    NULL,
    NULL,
    '_self',
    v_placement,
    0,
    false,
    NULL,
    NULL,
    jsonb_build_object(
      'campaign_type', 'advertiser',
      'campaign_status', 'lead',
      'advertiser_name', v_company,
      'contact_name', v_name,
      'contact_email', v_email,
      'contact_whatsapp', nullif(v_whatsapp, ''),
      'commercial_value', nullif(v_budget, ''),
      'notes', v_message,
      'intake_source', 'public_advertising_form',
      'submitted_at', now()
    )
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_public_advertising_inquiry(text,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_advertising_inquiry(text,text,text,text,text,text,text,text) TO anon, authenticated;
