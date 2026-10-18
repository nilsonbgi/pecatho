-- Keep the profile-media purchase state constraint aligned with terminal settlement.
-- Chargebacks are terminal financial outcomes and must be representable in this table.
ALTER TABLE public.profile_media_purchases
  DROP CONSTRAINT IF EXISTS profile_media_purchases_status_check;

ALTER TABLE public.profile_media_purchases
  ADD CONSTRAINT profile_media_purchases_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'pending'::text,
        'paid'::text,
        'refunded'::text,
        'chargeback'::text,
        'cancelled'::text,
        'failed'::text
      ]
    )
  );
