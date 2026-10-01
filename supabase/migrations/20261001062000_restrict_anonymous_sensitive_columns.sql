-- Restrict anonymous Data API access to public-safe columns only.
do $$
declare
  t text;
  excluded text[];
  cols text;
begin
  foreach t in array array[
    'advertiser_profiles',
    'content_seller_reviews',
    'digital_content_products',
    'fans_comments',
    'fans_creators',
    'partner_venue_media',
    'partner_venues',
    'partners',
    'profile_feedback',
    'profile_testimonials',
    'user_addresses'
  ] loop
    excluded := case t
      when 'advertiser_profiles' then array['user_id','legal_display_name','birth_date','phone','phone_secondary']
      when 'content_seller_reviews' then array['owner_id','buyer_user_id']
      when 'digital_content_products' then array['owner_id','owner_user_id']
      when 'fans_comments' then array['user_id']
      when 'fans_creators' then array['user_id']
      when 'partner_venue_media' then array['owner_user_id','rejection_reason']
      when 'partner_venues' then array['owner_user_id','phone','street','number','rejection_reason','recruitment_contact_phone','recruitment_contact_email','recruitment_contact_whatsapp']
      when 'partners' then array['address','phone','contact']
      when 'profile_feedback' then array['author_user_id']
      when 'profile_testimonials' then array['author_user_id','author_email']
      when 'user_addresses' then array['user_id','address_type','street','number','latitude','longitude','public_latitude','public_longitude']
    end;
    execute format('revoke all on table public.%I from anon',t);
    select string_agg(format('%I',column_name), ', ' order by ordinal_position)
      into cols
      from information_schema.columns
     where table_schema='public'
       and table_name=t
       and not (column_name = any(excluded));
    if cols is not null then
      execute format('grant select (%s) on table public.%I to anon',cols,t);
    end if;
  end loop;
end $$;
