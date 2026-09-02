drop policy if exists profile_media_owner_insert on public.profile_media;
create policy profile_media_owner_insert on public.profile_media for insert to authenticated with check (exists (select 1 from public.advertiser_profiles p where p.id = profile_media.profile_id and p.user_id = (select auth.uid())));

drop policy if exists profile_media_owner_update on public.profile_media;
create policy profile_media_owner_update on public.profile_media for update to authenticated using (exists (select 1 from public.advertiser_profiles p where p.id = profile_media.profile_id and p.user_id = (select auth.uid()))) with check (exists (select 1 from public.advertiser_profiles p where p.id = profile_media.profile_id and p.user_id = (select auth.uid())));

drop policy if exists profile_media_owner_delete on public.profile_media;
create policy profile_media_owner_delete on public.profile_media for delete to authenticated using (exists (select 1 from public.advertiser_profiles p where p.id = profile_media.profile_id and p.user_id = (select auth.uid())));