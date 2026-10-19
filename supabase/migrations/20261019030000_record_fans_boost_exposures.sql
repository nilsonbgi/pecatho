create or replace function public.record_fans_boost_exposures(p_post_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer := 0;
begin
  if p_post_ids is null or cardinality(p_post_ids) = 0 then
    return 0;
  end if;

  update public.fans_boosts as b
     set view_count = b.view_count + 1
   where b.status = 'active'
     and b.ends_at > now()
     and b.post_id = any(p_post_ids)
     and exists (
       select 1
         from public.fans_posts as p
         join public.fans_creators as c on c.id = p.creator_id
        where p.id = b.post_id
          and p.creator_id = b.creator_id
          and p.status = 'published'
          and c.status = 'active'
     );

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

revoke all on function public.record_fans_boost_exposures(uuid[]) from public;
revoke all on function public.record_fans_boost_exposures(uuid[]) from anon;
revoke all on function public.record_fans_boost_exposures(uuid[]) from authenticated;
grant execute on function public.record_fans_boost_exposures(uuid[]) to service_role;
