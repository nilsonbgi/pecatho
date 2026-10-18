-- Settlement balance must be read after the shared profile lock is acquired.
-- VOLATILE ensures the helper's SQL reads use a fresh snapshot rather than the
-- calling statement's snapshot, which could predate a lock wait.
ALTER FUNCTION private.payout_balance_before_settlement(uuid, uuid) VOLATILE;
