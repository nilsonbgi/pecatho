-- Version the production index used by public advertiser discovery.
create index if not exists advertiser_profiles_published_location_created_idx
on public.advertiser_profiles (category_id, state_id, city_id, created_at desc, id)
where status = 'published';
