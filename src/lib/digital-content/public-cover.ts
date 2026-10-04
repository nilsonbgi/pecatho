import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns only a dedicated preview image owned by this product.
 * Original paid files live in digital_content_product_items and must never be
 * signed for anonymous product-page rendering.
 */
export async function getPublicDigitalContentCover(
  admin: SupabaseClient,
  product: {
    id: string;
    owner_user_id: string;
    cover_bucket: string | null;
    cover_path: string | null;
  },
): Promise<string | null> {
  const bucket = product.cover_bucket;
  const path = product.cover_path;
  if (!bucket || !path || bucket !== "pecatho-private") return null;
  if (path.startsWith("/") || path.includes("..") || path.includes("\\")) return null;

  const requiredPrefix = `${product.owner_user_id}/digital-products/${product.id}/previews/`;
  if (!path.startsWith(requiredPrefix) || path.length <= requiredPrefix.length) return null;

  const { data: originalItem, error: itemError } = await admin
    .from("digital_content_product_items")
    .select("id")
    .eq("product_id", product.id)
    .eq("storage_bucket", bucket)
    .eq("storage_path", path)
    .limit(1)
    .maybeSingle();

  if (itemError || originalItem) return null;

  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 300);
  return error ? null : data?.signedUrl ?? null;
}
