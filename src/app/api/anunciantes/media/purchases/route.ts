import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const admin = createAdminClient();
  const { data: purchases, error } = await admin
    .from("profile_media_purchases")
    .select("id,media_id,amount,currency,purchased_at,expires_at,status")
    .eq("buyer_user_id", user.id)
    .eq("status", "paid")
    .order("purchased_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const mediaIds = [...new Set((purchases ?? []).map((purchase) => purchase.media_id))];
  if (!mediaIds.length) return NextResponse.json({ purchases: [] });

  const { data: media, error: mediaError } = await admin
    .from("profile_media")
    .select("id,profile_id,kind,price,currency,storage_bucket,storage_path,moderation_status")
    .in("id", mediaIds);

  if (mediaError) return NextResponse.json({ error: mediaError.message }, { status: 500 });

  const profileIds = [...new Set((media ?? []).map((item) => item.profile_id))];
  const { data: profiles, error: profilesError } = await admin
    .from("advertiser_profiles")
    .select("id,slug,display_name,status")
    .in("id", profileIds);

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const mediaMap = new Map((media ?? []).map((item) => [item.id, item]));
  const now = Date.now();

  const result = [];
  for (const purchase of purchases ?? []) {
    const item = mediaMap.get(purchase.media_id);
    const profile = item ? profileMap.get(item.profile_id) : null;
    if (!item || !profile || profile.status !== "published" || item.moderation_status !== "approved") continue;
    if (purchase.expires_at && new Date(purchase.expires_at).getTime() < now) continue;

    const { data: signed, error: signedError } = await admin.storage
      .from(item.storage_bucket)
      .createSignedUrl(item.storage_path, 300);
    if (signedError || !signed?.signedUrl) continue;

    result.push({
      id: purchase.id,
      media_id: item.id,
      amount: purchase.amount,
      currency: purchase.currency,
      purchased_at: purchase.purchased_at,
      expires_at: purchase.expires_at,
      kind: item.kind,
      url: signed.signedUrl,
      access_expires_in: 300,
      profile: {
        slug: profile.slug,
        display_name: profile.display_name,
      },
    });
  }

  return NextResponse.json({ purchases: result }, { headers: { "Cache-Control": "no-store" } });
}
