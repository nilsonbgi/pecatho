create or replace function private.guard_fans_post_publication()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  creator_active boolean;
  advertiser_verified boolean;
begin
  if not coalesce(private.is_staff(), false) then
    if tg_op = 'INSERT' then
      if new.status = 'published' then
        raise exception 'Publicação de conteúdo Fans exige aprovação administrativa.';
      end if;
    elsif tg_op = 'UPDATE' and new.status = 'published' and old.status <> 'published' then
      raise exception 'Publicação de conteúdo Fans exige aprovação administrativa.';
    end if;
  end if;

  select c.status = 'active',
         coalesce(ap.verification_status = 'verified', true)
    into creator_active, advertiser_verified
  from public.fans_creators c
  left join public.advertiser_profiles ap on ap.id = c.advertiser_profile_id
  where c.id = new.creator_id;

  if not coalesce(creator_active, false) then
    raise exception 'O criador Fans precisa estar ativo para publicar conteúdo.';
  end if;

  if new.status = 'published' and not coalesce(advertiser_verified, false) then
    raise exception 'O criador vinculado a um anunciante precisa estar verificado para publicar conteúdo Fans.';
  end if;

  if new.status = 'published' then
    new.published_at := coalesce(new.published_at, now());
  elsif tg_op = 'UPDATE' and old.status = 'published' and new.status <> 'published' then
    new.published_at := null;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_fans_post_publication() from public, anon, authenticated;

drop trigger if exists trg_guard_fans_post_publication on public.fans_posts;
create trigger trg_guard_fans_post_publication
before insert or update of creator_id, status, published_at on public.fans_posts
for each row execute function private.guard_fans_post_publication();

create or replace function private.guard_fans_plan_activation()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  creator_active boolean;
begin
  select (status = 'active') into creator_active
  from public.fans_creators
  where id = new.creator_id;

  if new.status = 'active' and not coalesce(creator_active, false) then
    raise exception 'O plano Fans só pode ser ativado para um criador ativo.';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_fans_plan_activation() from public, anon, authenticated;

drop trigger if exists trg_guard_fans_plan_activation on public.fans_plans;
create trigger trg_guard_fans_plan_activation
before insert or update of creator_id, status on public.fans_plans
for each row execute function private.guard_fans_plan_activation();

create or replace function private.guard_fans_payout_request()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_op = 'INSERT' and not coalesce(private.is_staff(), false) then
    new.status := 'requested';
    new.provider := null;
    new.provider_reference := null;
    new.processed_at := null;
    new.rejection_reason := null;
    new.requested_at := now();
  end if;
  return new;
end;
$$;

revoke all on function private.guard_fans_payout_request() from public, anon, authenticated;

drop trigger if exists trg_guard_fans_payout_request on public.fans_payout_requests;
create trigger trg_guard_fans_payout_request
before insert on public.fans_payout_requests
for each row execute function private.guard_fans_payout_request();
