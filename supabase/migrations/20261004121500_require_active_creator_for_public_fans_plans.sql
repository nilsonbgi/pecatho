-- Public subscription plans must belong to an active Fans creator.
drop policy if exists fans_plans_public_select on public.fans_plans;

create policy fans_plans_public_select
  on public.fans_plans
  for select
  to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1
      from public.fans_creators c
      where c.id = fans_plans.creator_id
        and c.status = 'active'
    )
  );
