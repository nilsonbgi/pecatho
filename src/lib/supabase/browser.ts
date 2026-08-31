import { createBrowserClient } from "@supabase/ssr";

const FALLBACK_SUPABASE_URL = "https://haplmoswsojbibgamqju.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gbJA-2Tqt7SCeqokRLFuCQ_ubJy7QvD";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY;

  return createBrowserClient(url, key);
}
