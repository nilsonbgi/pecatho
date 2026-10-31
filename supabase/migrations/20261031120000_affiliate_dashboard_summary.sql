-- Exposes only the authenticated affiliate's own referral metrics.
create or replace function public.get_my_pecatho_affiliate_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_summary jsonb;
  v_referrals jsonb;
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária';
  end if;

  select jsonb_build_object(
    'total_referrals', count(*),
    'registered_referrals', count(*) filter (where r.status = 'registered'),
    'qualified_referrals', count(*) filter (where r.status = 'qualified'),
    'total_commission', coalesce(sum(coalesce(c.commission_amount, 0)), 0),
    'reversed_commission', coalesce(sum(coalesce(c.reversed_amount, 0)), 0),
    'net_commission', coalesce(sum(greatest(coalesce(c.commission_amount, 0) - coalesce(c.reversed_amount, 0), 0)), 0)
  )
  into v_summary
  from public.pecatho_affiliate_referrals r
  left join public.pecatho_affiliate_commissions c on c.referral_id = r.id
  where r.affiliate_user_id = v_user_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'registered_at', recent.registered_at,
        'first_paid_at', recent.first_paid_at,
        'status', recent.status,
        'commission_amount', recent.commission_amount,
        'reversed_amount', recent.reversed_amount,
        'net_commission', greatest(recent.commission_amount - recent.reversed_amount, 0)
      )
      order by recent.registered_at desc
    ),
    '[]'::jsonb
  )
  into v_referrals
  from (
    select
      r.registered_at,
      r.first_paid_at,
      r.status,
      coalesce(sum(c.commission_amount), 0)::numeric(12,2) as commission_amount,
      coalesce(sum(c.reversed_amount), 0)::numeric(12,2) as reversed_amount
    from public.pecatho_affiliate_referrals r
    left join public.pecatho_affiliate_commissions c on c.referral_id = r.id
    where r.affiliate_user_id = v_user_id
    group by r.id
    order by r.registered_at desc
    limit 20
  ) recent;

  return coalesce(v_summary, '{}'::jsonb) || jsonb_build_object('referrals', v_referrals);
end;
$function$;

revoke all on function public.get_my_pecatho_affiliate_dashboard() from public, anon;
grant execute on function public.get_my_pecatho_affiliate_dashboard() to authenticated;
