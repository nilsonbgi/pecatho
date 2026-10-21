-- Snapshot the gallery entitlement when a publication becomes active.
-- Explicit JSON null means unlimited and must not fall back to the mutable plan row.
create or replace function public.snapshot_publication_gallery_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_limit integer;
begin
  select pp.max_gallery_items into v_limit
  from public.publication_plans pp
  where pp.id = new.plan_id;

  new.plan_features_snapshot :=
    jsonb_set(
      coalesce(new.plan_features_snapshot, '{}'::jsonb),
      '{max_gallery_items}',
      coalesce(to_jsonb(v_limit), 'null'::jsonb),
      true
    );
  return new;
end;
$function$;

revoke all on function public.snapshot_publication_gallery_limit() from public, anon, authenticated;

drop trigger if exists profile_publications_gallery_limit_snapshot on public.profile_publications;
create trigger profile_publications_gallery_limit_snapshot
before insert or update of plan_id
on public.profile_publications
for each row
execute function public.snapshot_publication_gallery_limit();

drop trigger if exists creator_publications_gallery_limit_snapshot on public.pecatho_creator_publications;
create trigger creator_publications_gallery_limit_snapshot
before insert or update of plan_id
on public.pecatho_creator_publications
for each row
execute function public.snapshot_publication_gallery_limit();

create or replace function public.enforce_publication_gallery_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_limit integer;
  v_count integer;
begin
  if not coalesce(new.show_in_gallery, false) then
    return new;
  end if;

  -- Serialize gallery additions per profile so parallel uploads cannot exceed the limit.
  perform pg_advisory_xact_lock(hashtextextended(new.profile_id::text, 719341));

  select max(active_limits.gallery_limit)
  into v_limit
  from (
    select case
      when pub.plan_features_snapshot ? 'max_gallery_items'
        then nullif(pub.plan_features_snapshot->>'max_gallery_items', '')::integer
      else pp.max_gallery_items
    end as gallery_limit
    from public.profile_publications pub
    join public.publication_plans pp on pp.id = pub.plan_id
    where pub.profile_id = new.profile_id
      and pub.status::text = 'published'
      and pub.starts_at <= now()
      and pub.ends_at > now()
      and coalesce(pub.plan_features_snapshot->>'audience', pp.audience) in (
        'both',
        case
          when exists (
            select 1 from public.fans_creators fc
            where fc.advertiser_profile_id = new.profile_id and fc.status = 'active'
          ) then 'content_seller'
          else 'companion'
        end
      )
    union all
    select case
      when cp.plan_features_snapshot ? 'max_gallery_items'
        then nullif(cp.plan_features_snapshot->>'max_gallery_items', '')::integer
      else pp.max_gallery_items
    end as gallery_limit
    from public.pecatho_creator_publications cp
    join public.fans_creators fc on fc.id = cp.creator_id
    join public.publication_plans pp on pp.id = cp.plan_id
    where fc.advertiser_profile_id = new.profile_id
      and fc.status = 'active'
      and cp.status = 'published'
      and cp.starts_at <= now()
      and cp.ends_at > now()
      and coalesce(cp.plan_features_snapshot->>'audience', pp.audience) in ('content_seller', 'both')
  ) active_limits;

  if v_limit is null then
    return new;
  end if;

  select count(*)::integer
  into v_count
  from public.profile_media pm
  where pm.profile_id = new.profile_id
    and pm.show_in_gallery = true
    and (tg_op <> 'UPDATE' or pm.id <> new.id);

  if v_count >= v_limit then
    raise exception 'PUBLICATION_GALLERY_LIMIT_REACHED'
      using detail = format('O plano vigente permite até %s itens na galeria.', v_limit);
  end if;

  return new;
end;
$function$;

revoke all on function public.enforce_publication_gallery_limit() from public, anon, authenticated;

drop trigger if exists profile_media_gallery_plan_limit on public.profile_media;
create trigger profile_media_gallery_plan_limit
before insert or update of profile_id, show_in_gallery
on public.profile_media
for each row
execute function public.enforce_publication_gallery_limit();
