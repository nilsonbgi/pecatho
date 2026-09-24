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
    .select("id,title,description,product_type,price,currency")
    .in("id", productIds);

  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });

  const { data: items, error: itemsError } = await admin
    .from("digital_content_product_items")
    .select("id,product_id,media_type,original_filename")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

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
    product: productMap.get(sale.product_id) ?? null,
    files: itemMap.get(sale.product_id) ?? { count: 0, mediaTypes: [] },
  })).filter((purchase) => purchase.product !== null);

  return NextResponse.json({ purchases }, {
    headers: { "Cache-Control": "no-store" },
  });
}
