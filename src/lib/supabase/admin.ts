import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://haplmoswsojbibgamqju.supabase.co";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
