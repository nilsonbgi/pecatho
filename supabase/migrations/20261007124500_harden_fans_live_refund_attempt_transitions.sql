CREATE OR REPLACE FUNCTION public.complete_fans_live_refund_attempt(p_attempt_id uuid,p_provider_reference text DEFAULT NULL::text,p_response_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog','public' AS $function$
DECLARE v_attempt public.fans_live_refund_attempts%rowtype;
BEGIN
 SELECT * INTO v_attempt FROM public.fans_live_refund_attempts WHERE id=p_attempt_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Tentativa de reembolso não encontrada.'; END IF;
 IF v_attempt.status='succeeded' THEN RETURN jsonb_build_object('ok',true,'idempotent',true,'session_id',v_attempt.session_id,'attempt_id',p_attempt_id); END IF;
 IF v_attempt.status<>'started' THEN RETURN jsonb_build_object('ok',false,'idempotent',true,'reason','attempt_not_started','status',v_attempt.status,'session_id',v_attempt.session_id,'attempt_id',p_attempt_id); END IF;
 UPDATE public.fans_live_refund_attempts SET status='succeeded',failure_class=null,error_code=null,error_message=null,http_status=null,completed_at=now(),response_metadata=coalesce(p_response_metadata,'{}'::jsonb) WHERE id=p_attempt_id AND status='started';
 UPDATE public.fans_live_sessions SET refund_status='refunded',refund_processed_at=now(),refund_next_attempt_at=null,refund_last_error=null,refund_failure_class=null,refund_provider_reference=coalesce(p_provider_reference,refund_provider_reference),updated_at=now() WHERE id=v_attempt.session_id AND status='completed' AND refund_status IN ('requested','failed');
 RETURN jsonb_build_object('ok',true,'idempotent',false,'session_id',v_attempt.session_id,'attempt_id',p_attempt_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.fail_fans_live_refund_attempt(p_attempt_id uuid,p_failure_class text,p_error_message text,p_error_code text DEFAULT NULL::text,p_http_status integer DEFAULT NULL::integer,p_response_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog','public' AS $function$
DECLARE v_attempt public.fans_live_refund_attempts%rowtype; v_delay interval; v_next timestamptz;
BEGIN
 IF p_failure_class NOT IN ('transient','permanent') THEN RAISE EXCEPTION 'Classe de falha inválida.'; END IF;
 SELECT * INTO v_attempt FROM public.fans_live_refund_attempts WHERE id=p_attempt_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Tentativa de reembolso não encontrada.'; END IF;
 IF v_attempt.status='failed' THEN RETURN jsonb_build_object('ok',true,'idempotent',true,'session_id',v_attempt.session_id,'attempt_no',v_attempt.attempt_no,'failure_class',v_attempt.failure_class); END IF;
 IF v_attempt.status='succeeded' THEN RETURN jsonb_build_object('ok',false,'idempotent',true,'reason','attempt_already_succeeded','session_id',v_attempt.session_id,'attempt_id',p_attempt_id); END IF;
 IF v_attempt.status<>'started' THEN RETURN jsonb_build_object('ok',false,'idempotent',true,'reason','attempt_not_started','status',v_attempt.status,'session_id',v_attempt.session_id,'attempt_id',p_attempt_id); END IF;
 UPDATE public.fans_live_refund_attempts SET status='failed',failure_class=p_failure_class,error_code=p_error_code,error_message=left(coalesce(p_error_message,'Falha no reembolso.'),2000),http_status=p_http_status,completed_at=now(),response_metadata=coalesce(p_response_metadata,'{}'::jsonb) WHERE id=p_attempt_id AND status='started';
 v_delay:=CASE v_attempt.attempt_no WHEN 1 THEN interval '5 minutes' WHEN 2 THEN interval '15 minutes' WHEN 3 THEN interval '1 hour' WHEN 4 THEN interval '6 hours' ELSE interval '24 hours' END;
 v_next:=CASE WHEN p_failure_class='transient' AND v_attempt.attempt_no<5 THEN now()+v_delay ELSE null END;
 UPDATE public.fans_live_sessions SET refund_status='failed',refund_last_error=left(coalesce(p_error_message,'Falha no reembolso.'),2000),refund_failure_class=p_failure_class,refund_next_attempt_at=v_next,updated_at=now() WHERE id=v_attempt.session_id AND status='completed' AND refund_status IN ('requested','failed');
 RETURN jsonb_build_object('ok',true,'idempotent',false,'session_id',v_attempt.session_id,'attempt_no',v_attempt.attempt_no,'failure_class',p_failure_class,'next_attempt_at',v_next);
END;
$function$;