-- Restrict sensitive profile-field bypasses to designated account administrators.
-- Finance, support, and moderation roles must not be able to alter identity,
-- verification, account-type, or account-status fields through direct profile updates.

CREATE OR REPLACE FUNCTION private.can_manage_sensitive_profiles()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('super_admin'::public.user_role, 'admin'::public.user_role)
  );
$function$;

REVOKE ALL ON FUNCTION private.can_manage_sensitive_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_manage_sensitive_profiles() FROM anon;
REVOKE ALL ON FUNCTION private.can_manage_sensitive_profiles() FROM authenticated;

CREATE OR REPLACE FUNCTION private.guard_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
BEGIN
  IF NOT private.can_manage_sensitive_profiles() THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.status IS DISTINCT FROM 'pending'::public.account_status
         OR NEW.verification_status IS DISTINCT FROM 'unverified'::public.verification_status THEN
        RAISE EXCEPTION 'A criação de conta deve iniciar em estado pendente e não verificado';
      END IF;
    ELSE
      IF (NEW.status IS DISTINCT FROM OLD.status
          AND current_setting('app.governance_status_update_authorized', true) IS DISTINCT FROM 'true')
         OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
         OR NEW.cpf IS DISTINCT FROM OLD.cpf
         OR NEW.account_type IS DISTINCT FROM OLD.account_type
         OR (
           NEW.legal_name IS DISTINCT FROM OLD.legal_name
           AND current_setting('app.profile_update_authorized', true) IS DISTINCT FROM 'true'
         )
         OR (
           NEW.birth_date IS DISTINCT FROM OLD.birth_date
           AND current_setting('app.profile_update_authorized', true) IS DISTINCT FROM 'true'
         ) THEN
        RAISE EXCEPTION 'Campos de identidade, tipo de conta, verificação ou status somente podem ser alterados pelo fluxo autorizado';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION private.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.can_manage_sensitive_profiles() THEN
    IF (NEW.status IS DISTINCT FROM OLD.status
        AND current_setting('app.governance_status_update_authorized', true) IS DISTINCT FROM 'true')
       OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
       OR NEW.account_type IS DISTINCT FROM OLD.account_type THEN
      RAISE EXCEPTION 'profile_sensitive_field_forbidden';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
