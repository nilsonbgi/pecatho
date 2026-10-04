create or replace function private.get_public_profile_feedback(p_profile_id uuid, p_limit integer default 20)
returns table(id uuid,rating smallint,comment text,created_at timestamptz,experience_verified boolean)
language sql security definer set search_path=''
stable as $$ select f.id,f.rating,f.comment,f.created_at,f.experience_verified from public.profile_feedback f join public.advertiser_profiles p on p.id=f.profile_id where f.profile_id=p_profile_id and p.status='published' and f.status='approved' and f.experience_verified=true order by f.created_at desc limit greatest(1,least(coalesce(p_limit,20),50)); $$;
revoke all on function private.get_public_profile_feedback(uuid,integer) from public,anon,authenticated;
create or replace function public.get_public_profile_feedback(p_profile_id uuid,p_limit integer default 20)
returns table(id uuid,rating smallint,comment text,created_at timestamptz,experience_verified boolean)
language sql security invoker set search_path=''
stable as $$ select * from private.get_public_profile_feedback(p_profile_id,p_limit); $$;
revoke all on function public.get_public_profile_feedback(uuid,integer) from public;
grant execute on function public.get_public_profile_feedback(uuid,integer) to anon,authenticated;
create or replace function private.get_public_fans_creator(p_advertiser_profile_id uuid)
returns table(slug text,display_name text,bio text,status text)
language sql security definer set search_path=''
stable as $$ select c.slug,c.display_name,c.bio,c.status from public.fans_creators c join public.advertiser_profiles p on p.id=c.advertiser_profile_id where c.advertiser_profile_id=p_advertiser_profile_id and c.status='active' and p.status='published' limit 1; $$;
revoke all on function private.get_public_fans_creator(uuid) from public,anon,authenticated;
create or replace function public.get_public_fans_creator(p_advertiser_profile_id uuid)
returns table(slug text,display_name text,bio text,status text)
language sql security invoker set search_path=''
stable as $$ select * from private.get_public_fans_creator(p_advertiser_profile_id); $$;
revoke all on function public.get_public_fans_creator(uuid) from public;
grant execute on function public.get_public_fans_creator(uuid) to anon,authenticated;
create or replace function private.get_public_profile_testimonials(p_profile_id uuid,p_limit integer default 20)
returns table(id uuid,author_name text,message text,created_at timestamptz,published_at timestamptz)
language sql security definer set search_path=''
stable as $$ select t.id,t.author_name,t.message,t.created_at,t.published_at from public.profile_testimonials t join public.advertiser_profiles p on p.id=t.profile_id where t.profile_id=p_profile_id and p.status='published' and t.status='approved' order by coalesce(t.published_at,t.created_at) desc limit greatest(1,least(coalesce(p_limit,20),50)); $$;
revoke all on function private.get_public_profile_testimonials(uuid,integer) from public,anon,authenticated;
create or replace function public.get_public_profile_testimonials(p_profile_id uuid,p_limit integer default 20)
returns table(id uuid,author_name text,message text,created_at timestamptz,published_at timestamptz)
language sql security invoker set search_path=''
stable as $$ select * from private.get_public_profile_testimonials(p_profile_id,p_limit); $$;
revoke all on function public.get_public_profile_testimonials(uuid,integer) from public;
grant execute on function public.get_public_profile_testimonials(uuid,integer) to anon,authenticated;
create or replace function private.get_public_content_seller_reviews(p_owner_type text,p_owner_id uuid,p_limit integer default 20)
returns table(id uuid,rating smallint,comment text,source_type text,verified_purchase boolean,created_at timestamptz)
language sql security definer set search_path=''
stable as $$ select r.id,r.rating,r.comment,r.source_type,r.verified_purchase,r.created_at from public.content_seller_reviews r where r.owner_type=p_owner_type and r.owner_id=p_owner_id and r.status='approved' and r.verified_purchase=true order by r.created_at desc limit greatest(1,least(coalesce(p_limit,20),50)); $$;
revoke all on function private.get_public_content_seller_reviews(text,uuid,integer) from public,anon,authenticated;
create or replace function public.get_public_content_seller_reviews(p_owner_type text,p_owner_id uuid,p_limit integer default 20)
returns table(id uuid,rating smallint,comment text,source_type text,verified_purchase boolean,created_at timestamptz)
language sql security invoker set search_path=''
stable as $$ select * from private.get_public_content_seller_reviews(p_owner_type,p_owner_id,p_limit); $$;
revoke all on function public.get_public_content_seller_reviews(text,uuid,integer) from public;
grant execute on function public.get_public_content_seller_reviews(text,uuid,integer) to anon,authenticated;
drop policy if exists "feedback_public" on public.profile_feedback;
drop policy if exists "profile_feedback_public_verified_select" on public.profile_feedback;
drop policy if exists "testimonials_public" on public.profile_testimonials;
drop policy if exists "fans_creators_public_select" on public.fans_creators;
drop policy if exists "content_seller_reviews_public_select" on public.content_seller_reviews;
