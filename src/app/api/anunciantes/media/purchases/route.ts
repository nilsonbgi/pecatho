import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SellerReputation = {
  average_rating: number | null;
  review_count: number;
  verified_sales_count: number;
  trust_badge: boolean;
};

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

  const [{ data: reviews, error: reviewsError }, { data: digitalSales, error: digitalSalesError }] = await Promise.all([
    profileIds.length
      ? admin.from("content_seller_reviews").select("owner_id,rating").eq("owner_type", "advertiser").eq("status", "approved").eq("verified_purchase", true).in("owner_id", profileIds)
      : Promise.resolve({ data: [], error: null }),
    profileIds.length
      ? admin.from("digital_content_sales").select("owner_id").eq("owner_type", "advertiser").eq("status", "paid").in("owner_id", profileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (reviewsError) return NextResponse.json({ error: reviewsError.message }, { status: 500 });
  if (digitalSalesError) return NextResponse.json({ error: digitalSalesError.message }, { status: 500 });

  const advertiserMediaIds = new Map<string, string[]>();
  for (const item of media ?? []) {
    const current = advertiserMediaIds.get(item.profile_id) ?? [];
    current.push(item.id);
    advertiserMediaIds.set(item.profile_id, current);
  }

  const allSellerMediaIds = [...new Set([...advertiserMediaIds.values()].flat())];
  const mediaSalesCount = new Map<string, number>();
  if (allSellerMediaIds.length) {
    const { data: mediaSales, error: mediaSalesError } = await admin
      .from("profile_media_purchases")
      .select("media_id")
      .in("media_id", allSellerMediaIds)
      .eq("status", "paid");
    if (mediaSalesError) return NextResponse.json({ error: mediaSalesError.message }, { status: 500 });

    const mediaOwnerMap = new Map<string, string>();
    for (const [profileId, ids] of advertiserMediaIds) {
      for (const id of ids) mediaOwnerMap.set(id, profileId);
    }
    for (const sale of mediaSales ?? []) {
      const ownerId = mediaOwnerMap.get(sale.media_id);
      if (ownerId) mediaSalesCount.set(ownerId, (mediaSalesCount.get(ownerId) ?? 0) + 1);
    }
  }

  const ratingsMap = new Map<string, { total: number; count: number }>();
  for (const review of reviews ?? []) {
    const current = ratingsMap.get(review.owner_id) ?? { total: 0, count: 0 };
    current.total += Number(review.rating);
    current.count += 1;
    ratingsMap.set(review.owner_id, current);
  }

  const digitalSalesCount = new Map<string, number>();
  for (const sale of digitalSales ?? []) {
    digitalSalesCount.set(sale.owner_id, (digitalSalesCount.get(sale.owner_id) ?? 0) + 1);
  }

  const reputationMap = new Map<string, SellerReputation>();
  for (const profileId of profileIds) {
    const rating = ratingsMap.get(profileId);
    const verifiedSales = (digitalSalesCount.get(profileId) ?? 0) + (mediaSalesCount.get(profileId) ?? 0);
    reputationMap.set(profileId, {
      average_rating: rating ? Number((rating.total / rating.count).toFixed(1)) : null,
      review_count: rating?.count ?? 0,
      verified_sales_count: verifiedSales,
      trust_badge: verifiedSales > 0,
    });
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const mediaMap = new Map((media ?? []).map((item) => [item.id, item]));
  const now = Date.now();

  const result = [];
  for (const purchase of purchases ?? []) {
    const item = mediaMap.get(purchase.media_id);
    const profile = item ? profileMap.get(item.profile_id) : null;
    if (!item || !profile || item.moderation_status !== "approved") continue;
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
        id: profile.id,
        slug: profile.slug,
        display_name: profile.display_name,
        seller_reputation: reputationMap.get(profile.id) ?? null,
      },
    });
  }

  return NextResponse.json({ purchases: result }, { headers: { "Cache-Control": "no-store" } });
}
