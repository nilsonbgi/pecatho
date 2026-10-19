-- Attach an optional visibility benefit to the existing gift checkout.
-- The gift remains the financial transaction; a boost is activated only by the trusted gift settlement.
alter table public.pecatho_gifts
  add column if not exists boost_plan_id uuid references public.fans_boost_plans(id) on delete restrict,
  add column if not exists boost_post_id uuid references public.fans_posts(id) on delete restrict;

create index if not exists pecatho_gifts_boost_plan_pending_idx
  on public.pecatho_gifts(boost_plan_id, status) where boost_plan_id is not null;

create or replace function public.create_pecatho_gift_with_boost_checkout_intent(
  p_recipient_type text,
  p_recipient_id uuid,
  p_amount numeric,
  p_message text default null,
  p_boost_plan_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_result jsonb;
  v_gift_id uuid;
  v_order_id uuid;
  v_amount numeric(12,2);
  v_plan public.fans_boost_plans%rowtype;
  v_post_id uuid;
begin
  if p_boost_plan_id is null then
    return public.create_pecatho_gift_checkout_intent(p_recipient_type,p_recipient_id,p_amount,p_message);
  end if;
  if p_recipient_type <> 'creator' then
    raise exception 'BOOST_GIFT_REQUIRES_CREATOR';
  end if;

  v_amount := round(coalesce(p_amount,0),2);
  select * into v_plan from public.fans_boost_plans
   where id=p_boost_plan_id and status='active' for share;
  if not found or v_plan.price <= 0 then raise exception 'BOOST_PLAN_NOT_AVAILABLE'; end if;
  if v_amount < v_plan.price then raise exception 'GIFT_AMOUNT_BELOW_BOOST_PLAN'; end if;

  select p.id into v_post_id
    from public.fans_posts p
   where p.creator_id=p_recipient_id and p.status='published'
     and not exists(select 1 from public.fans_boosts b where b.post_id=p.id and b.status='active' and b.ends_at>now())
   order by p.published_at desc nulls last, p.created_at desc
   limit 1;
  if v_post_id is null then raise exception 'NO_ELIGIBLE_PUBLISHED_POST'; end if;

  v_result := public.create_pecatho_gift_checkout_intent(p_recipient_type,p_recipient_id,v_amount,p_message);
  v_gift_id := nullif(v_result->>'gift_id','')::uuid;
  v_order_id := nullif(v_result->>'order_id','')::uuid;
  update public.pecatho_gifts set boost_plan_id=p_boost_plan_id, boost_post_id=v_post_id where id=v_gift_id;
  update public.orders set metadata=coalesce(metadata,'{}'::jsonb) ||
    jsonb_build_object('boost_plan_id',p_boost_plan_id,'boost_post_id',v_post_id,'gift_boost',true)
   where id=v_order_id;
  return v_result || jsonb_build_object('gift_boost',true,'boost_plan_id',p_boost_plan_id,'boost_post_id',v_post_id,
    'boost_duration_hours',v_plan.duration_hours,'boost_multiplier',v_plan.multiplier);
end;
$function$;

create or replace function public.activate_gift_creator_boost()
returns trigger
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare
  v_plan public.fans_boost_plans%rowtype;
  v_creator_id uuid;
begin
  if new.status <> 'paid' or old.status = 'paid' or new.boost_plan_id is null or new.boost_post_id is null then
    return new;
  end if;

  select * into v_plan from public.fans_boost_plans
   where id=new.boost_plan_id and status='active';
  if not found then
    raise exception 'GIFT_BOOST_PLAN_UNAVAILABLE_AT_SETTLEMENT';
  end if;

  select id into v_creator_id from public.fans_creators
   where id=new.recipient_id and user_id=new.recipient_user_id and status='active' for update;
  if v_creator_id is null then raise exception 'GIFT_BOOST_CREATOR_UNAVAILABLE'; end if;

  perform 1 from public.fans_posts
   where id=new.boost_post_id and creator_id=v_creator_id and status='published' for update;
  if not found then raise exception 'GIFT_BOOST_POST_UNAVAILABLE'; end if;

  if exists(select 1 from public.fans_boosts where post_id=new.boost_post_id and status='active' and ends_at>now()) then
    raise exception 'GIFT_BOOST_POST_ALREADY_ACTIVE';
  end if;

  insert into public.fans_boosts(creator_id,post_id,plan_id,starts_at,ends_at,status,order_id,payment_id)
  values(v_creator_id,new.boost_post_id,new.boost_plan_id,coalesce(new.paid_at,now()),
    coalesce(new.paid_at,now())+(v_plan.duration_hours*interval '1 hour'),'active',new.order_id,new.payment_id)
  on conflict (order_id) where order_id is not null do nothing;

  return new;
end;
$function$;

drop trigger if exists pecatho_gift_activate_creator_boost on public.pecatho_gifts;
create trigger pecatho_gift_activate_creator_boost
after update of status on public.pecatho_gifts
for each row execute function public.activate_gift_creator_boost();

revoke all on function public.create_pecatho_gift_with_boost_checkout_intent(text,uuid,numeric,text,uuid) from public, anon;
grant execute on function public.create_pecatho_gift_with_boost_checkout_intent(text,uuid,numeric,text,uuid) to authenticated;
revoke all on function public.activate_gift_creator_boost() from public, anon, authenticated;
grant execute on function public.activate_gift_creator_boost() to service_role;
