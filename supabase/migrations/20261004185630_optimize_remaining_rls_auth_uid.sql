-- Keep ownership and participant predicates intact while allowing PostgreSQL to cache auth.uid()
-- as an initPlan instead of re-evaluating it for every row.
alter policy fans_live_extension_requests_participants_select on public.fans_live_extension_requests
  using ((buyer_user_id = (select auth.uid())) or exists (
    select 1 from public.fans_creators fc
    where fc.id = fans_live_extension_requests.creator_id
      and fc.user_id = (select auth.uid())
  ));

alter policy partner_venue_amenities_owner_write on public.partner_venue_amenities
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_amenities.venue_id and v.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.partner_venues v where v.id = partner_venue_amenities.venue_id and v.owner_user_id = (select auth.uid())));
alter policy partner_venue_amenities_owner_select on public.partner_venue_amenities
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_amenities.venue_id and v.owner_user_id = (select auth.uid())));

alter policy partner_venue_events_owner_write on public.partner_venue_events
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_events.venue_id and v.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.partner_venues v where v.id = partner_venue_events.venue_id and v.owner_user_id = (select auth.uid())));
alter policy partner_venue_events_owner_select on public.partner_venue_events
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_events.venue_id and v.owner_user_id = (select auth.uid())));

alter policy partner_venue_hours_owner_write on public.partner_venue_hours
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_hours.venue_id and v.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.partner_venues v where v.id = partner_venue_hours.venue_id and v.owner_user_id = (select auth.uid())));
alter policy partner_venue_hours_owner_select on public.partner_venue_hours
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_hours.venue_id and v.owner_user_id = (select auth.uid())));

alter policy partner_venue_leads_owner_select on public.partner_venue_leads
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_leads.venue_id and v.owner_user_id = (select auth.uid())));
alter policy partner_venue_leads_owner_update on public.partner_venue_leads
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_leads.venue_id and v.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.partner_venues v where v.id = partner_venue_leads.venue_id and v.owner_user_id = (select auth.uid())));

alter policy partner_venue_media_owner_delete on public.partner_venue_media
  using (owner_user_id = (select auth.uid()));
alter policy partner_venue_media_owner_insert on public.partner_venue_media
  with check ((owner_user_id = (select auth.uid())) and exists (
    select 1 from public.partner_venues v
    where v.id = partner_venue_media.venue_id
      and v.owner_user_id = (select auth.uid())
      and v.status = any (array['draft'::text,'rejected'::text,'paused'::text,'published'::text])
  ));
alter policy partner_venue_media_owner_select on public.partner_venue_media
  using (owner_user_id = (select auth.uid()));
alter policy partner_venue_media_owner_update on public.partner_venue_media
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

alter policy partner_venue_rates_owner_write on public.partner_venue_rates
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_rates.venue_id and v.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.partner_venues v where v.id = partner_venue_rates.venue_id and v.owner_user_id = (select auth.uid())));
alter policy partner_venue_rates_owner_select on public.partner_venue_rates
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_rates.venue_id and v.owner_user_id = (select auth.uid())));

alter policy partner_venue_services_owner_write on public.partner_venue_services
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_services.venue_id and v.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.partner_venues v where v.id = partner_venue_services.venue_id and v.owner_user_id = (select auth.uid())));
alter policy partner_venue_services_owner_select on public.partner_venue_services
  using (exists (select 1 from public.partner_venues v where v.id = partner_venue_services.venue_id and v.owner_user_id = (select auth.uid())));

alter policy partner_venues_owner_insert on public.partner_venues
  with check ((owner_user_id = (select auth.uid())) and status = 'draft'::text);
alter policy partner_venues_owner_select on public.partner_venues
  using (owner_user_id = (select auth.uid()));
alter policy partner_venues_owner_update on public.partner_venues
  using (owner_user_id = (select auth.uid()))
  with check ((owner_user_id = (select auth.uid())) and status = any (array['draft'::text,'pending_review'::text,'rejected'::text,'paused'::text]));

alter policy profile_attribute_values_owner_delete on public.profile_attribute_values
  using (exists (select 1 from public.advertiser_profiles p where p.id = profile_attribute_values.profile_id and p.user_id = (select auth.uid())));
alter policy profile_attribute_values_owner_insert on public.profile_attribute_values
  with check (exists (select 1 from public.advertiser_profiles p where p.id = profile_attribute_values.profile_id and p.user_id = (select auth.uid())));
alter policy profile_attribute_values_owner_select on public.profile_attribute_values
  using (exists (select 1 from public.advertiser_profiles p where p.id = profile_attribute_values.profile_id and p.user_id = (select auth.uid())));
alter policy profile_attribute_values_owner_update on public.profile_attribute_values
  using (exists (select 1 from public.advertiser_profiles p where p.id = profile_attribute_values.profile_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.advertiser_profiles p where p.id = profile_attribute_values.profile_id and p.user_id = (select auth.uid())));

alter policy profile_services_owner_delete on public.profile_services
  using (exists (select 1 from public.advertiser_profiles p where p.id = profile_services.profile_id and p.user_id = (select auth.uid())));
alter policy profile_services_owner_insert on public.profile_services
  with check (exists (select 1 from public.advertiser_profiles p where p.id = profile_services.profile_id and p.user_id = (select auth.uid())));
alter policy profile_services_owner_select on public.profile_services
  using (exists (select 1 from public.advertiser_profiles p where p.id = profile_services.profile_id and p.user_id = (select auth.uid())));
alter policy profile_services_owner_update on public.profile_services
  using (exists (select 1 from public.advertiser_profiles p where p.id = profile_services.profile_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.advertiser_profiles p where p.id = profile_services.profile_id and p.user_id = (select auth.uid())));
