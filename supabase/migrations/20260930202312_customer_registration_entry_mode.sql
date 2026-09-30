create or replace function private.capture_registration_metadata()
returns trigger language plpgsql security definer set search_path to 'public','private'
as $function$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_entry_mode text := case when m->>'entry_mode' in ('customer','advertiser','fans','both') then m->>'entry_mode' else 'customer' end;
begin
  if m ? 'cpf' and m ? 'birth_date' then
    insert into public.registration_intents (
      user_id,token_hash,email,display_name,cpf,birth_date,phone,zipcode,street,number,complement,neighborhood,city,uf,ibge_code,entry_mode
    ) values (
      new.id,encode(digest(new.id::text || ':' || coalesce(new.email,''),'sha256'),'hex'),coalesce(new.email,''),coalesce(m->>'display_name',''),coalesce(m->>'cpf',''),(m->>'birth_date')::date,
      coalesce(m->>'phone',''),coalesce(m->>'cep',''),coalesce(m->>'street',''),coalesce(m->>'number',''),nullif(m->>'complement',''),coalesce(m->>'neighborhood',''),coalesce(m->>'city',''),coalesce(m->>'uf',''),coalesce(m->>'ibge_code',''),v_entry_mode
    )
    on conflict (user_id) do update set
      email=excluded.email,display_name=excluded.display_name,cpf=excluded.cpf,birth_date=excluded.birth_date,phone=excluded.phone,
      zipcode=excluded.zipcode,street=excluded.street,number=excluded.number,complement=excluded.complement,neighborhood=excluded.neighborhood,
      city=excluded.city,uf=excluded.uf,ibge_code=excluded.ibge_code,entry_mode=excluded.entry_mode,expires_at=now()+interval '30 minutes',consumed_at=null;
    new.raw_user_meta_data := jsonb_build_object('registration_pending', true);
  end if;
  return new;
end;
$function$;