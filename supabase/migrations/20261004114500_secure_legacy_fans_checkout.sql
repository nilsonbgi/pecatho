-- Close the legacy three-argument Fans checkout path for inactive creators.
-- The newer public four-argument RPC already validates creator status; this
-- legacy private overload must enforce the same availability rule before
-- delegating to the existing checkout implementation.
create or replace function private.create_fans_checkout_intent(
  p_kind text,
  p_post_id uuid default null,
  p_plan_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $function$
declare
  v_creator_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_kind = 'post' then
    select fp.creator_id
      into v_creator_id
      from public.fans_posts fp
     where fp.id = p_post_id
       and fp.status = 'published'
       and fp.access_type = 'paid';
  elsif p_kind = 'subscription' then
    select fpl.creator_id
      into v_creator_id
      from public.fans_plans fpl
     where fpl.id = p_plan_id
       and fpl.status = 'active';
  else
    raise exception 'INVALID_KIND';
  end if;

  if v_creator_id is null then
    raise exception 'PRODUCT_NOT_AVAILABLE';
  end if;

  perform 1
    from public.fans_creators fc
   where fc.id = v_creator_id
     and fc.status = 'active'
   for update;

  if not found then
    raise exception 'CREATOR_NOT_AVAILABLE';
  end if;

  return private.create_fans_checkout_intent(
    p_kind,
    p_post_id,
    p_plan_id,
    false
  );
end;
$function$;
