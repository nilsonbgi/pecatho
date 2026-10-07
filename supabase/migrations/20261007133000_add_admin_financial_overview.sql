CREATE OR REPLACE FUNCTION public.admin_fans_financial_overview()
RETURNS TABLE(
  participant_type text, participant_id uuid, user_id uuid, display_name text,
  gross_sales numeric, platform_fees numeric, provider_fees numeric, net_earned numeric,
  outstanding_payouts numeric, paid_out numeric, available numeric
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO pg_catalog, public, private
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT coalesce(private.is_staff(), false) THEN RAISE EXCEPTION 'Não autorizado'; END IF;
  RETURN QUERY
  WITH fan AS (
    SELECT 'fans'::text participant_type, fc.id participant_id, fc.user_id,
      coalesce(fc.display_name,'Acompanhante') display_name,
      coalesce(sum(CASE WHEN fl.entry_type='sale_gross' AND fl.direction='credit' THEN fl.amount ELSE 0 END),0) gross_sales,
      coalesce(sum(CASE WHEN fl.entry_type='platform_fee' AND fl.direction='debit' THEN fl.amount ELSE 0 END),0) platform_fees,
      coalesce(sum(CASE WHEN fl.entry_type='provider_fee' AND fl.direction='debit' THEN fl.amount ELSE 0 END),0) provider_fees,
      coalesce(sum(CASE WHEN fl.direction='credit' THEN fl.amount ELSE -fl.amount END),0) net_earned
    FROM public.fans_creators fc LEFT JOIN public.fans_financial_ledger fl ON fl.creator_id=fc.id AND fl.status='posted'
    GROUP BY fc.id,fc.user_id,fc.display_name
  ), seller AS (
    SELECT 'content'::text participant_type,p.id participant_id,p.id user_id,
      coalesce(p.display_name,p.email::text,'Vendedor de conteúdo') display_name,
      coalesce((SELECT sum(d.amount) FROM public.digital_content_sales d WHERE d.owner_user_id=p.id AND d.status='paid'),0) gross_sales,
      coalesce((SELECT sum(d.platform_fee) FROM public.digital_content_sales d WHERE d.owner_user_id=p.id AND d.status='paid'),0) platform_fees,
      coalesce((SELECT sum(greatest(d.amount-d.owner_amount-d.platform_fee,0)) FROM public.digital_content_sales d WHERE d.owner_user_id=p.id AND d.status='paid'),0) provider_fees,
      coalesce((SELECT sum(CASE WHEN le.entry_type IN ('credit','adjustment') THEN le.amount ELSE -le.amount END) FROM public.ledger_entries le WHERE le.user_id=p.id),0) net_earned
    FROM public.profiles p WHERE exists(SELECT 1 FROM public.digital_content_sales d WHERE d.owner_user_id=p.id)
  ), participants AS (SELECT * FROM fan UNION ALL SELECT * FROM seller), payouts AS (
    SELECT creator_id,seller_user_id,
      coalesce(sum(CASE WHEN status IN ('requested','approved','processing') THEN amount ELSE 0 END),0) outstanding,
      coalesce(sum(CASE WHEN status='paid' THEN amount ELSE 0 END),0) paid_out
    FROM public.fans_payout_requests GROUP BY creator_id,seller_user_id
  )
  SELECT p.participant_type,p.participant_id,p.user_id,p.display_name,round(p.gross_sales,2),round(p.platform_fees,2),round(p.provider_fees,2),round(p.net_earned,2),
    round(coalesce(py.outstanding,0),2),round(coalesce(py.paid_out,0),2),round(greatest(p.net_earned-coalesce(py.outstanding,0),0),2)
  FROM participants p LEFT JOIN payouts py ON (p.participant_type='fans' AND py.creator_id=p.participant_id) OR (p.participant_type='content' AND py.seller_user_id=p.user_id)
  ORDER BY greatest(p.net_earned-coalesce(py.outstanding,0),0) DESC,p.display_name;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_fans_financial_overview() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_fans_financial_overview() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_fans_financial_overview() TO authenticated;