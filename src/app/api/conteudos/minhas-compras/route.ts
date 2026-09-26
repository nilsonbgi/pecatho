import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

  const productMap = new Map((products ?? []).map((product) => [product.id, product]));
  const itemMap = new Map<string, { count: number; mediaTypes: string[] }>();

  for (const item of items ?? []) {
    const current = itemMap.get(item.product_id) ?? { count: 0, mediaTypes: [] };
    current.count += 1;
    if (item.media_type && !current.mediaTypes.includes(item.media_type)) current.mediaTypes.push(item.media_type);
    itemMap.set(item.product_id, current);
  }

  const purchases = (sales ?? []).map((sale) => ({
    id: sale.id,
    amount: sale.amount,
    currency: sale.currency,
    paid_at: sale.paid_at,
    created_at: sale.created_at,
    product: productMap.get(sale.product_id)
      ? {
          ...productMap.get(sale.product_id),
          seller: sellerMap.get(productMap.get(sale.product_id)?.owner_id ?? "") ?? null,
        }
      : null,
    files: itemMap.get(sale.product_id) ?? { count: 0, mediaTypes: [] },
  })).filter((purchase) => purchase.product !== null);

  return NextResponse.json({ purchases }, {
    headers: { "Cache-Control": "no-store" },
  });
}
