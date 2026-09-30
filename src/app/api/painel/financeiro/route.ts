import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  requested: "Solicitado",
  approved: "Aprovado",
  processing: "Em processamento",
  paid: "Pago",
  rejected: "Rejeitado",
  failed: "Falhou",
  cancelled: "Cancelado",
};

type SaleRow = {
  id: string;
  product_id: string;
  order_id: string;
  amount: number | string | null;
  owner_amount: number | string | null;
  status: string;
  paid_at: string | null;
};

type ProductRow = {
  id: string;
  title: string;
};

function idempotencyKey(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 120);
  return crypto.randomUUID();
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "É necessário estar autenticado." }, { status: 401 });

  const [{ data: ledger, error: ledgerError }, { data: payouts, error: payoutError }] = await Promise.all([
    supabase.from("ledger_entries")
      .select("id,order_id,payment_id,entry_type,amount,currency,description,idempotency_key,metadata,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("fans_payout_requests")
      .select("id,amount,currency,status,requested_at,processed_at,rejection_reason,provider,provider_reference,idempotency_key")
      .eq("seller_user_id", user.id)
      .order("requested_at", { ascending: false })
      .limit(50),
  ]);

  if (ledgerError || payoutError) {
    return NextResponse.json({ error: "Não foi possível carregar o financeiro da conta." }, { status: 500 });
  }

  const entries = ledger || [];
  const pendingPayouts = (payouts || []).filter((row) => ["requested", "approved", "processing"].includes(row.status));
  const credits = entries
    .filter((row) => row.entry_type === "credit" || row.entry_type === "adjustment")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const fees = entries
    .filter((row) => row.entry_type === "fee")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const reversals = entries
    .filter((row) => row.entry_type === "refund" || row.entry_type === "chargeback")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const paidOut = entries
    .filter((row) => row.entry_type === "payout")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const requested = pendingPayouts.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const available = Math.max(credits - fees - reversals - paidOut - requested, 0);

  const saleIds = entries.map((row) => row.metadata && typeof row.metadata === "object" && "sale_id" in row.metadata ? String(row.metadata.sale_id) : null).filter((id): id is string => Boolean(id));
  const productIds = entries.map((row) => row.metadata && typeof row.metadata === "object" && "product_id" in row.metadata ? String(row.metadata.product_id) : null).filter((id): id is string => Boolean(id));

  const [{ data: sales }, { data: products }] = await Promise.all([
    saleIds.length ? supabase.from("digital_content_sales").select("id,product_id,order_id,amount,owner_amount,status,paid_at").in("id", [...new Set(saleIds)]) : Promise.resolve({ data: [] as SaleRow[] }),
    productIds.length ? supabase.from("digital_content_products").select("id,title").in("id", [...new Set(productIds)]) : Promise.resolve({ data: [] as ProductRow[] }),
  ]);
  const saleRows = (sales || []) as SaleRow[];
  const productRows = (products || []) as ProductRow[];
  const saleMap = new Map(saleRows.map((sale) => [sale.id, sale]));
  const productMap = new Map(productRows.map((product) => [product.id, product]));

  const movements = entries.map((row) => ({
    id: row.id,
    type: row.entry_type,
    amount: Number(row.amount || 0),
    currency: row.currency,
    description: row.description,
    created_at: row.created_at,
    metadata: row.metadata,
    sale: row.metadata && typeof row.metadata === "object" && "sale_id" in row.metadata ? saleMap.get(String(row.metadata.sale_id)) || null : null,
    product: row.metadata && typeof row.metadata === "object" && "product_id" in row.metadata ? productMap.get(String(row.metadata.product_id)) || null : null,
  }));

  return NextResponse.json({
    summary: { credits, fees, reversals, paid_out: paidOut, requested, available },
    payouts: (payouts || []).map((row) => ({ ...row, status_label: STATUS_LABELS[row.status] || row.status })),
    movements,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "É necessário estar autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  const key = idempotencyKey(body?.idempotency_key);

  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) {
    return NextResponse.json({ error: "Informe um valor válido com até duas casas decimais." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("request_seller_payout", {
    p_amount: Math.round(amount * 100) / 100,
    p_idempotency_key: key,
  });

  if (error) {
    const message = error.message || "Não foi possível registrar o recebimento.";
    const status = /mínimo|insuficiente|inválido|não autenticado/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  const payout = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ payout }, { status: 201 });
}
