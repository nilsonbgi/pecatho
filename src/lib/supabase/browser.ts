import { createBrowserClient } from "@supabase/ssr";

// Valores públicos do projeto Supabase. O ambiente da Vercel pode sobrescrevê-los,
// mas a aplicação não pode deixar de funcionar quando essas variáveis não forem
// injetadas durante o build.
const SUPABASE_URL = "https://haplmoswsojbibgamqju.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY;
  return createBrowserClient(url, key);
}
