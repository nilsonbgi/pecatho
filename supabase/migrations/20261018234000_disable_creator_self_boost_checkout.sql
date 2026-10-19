-- The product flow is fan-funded creator gifts, not creators buying boosts for their own posts.
-- Keep the settlement RPC for any already-created orders, but prevent new self-purchase intents.
revoke all on function public.create_fans_boost_checkout_intent(uuid,uuid) from public, anon, authenticated;