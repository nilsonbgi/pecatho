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

  type LedgerRow = {
    id: string;
    order_id: string | null;
    payment_id: string | null;
    entry_type: string;
    amount: number | string | null;
    currency: string;
    description: string | null;
    idempotency_key: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
  };
  type PayoutRow = {
    id: string;
    amount: number | string;
    currency: string;
    status: string;
    requested_at: string;
    processed_at: string | null;
    rejection_reason: string | null;
    provider: string | null;
    provider_reference: string | null;
    idempotency_key: string | null;
  };

  const entries: LedgerRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("ledger_entries")
      .select("id,order_id,payment_id,entry_type,amount,currency,description,idempotency_key,metadata,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 999);
    if (error) {
      return NextResponse.json({ error: "Não foi possível carregar o extrato financeiro da conta." }, { status: 500 });
    }
    const batch = (data || []) as LedgerRow[];
    entries.push(...batch);
    if (batch.length < 1000) break;
  }

  const { data: creatorData, error: creatorError } = await supabase
    .from("fans_creators")
    .select("id")
    .eq("user_id", user.id);
  if (creatorError) {
    return NextResponse.json({ error: "Não foi possível identificar as contas de conteúdo vinculadas ao perfil." }, { status: 500 });
  }
  const creatorRows = (creatorData || []) as CreatorRow[];
  const creatorIds = creatorRows.map((creator) => creator.id);

  const [{ data: fansLedgerData, error: fansLedgerError }, { data: summaryData, error: summaryError }] = await Promise.all([
    supabase.rpc("seller_fans_financial_movements"),
    supabase.rpc("seller_payout_financial_summary"),
  ]);
  if (fansLedgerError || summaryError) {
    return NextResponse.json({ error: "Não foi possível carregar o saldo financeiro unificado da conta." }, { status: 500 });
  }
  const fansEntries = (fansLedgerData || []) as FansLedgerRow[];
  const summaryRow = (Array.isArray(summaryData) ? summaryData[0] : summaryData) as FinancialSummaryRow | null;
  if (!summaryRow) {
    return NextResponse.json({ error: "O resumo financeiro não foi retornado pelo banco de dados." }, { status: 500 });
  }

  const payoutRows: PayoutRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    let payoutQuery = supabase.from("fans_payout_requests")
      .select("id,amount,currency,status,requested_at,processed_at,rejection_reason,provider,provider_reference,idempotency_key")
      .order("requested_at", { ascending: false })
      .order("id", { ascending: false });
    payoutQuery = creatorIds.length
      ? payoutQuery.or(`seller_user_id.eq.${user.id},creator_id.in.(${creatorIds.join(",")})`)
      : payoutQuery.eq("seller_user_id", user.id);
    const { data, error } = await payoutQuery.range(offset, offset + 999);
    if (error) {
      return NextResponse.json({ error: "Não foi possível carregar as solicitações de recebimento." }, { status: 500 });
    }
    const batch = (data || []) as PayoutRow[];
    payoutRows.push(...batch);
    if (batch.length < 1000) break;
  }

  const pendingPayouts = payoutRows.filter((row) => ["requested", "approved", "processing"].includes(row.status));
  const credits = Number(summaryRow.credits || 0);
  const fees = Number(summaryRow.fees || 0);
  const reversals = Number(summaryRow.reversals || 0);
  const paidOut = Number(summaryRow.paid_out || 0);
  const otherDebits = Number(summaryRow.other_debits || 0);
  const requested = Number(summaryRow.requested || 0);
  // Saldo vem da mesma função autoritativa que valida a solicitação de recebimento no banco.
  const available = Number(summaryRow.available || 0);

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

  const movements = [
    ...entries.map((row) => ({
      id: row.id,
      type: row.entry_type,
      amount: Number(row.amount || 0),
      currency: row.currency,
      description: row.description,
      created_at: row.created_at,
      metadata: row.metadata,
      sale: row.metadata && typeof row.metadata === "object" && "sale_id" in row.metadata ? saleMap.get(String(row.metadata.sale_id)) || null : null,
      product: row.metadata && typeof row.metadata === "object" && "product_id" in row.metadata ? productMap.get(String(row.metadata.product_id)) || null : null,
    })),
    ...fansEntries.map((row) => ({
      id: `fans-${row.id}`,
      type: `fans_${row.entry_type}`,
      amount: (row.direction === "credit" ? 1 : -1) * Number(row.amount || 0),
      currency: row.currency,
      description: row.description || row.entry_type.replace(/_/g, " "),
      created_at: row.occurred_at || row.created_at,
      metadata: null,
      sale: null,
      product: null,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    summary: { credits, fees, reversals, paid_out: paidOut, other_debits: otherDebits, requested, available },
    payouts: payoutRows.slice(0, 50).map((row) => ({ ...row, status_label: STATUS_LABELS[row.status] || row.status })),
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
