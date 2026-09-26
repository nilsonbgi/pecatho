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

  let mediaSalesCount = 0;

  if (ownerType === "advertiser") {
    const { data: mediaRows, error: mediaRowsError } = await admin
      .from("profile_media")
      .select("id")
      .eq("profile_id", ownerId);

    if (mediaRowsError) {
      console.error(mediaRowsError);
      return NextResponse.json(
        { error: "Não foi possível carregar a reputação." },
        { status: 500 },
      );
    }

    const mediaIds = (mediaRows ?? []).map((row) => row.id);

    if (mediaIds.length > 0) {
      const { count, error: mediaSalesError } = await admin
        .from("profile_media_purchases")
        .select("id", { count: "exact", head: true })
        .eq("status", "paid")
        .in("media_id", mediaIds);

      if (mediaSalesError) {
        console.error(mediaSalesError);
        return NextResponse.json(
          { error: "Não foi possível carregar a reputação." },
          { status: 500 },
        );
      }

      mediaSalesCount = count ?? 0;
    }
  }

  const [{ data: reviews, error: reviewError }, { count: digitalSalesCount, error: digitalSalesError }] =
    await Promise.all([
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
    ]);

  if (reviewError || digitalSalesError) {
    console.error(reviewError ?? digitalSalesError);
    return NextResponse.json(
      { error: "Não foi possível carregar a reputação." },
      { status: 500 },
    );
  }

  if (reviewError) {
    console.error(reviewError);
    return NextResponse.json({ error: "Não foi possível carregar a reputação." }, { status: 500 });
  }

  const verifiedSalesCount = (digitalSalesCount ?? 0) + mediaSalesCount;
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
