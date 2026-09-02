create or replace function private.guard_fans_post_review_submission()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  creator_user_id uuid;
  media_count integer;
begin
  if new.status = 'pending_review' and old.status is distinct from 'pending_review' then
    select fc.user_id into creator_user_id
      from public.fans_creators fc
     where fc.id = new.creator_id;

    if not private.is_staff() and creator_user_id is distinct from auth.uid() then
      raise exception 'A publicação não pertence ao usuário autenticado.';
    end if;

    if not private.is_staff() and old.status not in ('draft','rejected') then
      raise exception 'Somente rascunhos ou publicações rejeitadas podem ser enviadas para análise.';
    end if;

    if length(trim(coalesce(new.title,''))) < 3 then
      raise exception 'A publicação precisa de um título com pelo menos 3 caracteres.';
    end if;

    if new.access_type not in ('free','paid','subscriber') then
      raise exception 'Tipo de acesso inválido.';
    end if;

    if coalesce(new.price,0) < 0 or (new.access_type = 'paid' and coalesce(new.price,0) <= 0) then
      raise exception 'Preço inválido para o tipo de acesso informado.';
    end if;

    select count(*) into media_count
      from public.fans_post_media pm
     where pm.post_id = new.id;

    if media_count < 1 then
      raise exception 'Adicione pelo menos uma mídia antes de enviar a publicação para análise.';
    end if;
  end if;

  if not private.is_staff() and new.status = 'published' and old.status is distinct from 'published' then
    raise exception 'A publicação definitiva depende da moderação administrativa.';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_fans_post_review_submission() from public, anon, authenticated;

drop trigger if exists trg_guard_fans_post_review_submission on public.fans_posts;
create trigger trg_guard_fans_post_review_submission
before update of status on public.fans_posts
for each row execute function private.guard_fans_post_review_submission();
