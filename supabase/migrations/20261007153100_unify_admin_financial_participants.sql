drop function if exists public.admin_fans_financial_overview();

create function public.admin_fans_financial_overview()
returns table(participant_type text,participant_id uuid,user_id uuid,display_name text,gross_sales numeric,platform_fees numeric,provider_fees numeric,net_earned numeric,outstanding_payouts numeric,paid_out numeric,available numeric,fans_gross_sales numeric,fans_platform_fees numeric,content_gross_sales numeric,content_platform_fees numeric)
language plpgsql security definer set search_path to pg_catalog, public, private
as $$
begin
  if auth.uid() is null or not coalesce(private.is_staff(), false) then raise exception 'Não autorizado'; end if;
  return query
  with user_base as (
    select p.id user_id,coalesce(p.display_name,p.email::text,'Participante') display_name from public.profiles p
    where exists(select 1 from public.fans_creators fc where fc.user_id=p.id) or exists(select 1 from public.digital_content_sales dcs where dcs.owner_user_id=p.id)
  ), fan as (
    select fc.user_id,
      coalesce(sum(fl.amount) filter(where fl.entry_type='sale_gross' and fl.direction='credit' and fl.status='posted'),0) gross_sales,
      coalesce(sum(fl.amount) filter(where fl.entry_type='platform_fee' and fl.direction='debit' and fl.status='posted'),0) platform_fees,
      coalesce(sum(fl.amount) filter(where fl.entry_type='provider_fee' and fl.direction='debit' and fl.status='posted'),0) provider_fees,
      coalesce(sum(case when fl.direction='credit' then fl.amount else -fl.amount end) filter(where fl.status='posted'),0) net_earned
    from public.fans_creators fc left join public.fans_financial_ledger fl on fl.creator_id=fc.id group by fc.user_id
  ), content as (
    select p.id user_id,
      coalesce((select sum(d.amount) from public.digital_content_sales d where d.owner_user_id=p.id and d.status='paid'),0) gross_sales,
      coalesce((select sum(d.platform_fee) from public.digital_content_sales d where d.owner_user_id=p.id and d.status='paid'),0) platform_fees,
      coalesce((select sum(greatest(d.amount-d.owner_amount-d.platform_fee,0)) from public.digital_content_sales d where d.owner_user_id=p.id and d.status='paid'),0) provider_fees,
      coalesce((select sum(case when le.entry_type in ('credit','adjustment') then le.amount else -le.amount end) from public.ledger_entries le where le.user_id=p.id),0) net_earned
    from public.profiles p where exists(select 1 from public.digital_content_sales d where d.owner_user_id=p.id)
  ), payout_base as (
    select fpr.*,fc.user_id creator_user_id from public.fans_payout_requests fpr left join public.fans_creators fc on fc.id=fpr.creator_id
  ), payout as (
    select coalesce(creator_user_id,seller_user_id) user_id,
      coalesce(sum(amount) filter(where status in ('requested','approved','processing')),0) outstanding,
      coalesce(sum(amount) filter(where status='paid'),0) paid_out
    from payout_base group by coalesce(creator_user_id,seller_user_id)
  )
  select 'unified'::text,ub.user_id,ub.user_id,ub.display_name,
    round(coalesce(f.gross_sales,0)+coalesce(c.gross_sales,0),2),
    round(coalesce(f.platform_fees,0)+coalesce(c.platform_fees,0),2),
    round(coalesce(f.provider_fees,0)+coalesce(c.provider_fees,0),2),
    round(coalesce(f.net_earned,0)+coalesce(c.net_earned,0),2),
    round(coalesce(py.outstanding,0),2),round(coalesce(py.paid_out,0),2),
    round(greatest(coalesce(f.net_earned,0)+coalesce(c.net_earned,0)-coalesce(py.outstanding,0),0),2),
    round(coalesce(f.gross_sales,0),2),round(coalesce(f.platform_fees,0),2),
    round(coalesce(c.gross_sales,0),2),round(coalesce(c.platform_fees,0),2)
  from user_base ub left join fan f on f.user_id=ub.user_id left join content c on c.user_id=ub.user_id left join payout py on py.user_id=ub.user_id
  order by greatest(coalesce(f.net_earned,0)+coalesce(c.net_earned,0)-coalesce(py.outstanding,0),0) desc,ub.display_name;
end;
$$;

revoke all on function public.admin_fans_financial_overview() from public,anon;
grant execute on function public.admin_fans_financial_overview() to authenticated;