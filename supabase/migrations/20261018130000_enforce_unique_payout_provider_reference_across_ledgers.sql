-- Enforce payout-provider-reference uniqueness across both seller ledgers.
-- A provider reference must not settle two distinct payouts, even when one payout
-- belongs to a content seller and the other belongs to a Fans creator.

CREATE OR REPLACE FUNCTION private.guard_unique_payout_provider_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
DECLARE
  v_provider text;
  v_reference text;
  v_conflict boolean;
BEGIN
  IF TG_TABLE_SCHEMA = 'public' AND TG_TABLE_NAME = 'ledger_entries' THEN
    IF NEW.entry_type::text <> 'payout' THEN
      RETURN NEW;
    END IF;

    v_provider := lower(nullif(trim(coalesce(NEW.metadata->>'provider', '')), ''));
    v_reference := lower(nullif(trim(coalesce(NEW.metadata->>'provider_reference', '')), ''));

  ELSIF TG_TABLE_SCHEMA = 'public' AND TG_TABLE_NAME = 'fans_financial_ledger' THEN
    IF NEW.entry_type <> 'payout' OR NEW.status <> 'posted' THEN
      RETURN NEW;
    END IF;

    v_provider := lower(nullif(trim(coalesce(NEW.provider, '')), ''));
    v_reference := lower(nullif(trim(coalesce(NEW.provider_reference, '')), ''));

  ELSE
    RETURN NEW;
  END IF;

  IF v_provider IS NULL OR v_reference IS NULL THEN
    RAISE EXCEPTION 'Provedor e referência são obrigatórios para contabilizar um saque';
  END IF;

  -- Serialize the same provider/reference pair across both ledger tables.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_provider || ':' || v_reference, 0)
  );

  IF TG_TABLE_NAME = 'ledger_entries' THEN
    SELECT EXISTS (
      SELECT 1
        FROM public.fans_financial_ledger fl
       WHERE fl.entry_type = 'payout'
         AND fl.status = 'posted'
         AND lower(trim(fl.provider)) = v_provider
         AND lower(trim(fl.provider_reference)) = v_reference
    ) INTO v_conflict;

    IF v_conflict THEN
      RAISE EXCEPTION 'A referência do provedor já foi utilizada em outro saque';
    END IF;

    SELECT EXISTS (
      SELECT 1
        FROM public.ledger_entries le
       WHERE le.entry_type::text = 'payout'
         AND lower(trim(coalesce(le.metadata->>'provider', ''))) = v_provider
         AND lower(trim(coalesce(le.metadata->>'provider_reference', ''))) = v_reference
         AND le.id IS DISTINCT FROM NEW.id
    ) INTO v_conflict;

  ELSE
    SELECT EXISTS (
      SELECT 1
        FROM public.ledger_entries le
       WHERE le.entry_type::text = 'payout'
         AND lower(trim(coalesce(le.metadata->>'provider', ''))) = v_provider
         AND lower(trim(coalesce(le.metadata->>'provider_reference', ''))) = v_reference
    ) INTO v_conflict;

    IF v_conflict THEN
      RAISE EXCEPTION 'A referência do provedor já foi utilizada em outro saque';
    END IF;

    SELECT EXISTS (
      SELECT 1
        FROM public.fans_financial_ledger fl
       WHERE fl.entry_type = 'payout'
         AND fl.status = 'posted'
         AND lower(trim(fl.provider)) = v_provider
         AND lower(trim(fl.provider_reference)) = v_reference
         AND fl.id IS DISTINCT FROM NEW.id
    ) INTO v_conflict;
  END IF;

  IF v_conflict THEN
    RAISE EXCEPTION 'A referência do provedor já foi utilizada em outro saque';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_unique_payout_provider_reference() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_payout_provider_reference_on_ledger_entries
  ON public.ledger_entries;
CREATE TRIGGER guard_payout_provider_reference_on_ledger_entries
  BEFORE INSERT OR UPDATE OF entry_type, metadata
  ON public.ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_unique_payout_provider_reference();

DROP TRIGGER IF EXISTS guard_payout_provider_reference_on_fans_ledger
  ON public.fans_financial_ledger;
CREATE TRIGGER guard_payout_provider_reference_on_fans_ledger
  BEFORE INSERT OR UPDATE OF entry_type, provider, provider_reference, status
  ON public.fans_financial_ledger
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_unique_payout_provider_reference();
