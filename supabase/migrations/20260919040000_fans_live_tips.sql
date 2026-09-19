-- Pecatho Fans: gorjetas em tempo real vinculadas a videochamadas
-- O checkout usa orders/payments/Mercado Pago e só credita fans_tips após settlement confirmado.

alter table public.fans_tips
  add column if not exists session_id uuid references public.fans_live_sessions(id) on delete set null,
  add column if not exists order_id uuid unique references public.orders(id) on delete set null;

create index if not exists fans_tips_session_status_idx
  on public.fans_tips(session_id,status,created_at desc);

alter publication supabase_realtime add table public.fans_tips;

drop policy if exists fans_tips_buyer_insert on public.fans_tips;
create policy fans_tips_buyer_insert
on public.fans_tips
for insert to authenticated
with check (
  buyer_user_id=(select auth.uid())
  and status='pending'
  and paid_at is null
  and provider is null
  and platform_fee=0
  and creator_amount=0
);

create or replace function public.create_fans_live_tip_checkout_intent(
  p_session_id uuid,
  p_amount numeric,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_user uuid:=auth.uid();
  v_session public.fans_live_sessions%rowtype;
  v_tip uuid;
  v_order uuid;
  v_order_number text;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_amount is null or p_amount < 5 or p_amount > 10000 then raise exception 'INVALID_TIP_AMOUNT'; end if;

  select * into v_session
    from public.fans_live_sessions
   where id=p_session_id
     and buyer_user_id=v_user
     and status='active'
   for update;

  if not found then raise exception 'LIVE_SESSION_NOT_ACTIVE'; end if;

  v_order_number:='FAN-TIP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));

  insert into public.orders(order_number,user_id,subtotal,discount,fee,total,currency,metadata)
  values(
    v_order_number,v_user,p_amount,0,0,p_amount,'BRL',
    jsonb_build_object(
      'source','fans',
      'kind','live_tip',
      'product_type','live_tip',
      'product_id',v_session.creator_id,
      'creator_id',v_session.creator_id,
      'session_id',v_session.id,
      'title','Gorjeta ao vivo'
    )
  )
  returning id into v_order;

  insert into public.payments(order_id,user_id,provider,amount,currency,status,payment_method,raw_reference)
  values(v_order,v_user,'pending',p_amount,'BRL','pending','pending','{}'::jsonb);

  insert into public.fans_tips(
    creator_id,buyer_user_id,amount,platform_fee,creator_amount,currency,
    message,status,session_id,order_id
  )
  values(
    v_session.creator_id,
    v_user,
    p_amount,
    0,
    0,
    'BRL',
    nullif(left(trim(coalesce(p_message,'')),500),''),
    'pending',
    v_session.id,
    v_order
  )
  returning id into v_tip;

  return jsonb_build_object(
    'tip_id',v_tip,
    'session_id',v_session.id,
    'order_id',v_order,
    'order_number',v_order_number,
    'amount',p_amount,
    'currency','BRL',
    'status','pending'
  );
end;
$$;

grant execute on function public.create_fans_live_tip_checkout_intent(uuid,numeric,text) to authenticated;
revoke all on function public.create_fans_live_tip_checkout_intent(uuid,numeric,text) from public,anon;

-- O settlement existente foi estendido no banco para reconhecer product_type=live_tip.
-- Ele calcula taxas somente no pagamento confirmado, atualiza fans_tips e grava o ledger.
