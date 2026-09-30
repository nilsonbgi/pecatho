import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SaleRow = {
  id: string;
  product_id: string;
  order_id: string;
  buyer_user_id: string;
  amount: number | string | null;
  owner_amount: number | string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
};

type ProductRow = { id: string; title: string; product_type: string };
type BuyerRow = { id: string; display_name: string | null };

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("digital_content_sales")
    .select("id,product_id,order_id,buyer_user_id,amount,owner_amount,status,paid_at,created_at")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sales = (data ?? []) as SaleRow[];
  const productIds = [...new Set(sales.map((sale) => sale.product_id))];
  const { data: productData, error: productError } = productIds.length
    ? await admin.from("digital_content_products").select("id,title,product_type").in("id", productIds)
    : { data: [], error: null };

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });

  const products = (productData ?? []) as ProductRow[];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const buyerIds = [...new Set(sales.map((sale) => sale.buyer_user_id))];
  const { data: buyerData, error: buyerError } = buyerIds.length
    ? await admin.from("profiles").select("id,display_name").in("id", buyerIds)
    : { data: [], error: null };
  if (buyerError) return NextResponse.json({ error: buyerError.message }, { status: 500 });
  const buyerMap = new Map(((buyerData ?? []) as BuyerRow[]).map((buyer) => [buyer.id, buyer]));
  const paid = sales.filter((row) => row.status.toLowerCase() === "paid");
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = paid.filter((row) => row.paid_at && new Date(row.paid_at).getTime() >= cutoff);
  const sum = (rows: SaleRow[], key: "amount" | "owner_amount") =>
    rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);

  return NextResponse.json({
    sales: paid.length,
    gross: sum(paid, "amount"),
    ownerAmount: sum(paid, "owner_amount"),
    last30Sales: recent.length,
    last30Gross: sum(recent, "amount"),
    rows: sales.map((sale) => ({
      id: sale.id,
      product_id: sale.product_id,
      order_id: sale.order_id,
      amount: Number(sale.amount ?? 0),
      owner_amount: Number(sale.owner_amount ?? 0),
      status: sale.status,
      paid_at: sale.paid_at,
      created_at: sale.created_at,
      product: productMap.get(sale.product_id) ?? null,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
