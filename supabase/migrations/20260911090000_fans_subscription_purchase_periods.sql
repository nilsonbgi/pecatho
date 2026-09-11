alter table public.fans_purchases
  add column if not exists access_starts_at timestamptz,
  add column if not exists access_ends_at timestamptz;

create index if not exists fans_purchases_subscription_period_idx
  on public.fans_purchases (subscription_id, status, access_starts_at, access_ends_at);

create or replace function public.fans_prepare_subscription_purchase_period()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_subscription public.fans_subscriptions%rowtype;
  v_duration integer;
begin
  if new.subscription_id is null or new.status <> 'paid' then
    return new;
  end if;

  select * into v_subscription
    from public.fans_subscriptions
   where id = new.subscription_id;

  if not found then
    return new;
  end if;

  select duration_days into v_duration
    from public.fans_plans
   where id = v_subscription.plan_id;

  if v_duration is null then
    return new;
  end if;

  new.access_ends_at := coalesce(new.access_ends_at, v_subscription.ends_at);
  new.access_starts_at := coalesce(
    new.access_starts_at,
    case when new.access_ends_at is not null
      then new.access_ends_at - (v_duration * interval '1 day')
      else v_subscription.starts_at
    end
  );

  return new;
end;
$$;

drop trigger if exists fans_purchase_subscription_period on public.fans_purchases;
create trigger fans_purchase_subscription_period
before insert on public.fans_purchases
for each row
execute function public.fans_prepare_subscription_purchase_period();

update public.fans_purchases p
   set access_ends_at = coalesce(p.access_ends_at, s.ends_at),
       access_starts_at = coalesce(
         p.access_starts_at,
         case when s.ends_at is not null
           then s.ends_at - (pl.duration_days * interval '1 day')
           else s.starts_at
         end
       )
  from public.fans_subscriptions s
  join public.fans_plans pl on pl.id = s.plan_id
 where p.subscription_id = s.id
   and p.status = 'paid';

create or replace function public.fans_recalculate_subscription_after_refund(p_subscription_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_subscription public.fans_subscriptions%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_now timestamptz := pg_catalog.now();
begin
  select * into v_subscription
    from public.fans_subscriptions
   where id = p_subscription_id
   for update;
  if not found then return; end if;

  select min(access_starts_at), max(access_ends_at)
    into v_start, v_end
    from public.fans_purchases
   where subscription_id = p_subscription_id
     and status = 'paid'
     and access_starts_at is not null
     and access_ends_at is not null;

  if v_end is null then
    update public.fans_subscriptions
       set status = 'refunded', starts_at = v_start, ends_at = v_end, updated_at = v_now
     where id = p_subscription_id;
  elsif v_end >= v_now then
    update public.fans_subscriptions
       set status = 'active', starts_at = coalesce(v_start, starts_at), ends_at = v_end, updated_at = v_now
     where id = p_subscription_id;
  else
    update public.fans_subscriptions
       set status = 'expired', starts_at = coalesce(v_start, starts_at), ends_at = v_end, updated_at = v_now
     where id = p_subscription_id;
  end if;
end;
$$;

revoke execute on function public.fans_recalculate_subscription_after_refund(uuid) from public, anon, authenticated;

update public.fans_subscriptions s
   set status = case
     when x.max_end is null then 'refunded'
     when x.max_end >= pg_catalog.now() then 'active'
     else 'expired'
   end,
   starts_at = coalesce(x.min_start, s.starts_at),
   ends_at = x.max_end,
   updated_at = pg_catalog.now()
  from (
    select subscription_id, min(access_starts_at) as min_start, max(access_ends_at) as max_end
      from public.fans_purchases
     where status = 'paid'
       and access_starts_at is not null
       and access_ends_at is not null
     group by subscription_id
  ) x
 where s.id = x.subscription_id;

update public.fans_subscriptions s
   set status = 'refunded', updated_at = pg_catalog.now()
 where not exists (
   select 1 from public.fans_purchases p
    where p.subscription_id = s.id
      and p.status = 'paid'
 )
 and s.status = 'active';
