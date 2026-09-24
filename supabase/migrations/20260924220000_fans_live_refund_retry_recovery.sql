create table if not exists public.fans_live_refund_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fans_live_sessions(id) on delete cascade,
  order_id uuid,
  payment_id uuid,
  attempt_no integer not null,
  provider text,
  provider_payment_id text,
  status text not null default 'started',
  failure_class text,
  error_code text,
  error_message text,
  http_status integer,
  idempotency_key text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  response_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint fans_live_refund_attempts_status_chk check (status in ('started','succeeded','failed')),
  constraint fans_live_refund_attempts_failure_class_chk check (failure_class is null or failure_class in ('transient','permanent')),
  constraint fans_live_refund_attempts_attempt_no_chk check (attempt_no > 0),
  constraint fans_live_refund_attempts_unique_attempt unique (session_id, attempt_no)
);

create index if not exists fans_live_refund_attempts_session_idx on public.fans_live_refund_attempts(session_id, attempt_no desc);
create index if not exists fans_live_refund_attempts_status_idx on public.fans_live_refund_attempts(status, requested_at desc);
alter table public.fans_live_refund_attempts enable row level security;
revoke all on public.fans_live_refund_attempts from anon, authenticated;
grant select, insert, update, delete on public.fans_live_refund_attempts to service_role;

alter table public.fans_live_sessions
  add column if not exists refund_attempts integer not null default 0,
  add column if not exists refund_last_attempted_at timestamptz,
  add column if not exists refund_next_attempt_at timestamptz,
  add column if not exists refund_last_error text,
  add column if not exists refund_failure_class text,
  add column if not exists refund_provider_reference text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='fans_live_sessions_refund_failure_class_chk') then
    alter table public.fans_live_sessions add constraint fans_live_sessions_refund_failure_class_chk
      check (refund_failure_class is null or refund_failure_class in ('transient','permanent'));
  end if;
end $$;

create index if not exists fans_live_sessions_refund_retry_idx
  on public.fans_live_sessions(status, refund_status, refund_next_attempt_at)
  where status='completed' and refund_status in ('required','failed');

create or replace function public.begin_fans_live_refund_attempt(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public
as $function$
declare v_session public.fans_live_sessions%rowtype; v_attempt_no integer; v_attempt_id uuid; v_order_id uuid; v_payment_id uuid; v_provider text; v_provider_payment_id text; v_key text;
begin
 select * into v_session from public.fans_live_sessions where id=p_session_id for update;
 if not found then raise exception 'Sessão de chamada ao vivo não encontrada.'; end if;
 if v_session.status <> 'completed' or v_session.refund_status not in ('required','failed') then return jsonb_build_object('eligible',false,'reason','not_pending'); end if;
 if v_session.refund_failure_class='permanent' then return jsonb_build_object('eligible',false,'reason','permanent_failure'); end if;
 if v_session.refund_next_attempt_at is not null and v_session.refund_next_attempt_at > now() then return jsonb_build_object('eligible',false,'reason','backoff','next_attempt_at',v_session.refund_next_attempt_at); end if;
 if v_session.refund_attempts >= 5 then
   update public.fans_live_sessions set refund_failure_class='permanent',refund_last_error=coalesce(refund_last_error,'Limite de tentativas de reembolso atingido.'),refund_next_attempt_at=null,updated_at=now() where id=p_session_id;
   return jsonb_build_object('eligible',false,'reason','max_attempts');
 end if;
 v_attempt_no:=v_session.refund_attempts+1; v_attempt_id:=gen_random_uuid(); v_order_id:=v_session.order_id; v_payment_id:=v_session.payment_id;
 select p.provider,p.provider_payment_id into v_provider,v_provider_payment_id from public.payments p where p.id=v_payment_id limit 1;
 if v_provider is null and v_order_id is not null then
   select p.id,p.provider,p.provider_payment_id into v_payment_id,v_provider,v_provider_payment_id from public.payments p where p.order_id=v_order_id and p.user_id=v_session.buyer_user_id order by case when p.status in ('paid','refunded','chargeback','partially_refunded') then 0 else 1 end,p.created_at desc limit 1;
 end if;
 v_key:=case when v_order_id is not null then 'pecatho-live-refund-'||v_order_id::text else 'pecatho-live-refund-'||p_session_id::text end;
 insert into public.fans_live_refund_attempts(id,session_id,order_id,payment_id,attempt_no,provider,provider_payment_id,status,idempotency_key)
 values(v_attempt_id,p_session_id,v_order_id,v_payment_id,v_attempt_no,v_provider,v_provider_payment_id,'started',v_key);
 update public.fans_live_sessions set refund_attempts=v_attempt_no,refund_last_attempted_at=now(),refund_next_attempt_at=null,refund_last_error=null,updated_at=now() where id=p_session_id;
 return jsonb_build_object('eligible',true,'attempt_id',v_attempt_id,'attempt_no',v_attempt_no,'session_id',p_session_id,'order_id',v_order_id,'payment_id',v_payment_id,'provider',v_provider,'provider_payment_id',v_provider_payment_id,'idempotency_key',v_key);
end;$function$;

revoke all on function public.begin_fans_live_refund_attempt(uuid) from public,anon,authenticated;
grant execute on function public.begin_fans_live_refund_attempt(uuid) to service_role;

create or replace function public.complete_fans_live_refund_attempt(p_attempt_id uuid,p_provider_reference text default null,p_response_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public
as $function$
declare v_attempt public.fans_live_refund_attempts%rowtype;
begin
 select * into v_attempt from public.fans_live_refund_attempts where id=p_attempt_id for update;
 if not found then raise exception 'Tentativa de reembolso não encontrada.'; end if;
 update public.fans_live_refund_attempts set status='succeeded',failure_class=null,error_code=null,error_message=null,http_status=null,completed_at=now(),response_metadata=coalesce(p_response_metadata,'{}'::jsonb) where id=p_attempt_id;
 update public.fans_live_sessions set refund_status='refunded',refund_processed_at=now(),refund_next_attempt_at=null,refund_last_error=null,refund_failure_class=null,refund_provider_reference=coalesce(p_provider_reference,refund_provider_reference),updated_at=now() where id=v_attempt.session_id;
 return jsonb_build_object('ok',true,'session_id',v_attempt.session_id,'attempt_id',p_attempt_id);
end;$function$;

revoke all on function public.complete_fans_live_refund_attempt(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.complete_fans_live_refund_attempt(uuid,text,jsonb) to service_role;

create or replace function public.fail_fans_live_refund_attempt(p_attempt_id uuid,p_failure_class text,p_error_message text,p_error_code text default null,p_http_status integer default null,p_response_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public
as $function$
declare v_attempt public.fans_live_refund_attempts%rowtype; v_delay interval; v_next timestamptz;
begin
 if p_failure_class not in ('transient','permanent') then raise exception 'Classe de falha inválida.'; end if;
 select * into v_attempt from public.fans_live_refund_attempts where id=p_attempt_id for update;
 if not found then raise exception 'Tentativa de reembolso não encontrada.'; end if;
 update public.fans_live_refund_attempts set status='failed',failure_class=p_failure_class,error_code=p_error_code,error_message=left(coalesce(p_error_message,'Falha no reembolso.'),2000),http_status=p_http_status,completed_at=now(),response_metadata=coalesce(p_response_metadata,'{}'::jsonb) where id=p_attempt_id;
 v_delay:=case v_attempt.attempt_no when 1 then interval '5 minutes' when 2 then interval '15 minutes' when 3 then interval '1 hour' when 4 then interval '6 hours' else interval '24 hours' end;
 v_next:=case when p_failure_class='transient' and v_attempt.attempt_no<5 then now()+v_delay else null end;
 update public.fans_live_sessions set refund_status='failed',refund_last_error=left(coalesce(p_error_message,'Falha no reembolso.'),2000),refund_failure_class=p_failure_class,refund_next_attempt_at=v_next,updated_at=now() where id=v_attempt.session_id;
 return jsonb_build_object('ok',true,'session_id',v_attempt.session_id,'attempt_no',v_attempt.attempt_no,'failure_class',p_failure_class,'next_attempt_at',v_next);
end;$function$;

revoke all on function public.fail_fans_live_refund_attempt(uuid,text,text,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.fail_fans_live_refund_attempt(uuid,text,text,text,integer,jsonb) to service_role;

create or replace function public.requeue_fans_live_refund(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public
as $function$
begin
 update public.fans_live_sessions set refund_failure_class=null,refund_next_attempt_at=now(),refund_last_error=null,updated_at=now() where id=p_session_id and status='completed' and refund_status='failed';
 if not found then return jsonb_build_object('ok',false,'reason','session_not_requeueable'); end if;
 return jsonb_build_object('ok',true,'session_id',p_session_id,'next_attempt_at',now());
end;$function$;
revoke all on function public.requeue_fans_live_refund(uuid) from public,anon,authenticated;
grant execute on function public.requeue_fans_live_refund(uuid) to service_role;
