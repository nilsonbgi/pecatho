import "server-only";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://haplmoswsojbibgamqju.supabase.co";
const PARTNER_MEDIA_BUCKET = "pecatho-partner-media";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

type PartnerMediaPath = {
  preview_storage_bucket: string | null;
  preview_storage_path: string | null;
};

/** Creates short-lived URLs only for approved preview paths in the partner-media bucket. */
export async function createPartnerMediaSignedUrlMap(items: PartnerMediaPath[]): Promise<Map<string, string>> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const paths = [...new Set(items
    .filter((item) => item.preview_storage_bucket === PARTNER_MEDIA_BUCKET && Boolean(item.preview_storage_path))
    .map((item) => item.preview_storage_path as string))];

  if (!serviceRoleKey || paths.length === 0) return new Map();

  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.storage
    .from(PARTNER_MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return new Map();

  const urls = new Map<string, string>();
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) {
      urls.set(PARTNER_MEDIA_BUCKET + ":" + item.path, item.signedUrl);
    }
  }
  return urls;
}
