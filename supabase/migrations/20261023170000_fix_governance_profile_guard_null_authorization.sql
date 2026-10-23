-- Ensure sensitive profile-field authorization checks fail closed when the
-- transaction setting is absent (current_setting(..., true) returns NULL).
CREATE OR REPLACE FUNCTION private.guard_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
BEGIN
  IF NOT private.is_staff() THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.status <> 'pending'::public.account_status
         OR NEW.verification_status <> 'unverified'::public.verification_status THEN
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
