-- Validate payout settlement against the raw unified balance, excluding only the payout being settled.
-- The public-facing available-balance functions clamp negative results to zero; using them
-- to authorize settlement can therefore hide a deficit caused by later reversals.
CREATE OR REPLACE FUNCTION private.payout_balance_before_settlement(
  p_user_id uuid,
  p_payout_id uuid
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
  SELECT
    COALESCE((
      SELECT SUM(
        CASE
          WHEN le.entry_type IN ('credit', 'adjustment') THEN le.amount
          ELSE -le.amount
        END
      )
      FROM public.ledger_entries le
      WHERE le.user_id = p_user_id
    ), 0)
    + COALESCE((
      SELECT SUM(
        CASE WHEN fl.direction = 'credit' THEN fl.amount ELSE -fl.amount END
      )
      FROM public.fans_financial_ledger fl
      JOIN public.fans_creators fc ON fc.id = fl.creator_id
      WHERE fc.user_id = p_user_id
        AND fl.status = 'posted'
    ), 0)
    - COALESCE((
      SELECT SUM(fpr.amount)
      FROM public.fans_payout_requests fpr
      WHERE (
        fpr.seller_user_id = p_user_id
        OR fpr.creator_id IN (
          SELECT fc.id
          FROM public.fans_creators fc
          WHERE fc.user_id = p_user_id
        )
      )
        AND fpr.status IN ('requested', 'approved', 'processing')
        AND fpr.id <> p_payout_id
    ), 0);
$function$;

REVOKE ALL ON FUNCTION private.payout_balance_before_settlement(uuid, uuid)
  FROM PUBLIC, anon, authenticated;

DO $migration$
DECLARE
  v_def text;
  v_original text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
    INTO v_def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'private'
     AND p.proname = 'admin_fans_payout_action'
     AND pg_get_function_identity_arguments(p.oid) =
       'p_payout_id uuid, p_action text, p_provider text, p_provider_reference text, p_reason text';

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'admin_fans_payout_action signature not found';
  END IF;

  v_original := v_def;
  v_def := regexp_replace(
    v_def,
    'v_balance :=[[:space:]]*private[.]seller_payout_available[(]v_user_id[)][[:space:]]*[+][[:space:]]*v_payout[.]amount;',
    'v_balance := private.payout_balance_before_settlement(v_user_id, v_payout.id);',
    'g'
  );
  v_def := regexp_replace(
    v_def,
    'v_balance :=[[:space:]]*private[.]fans_payout_available[(]v_payout[.]creator_id[)][[:space:]]*[+][[:space:]]*v_payout[.]amount;',
    'v_balance := private.payout_balance_before_settlement(v_user_id, v_payout.id);',
    'g'
  );

  IF v_def = v_original THEN
    RAISE EXCEPTION 'Payout settlement balance checks were not found; refusing partial migration';
  END IF;

  IF position('private.payout_balance_before_settlement(v_user_id, v_payout.id)' in v_def) < 1 THEN
    RAISE EXCEPTION 'Payout settlement helper was not installed in admin function';
  END IF;

  EXECUTE v_def;
END
$migration$;
