-- Include creator/Fans payouts in the unified seller financial summary and exclude them from other debits.

CREATE OR REPLACE FUNCTION public.seller_payout_financial_summary()
 RETURNS TABLE(credits numeric, fees numeric, reversals numeric, paid_out numeric, other_debits numeric, requested numeric, available numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE((
      SELECT SUM(le.amount)
      FROM public.ledger_entries le
      WHERE le.user_id = v_user_id
        AND le.entry_type IN ('credit', 'adjustment')
    ), 0)
    + COALESCE((
      SELECT SUM(fl.amount)
      FROM public.fans_financial_ledger fl
      JOIN public.fans_creators fc ON fc.id = fl.creator_id
      WHERE fc.user_id = v_user_id
        AND fl.status = 'posted'
        AND fl.direction = 'credit'
    ), 0),
    COALESCE((
      SELECT SUM(le.amount)
      FROM public.ledger_entries le
      WHERE le.user_id = v_user_id AND le.entry_type = 'fee'
    ), 0)
    + COALESCE((
      SELECT SUM(fl.amount)
      FROM public.fans_financial_ledger fl
      JOIN public.fans_creators fc ON fc.id = fl.creator_id
      WHERE fc.user_id = v_user_id
        AND fl.status = 'posted'
        AND fl.direction = 'debit'
        AND fl.entry_type ~* '(fee|commission|taxa)'
    ), 0),
    COALESCE((
      SELECT SUM(le.amount)
      FROM public.ledger_entries le
      WHERE le.user_id = v_user_id
        AND le.entry_type IN ('refund', 'chargeback')
    ), 0)
    + COALESCE((
      SELECT SUM(fl.amount)
      FROM public.fans_financial_ledger fl
      JOIN public.fans_creators fc ON fc.id = fl.creator_id
      WHERE fc.user_id = v_user_id
        AND fl.status = 'posted'
        AND fl.direction = 'debit'
        AND fl.entry_type ~* '(refund|chargeback|reversal|estorno)'
    ), 0),
    COALESCE((
      SELECT SUM(le.amount)
      FROM public.ledger_entries le
      WHERE le.user_id = v_user_id AND le.entry_type = 'payout'
    ), 0)
    + COALESCE((
      SELECT SUM(fl.amount)
      FROM public.fans_financial_ledger fl
      JOIN public.fans_creators fc ON fc.id = fl.creator_id
      WHERE fc.user_id = v_user_id
        AND fl.status = 'posted'
        AND fl.direction = 'debit'
        AND fl.entry_type = 'payout'
    ), 0),
    COALESCE((
      SELECT SUM(le.amount)
      FROM public.ledger_entries le
      WHERE le.user_id = v_user_id
        AND le.entry_type NOT IN ('credit', 'adjustment', 'fee', 'refund', 'chargeback', 'payout')
    ), 0)
    + COALESCE((
      SELECT SUM(fl.amount)
      FROM public.fans_financial_ledger fl
      JOIN public.fans_creators fc ON fc.id = fl.creator_id
      WHERE fc.user_id = v_user_id
        AND fl.status = 'posted'
        AND fl.direction = 'debit'
        AND fl.entry_type !~* '(fee|commission|taxa|refund|chargeback|reversal|estorno|payout)'
    ), 0),
    COALESCE((
      SELECT SUM(fpr.amount)
      FROM public.fans_payout_requests fpr
      WHERE (fpr.seller_user_id = v_user_id OR fpr.creator_id IN (
        SELECT fc.id FROM public.fans_creators fc WHERE fc.user_id = v_user_id
      ))
        AND fpr.status IN ('requested', 'approved', 'processing')
    ), 0),
    private.seller_payout_available(v_user_id);
END;
$function$
