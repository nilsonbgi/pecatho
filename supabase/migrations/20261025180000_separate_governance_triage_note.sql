-- Keep triage notes independent from formal administrative decision reasons.
ALTER TABLE public.governance_reports
  ADD COLUMN IF NOT EXISTS triage_note text;

-- Preserve legacy notes for reports still in triage. Finalized reports keep
-- decision_reason as the historical formal reason and are not copied.
UPDATE public.governance_reports
SET triage_note = decision_reason
WHERE triage_note IS NULL
  AND decision_reason IS NOT NULL
  AND status IN ('submitted', 'under_review', 'appealed');
