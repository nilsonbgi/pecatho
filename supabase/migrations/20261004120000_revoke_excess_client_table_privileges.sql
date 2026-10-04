-- Remove non-application table privileges that bypass row-level protections or
-- allow clients to alter database structure/constraints at runtime.
-- RLS does not constrain TRUNCATE, and application clients never need these
-- privileges for normal CRUD, Storage, RPC, checkout, messaging, or moderation flows.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Keep future tables created by the migration role from inheriting these privileges.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon, authenticated;
