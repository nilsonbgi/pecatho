-- Add covering indexes for high-traffic foreign-key paths used by messaging,
-- digital-content fulfillment, Fans financial reporting, and moderation.
-- These indexes do not change row visibility or business rules.
create index if not exists conversation_members_user_id_idx
  on public.conversation_members (user_id);

create index if not exists conversations_profile_id_idx
  on public.conversations (profile_id);

create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

create index if not exists digital_content_product_items_owner_user_id_idx
  on public.digital_content_product_items (owner_user_id);

create index if not exists digital_content_products_owner_user_id_idx
  on public.digital_content_products (owner_user_id);

create index if not exists digital_content_sales_payment_id_idx
  on public.digital_content_sales (payment_id);

create index if not exists digital_content_sales_product_id_idx
  on public.digital_content_sales (product_id);

create index if not exists fans_financial_ledger_purchase_id_idx
  on public.fans_financial_ledger (purchase_id);

create index if not exists fans_financial_ledger_subscription_id_idx
  on public.fans_financial_ledger (subscription_id);

create index if not exists fans_live_extension_requests_creator_id_idx
  on public.fans_live_extension_requests (creator_id);

create index if not exists fans_live_extension_requests_order_id_idx
  on public.fans_live_extension_requests (order_id);

create index if not exists fans_live_extension_requests_payment_id_idx
  on public.fans_live_extension_requests (payment_id);

create index if not exists fans_live_sessions_conversation_id_idx
  on public.fans_live_sessions (conversation_id);

create index if not exists fans_live_sessions_payment_id_idx
  on public.fans_live_sessions (payment_id);

create index if not exists ledger_entries_order_id_idx
  on public.ledger_entries (order_id);

create index if not exists ledger_entries_payment_id_idx
  on public.ledger_entries (payment_id);

create index if not exists orders_plan_id_idx
  on public.orders (plan_id);

create index if not exists payments_user_id_idx
  on public.payments (user_id);

create index if not exists payouts_user_id_idx
  on public.payouts (user_id);

create index if not exists pecatho_gifts_payment_id_idx
  on public.pecatho_gifts (payment_id);

create index if not exists profile_media_purchases_order_id_idx
  on public.profile_media_purchases (order_id);

create index if not exists profile_publications_profile_id_idx
  on public.profile_publications (profile_id);

create index if not exists profile_publications_plan_id_idx
  on public.profile_publications (plan_id);

create index if not exists reports_reporter_id_idx
  on public.reports (reporter_id);

create index if not exists reports_reported_user_id_idx
  on public.reports (reported_user_id);

create index if not exists reports_profile_id_idx
  on public.reports (profile_id);

create index if not exists reports_assigned_to_idx
  on public.reports (assigned_to);

create index if not exists profile_testimonials_profile_id_idx
  on public.profile_testimonials (profile_id);

create index if not exists user_blocks_blocked_user_id_idx
  on public.user_blocks (blocked_user_id);

create index if not exists user_follows_profile_id_idx
  on public.user_follows (profile_id);

create index if not exists verification_cases_user_id_idx
  on public.verification_cases (user_id);
