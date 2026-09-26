import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ownerType = searchParams.get("owner_type");
  const ownerId = searchParams.get("owner_id");

  if ((ownerType !== "advertiser" && ownerType !== "creator") || !ownerId) {
    return NextResponse.json({ error: "Vendedor inválido." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (ownerType === "advertiser") {
    const { data: owner } = await admin
      .from("advertiser_profiles")
      .select("id,status,display_name,title,slug")
      .eq("id", ownerId)
      .eq("status", "published")
      .maybeSingle();

    if (!owner) return NextResponse.json({ reputation: null });
  } else {
    const { data: owner } = await admin
      .from("fans_creators")
      .select("id,status,display_name,slug")
      .eq("id", ownerId)
      .eq("status", "active")
      .maybeSingle();

    if (!owner) return NextResponse.json({ reputation: null });
  }

  const [{ data: reviews, error: reviewError }, digitalSales, mediaSales] = await Promise.all([
    admin
      .from("content_seller_reviews")
      .select("id,rating,comment,created_at,verified_purchase")
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .eq("status", "approved")
      .eq("verified_purchase", true)
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("digital_content_sales")
      .select("id", { count: "exact", head: true })
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .eq("status", "paid"),
    ownerType === "advertiser"
      ? admin
          .from("profile_media_purchases")
          .select("id", { count: "exact", head: true })
          .eq("status", "paid")
          .in(
            "media_id",
            (
              await admin
                .from("profile_media")
                .select("id")
                .eq("profile_id", ownerId)
                .then(({ data }) => (data ?? []).map((row) => row.id)),
            ),
          )
      : Promise.resolve({ count: 0, error: null }),
  ]);

  if (reviewError) {
    console.error(reviewError);
    return NextResponse.json({ error: "Não foi possível carregar a reputação." }, { status: 500 });
  }

  const verifiedSalesCount = (digitalSales.count ?? 0) + (mediaSales.count ?? 0);
  const ratingValues = (reviews ?? []).map((review) => Number(review.rating)).filter((value) => Number.isFinite(value));
  const reviewCount = ratingValues.length;
  const averageRating = reviewCount > 0
    ? Number((ratingValues.reduce((sum, value) => sum + value, 0) / reviewCount).toFixed(1))
    : null;

  return NextResponse.json({
    reputation: {
      average_rating: averageRating,
      review_count: reviewCount,
      verified_sales_count: verifiedSalesCount,
      trust_badge: verifiedSalesCount > 0,
      reviews: reviews ?? [],
    },
  }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
