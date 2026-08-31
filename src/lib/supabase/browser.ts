import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-only Supabase client.
 *
 * Next.js may render Client Components during the production build. In that
 * phase the public environment variables can be unavailable even though they
 * are injected when the application runs in the browser. We therefore use a
 * harmless build-time fallback and always prefer the real Vercel variables.
 * No authenticated request is made with the fallback because all database
 * access from the advertiser editor happens inside browser effects/actions.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-publishable-key";

  return createBrowserClient(url, key);
}
