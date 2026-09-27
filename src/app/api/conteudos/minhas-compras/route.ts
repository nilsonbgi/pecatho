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
  const { data: sales, error } = await admin
    .from("digital_content_sales")
    .select("id,product_id,amount,currency,paid_at,created_at,status")
    .eq("buyer_user_id", user.id)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const productIds = [...new Set((sales ?? []).map((sale) => sale.product_id).filter(Boolean))];
  if (!productIds.length) return NextResponse.json({ purchases: [] });

  const { data: products, error: productsError } = await admin
    .from("digital_content_products")
    .select("id,title,description,product_type,price,currency,owner_type,owner_id")
    .in("id", productIds);

  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });

  const { data: items, error: itemsError } = await admin
    .from("digital_content_product_items")
    .select("id,product_id,media_type,original_filename")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  const advertiserIds = [...new Set((products ?? []).filter((product) => product.owner_type === "advertiser").map((product) => product.owner_id))];
  const creatorIds = [...new Set((products ?? []).filter((product) => product.owner_type === "creator").map((product) => product.owner_id))];

  const [{ data: advertisers }, { data: creators }] = await Promise.all([
    advertiserIds.length
      ? admin.from("advertiser_profiles").select("id,display_name,title,slug").in("id", advertiserIds).eq("status", "published")
      : Promise.resolve({ data: [] }),
    creatorIds.length
      ? admin.from("fans_creators").select("id,display_name,slug").in("id", creatorIds).eq("status", "active")
      : Promise.resolve({ data: [] }),
  ]);

  const sellerMap = new Map<string, { name: string; href: string }>();
  for (const seller of advertisers ?? []) {
    sellerMap.set(seller.id, {
      name: seller.display_name || seller.title || "Anunciante",
      href: seller.slug ? `/anunciantes/${seller.slug}` : "",
    });
  }
  for (const seller of creators ?? []) {
    sellerMap.set(seller.id, {
      name: seller.display_name || "Criador",
      href: seller.slug ? `/fans/${seller.slug}` : "",
    });
  }

  const ownerKeys = [
    ...advertiserIds.map((id) => `advertiser:${id}`),
    ...creatorIds.map((id) => `creator:${id}`),
  ];

  const [{ data: reviews, error: reviewsError }, { data: sellerSales, error: sellerSalesError }] = await Promise.all([
    ownerKeys.length
      ? admin.from("content_seller_reviews").select("owner_type,owner_id,rating").eq("status", "approved").eq("verified_purchase", true)
        .or(ownerKeys.map((key) => {
          const [owner_type, owner_id] = key.split(":");
          return `and(owner_type.eq.${owner_type},owner_id.eq.${owner_id})`;
        }).join(","))
      : Promise.resolve({ data: [] }),
    ownerKeys.length
      ? admin.from("digital_content_sales").select("owner_type,owner_id").eq("status", "paid")
        .or(ownerKeys.map((key) => {
          const [owner_type, owner_id] = key.split(":");
          return `and(owner_type.eq.${owner_type},owner_id.eq.${owner_id})`;
        }).join(","))
      : Promise.resolve({ data: [] }),
  ]);

  if (reviewsError) return NextResponse.json({ error: reviewsError.message }, { status: 500 });
  if (sellerSalesError) return NextResponse.json({ error: sellerSalesError.message }, { status: 500 });

  const mediaByAdvertiser = new Map<string, string[]>();
  if (advertiserIds.length) {
    const { data: media, error: mediaError } = await admin
      .from("profile_media")
      .select("id,profile_id")
      .in("profile_id", advertiserIds);
    if (mediaError) return NextResponse.json({ error: mediaError.message }, { status: 500 });
    for (const item of media ?? []) {
      const current = mediaByAdvertiser.get(item.profile_id) ?? [];
      current.push(item.id);
      mediaByAdvertiser.set(item.profile_id, current);
    }
  }

  const allMediaIds = [...mediaByAdvertiser.values()].flat();
  const mediaSalesByAdvertiser = new Map<string, number>();
  if (allMediaIds.length) {
    const { data: mediaSales, error: mediaSalesError } = await admin
      .from("profile_media_purchases")
      .select("media_id")
      .in("media_id", allMediaIds)
      .eq("status", "paid");
    if (mediaSalesError) return NextResponse.json({ error: mediaSalesError.message }, { status: 500 });

    const mediaOwnerMap = new Map<string, string>();
    for (const [profileId, ids] of mediaByAdvertiser) {
      for (const id of ids) mediaOwnerMap.set(id, profileId);
    }
    for (const sale of mediaSales ?? []) {
      const ownerId = mediaOwnerMap.get(sale.media_id);
      if (ownerId) mediaSalesByAdvertiser.set(ownerId, (mediaSalesByAdvertiser.get(ownerId) ?? 0) + 1);
    }
  }

  const ratingsMap = new Map<string, { total: number; count: number }>();
  for (const review of reviews ?? []) {
    const key = `${review.owner_type}:${review.owner_id}`;
    const current = ratingsMap.get(key) ?? { total: 0, count: 0 };
    current.total += Number(review.rating);
    current.count += 1;
    ratingsMap.set(key, current);
  }

  const salesMap = new Map<string, number>();
  for (const sale of sellerSales ?? []) {
    const key = `${sale.owner_type}:${sale.owner_id}`;
    salesMap.set(key, (salesMap.get(key) ?? 0) + 1);
  }

  const reputationMap = new Map<string, SellerReputation>();
  for (const key of ownerKeys) {
    const rating = ratingsMap.get(key);
    const [ownerType, ownerId] = key.split(":");
    const verifiedSales = (salesMap.get(key) ?? 0) + (ownerType === "advertiser" ? (mediaSalesByAdvertiser.get(ownerId) ?? 0) : 0);
    reputationMap.set(key, {
      average_rating: rating ? Number((rating.total / rating.count).toFixed(1)) : null,
      review_count: rating?.count ?? 0,
      verified_sales_count: verifiedSales,
      trust_badge: verifiedSales > 0,
    });
  }

  const productMap = new Map((products ?? []).map((product) => [product.id, product]));
  const itemMap = new Map<string, { count: number; mediaTypes: string[] }>();

  for (const item of items ?? []) {
    const current = itemMap.get(item.product_id) ?? { count: 0, mediaTypes: [] };
    current.count += 1;
    if (item.media_type && !current.mediaTypes.includes(item.media_type)) current.mediaTypes.push(item.media_type);
    itemMap.set(item.product_id, current);
  }

  const purchases = (sales ?? []).map((sale) => {
    const product = productMap.get(sale.product_id);
    const seller = product ? sellerMap.get(product.owner_id) ?? null : null;
    return {
      id: sale.id,
      amount: sale.amount,
      currency: sale.currency,
      paid_at: sale.paid_at,
      created_at: sale.created_at,
      product: product
        ? {
            ...product,
            seller,
            seller_reputation: reputationMap.get(`${product.owner_type}:${product.owner_id}`) ?? null,
          }
        : null,
      files: itemMap.get(sale.product_id) ?? { count: 0, mediaTypes: [] },
    };
  }).filter((purchase) => purchase.product !== null);

  return NextResponse.json({ purchases }, {
    headers: { "Cache-Control": "no-store" },
  });
}
