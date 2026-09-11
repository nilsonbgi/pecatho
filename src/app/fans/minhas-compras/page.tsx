import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function money(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL" }).format(Number(value || 0));
}

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    paid: "PAGO",
    refunded: "REEMBOLSADO",
    chargeback: "CHARGEBACK",
    failed: "FALHOU",
    cancelled: "CANCELADO",
    pending: "PENDENTE",
    awaiting_payment: "AGUARDANDO PAGAMENTO",
    authorized: "AUTORIZADO",
  };
  return labels[status] || status.toUpperCase();
}

function statusClass(status: string) {
  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (["refunded", "chargeback"].includes(status)) return "bg-red-100 text-red-700";
  if (["failed", "cancelled"].includes(status)) return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-800";
}

type HistoryRow = {
  id: string;
  orderNumber: string;
  kind: "post" | "subscription" | "other";
  title: string;
  amount: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string | null;
  provider: string | null;
  paidAt: string | null;
  createdAt: string;
  renewal: boolean;
  purchaseStatus: string | null;
  accessStartsAt: string | null;
  accessEndsAt: string | null;
  creatorSlug: string | null;
  productId: string | null;
};

export default async function MyFansPurchasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/fans/minhas-compras");

  const admin = createAdminClient();
  const [{ data: orders, error: ordersError }, { data: purchases, error: purchasesError }] = await Promise.all([
    admin.from("orders").select("id,order_number,status,total,currency,metadata,created_at,updated_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    admin.from("fans_purchases").select("id,post_id,subscription_id,status,amount,currency,provider,provider_reference,paid_at,created_at,access_starts_at,access_ends_at,creator_id").eq("buyer_user_id", user.id).order("created_at", { ascending: false }),
  ]);

  if (ordersError) throw new Error(ordersError.message);
  if (purchasesError) throw new Error(purchasesError.message);

  const orderIds = (orders ?? []).map((order) => order.id);
  const [{ data: payments }, { data: creators }] = await Promise.all([
    orderIds.length
      ? admin.from("payments").select("order_id,status,provider,provider_payment_id,payment_method,paid_at,created_at,updated_at").eq("user_id", user.id).in("order_id", orderIds)
      : Promise.resolve({ data: [] as { order_id: string; status: string; provider: string | null; provider_payment_id: string | null; payment_method: string | null; paid_at: string | null; created_at: string; updated_at: string }[] }),
    purchases?.length
      ? admin.from("fans_creators").select("id,slug,display_name").in("id", [...new Set(purchases.map((purchase) => purchase.creator_id))])
      : Promise.resolve({ data: [] as { id: string; slug: string; display_name: string }[] }),
  ]);

  const paymentByOrder = new Map<string, (typeof payments extends Array<infer T> ? T : never)>();
  for (const payment of payments ?? []) {
    const previous = paymentByOrder.get(payment.order_id);
    if (!previous || new Date(payment.created_at).getTime() > new Date(previous.created_at).getTime()) paymentByOrder.set(payment.order_id, payment);
  }

  const creatorById = new Map((creators ?? []).map((creator) => [creator.id, creator]));
  const purchaseByProvider = new Map((purchases ?? []).filter((purchase) => purchase.provider_reference).map((purchase) => [`${purchase.provider}:${purchase.provider_reference}`, purchase]));

  const rows: HistoryRow[] = (orders ?? []).map((order) => {
    const metadata = order.metadata && typeof order.metadata === "object" ? order.metadata as Record<string, unknown> : {};
    const kind = metadata.product_type === "post" || metadata.kind === "post" ? "post" : metadata.product_type === "subscription" || metadata.kind === "subscription" ? "subscription" : "other";
    const productId = typeof metadata.product_id === "string" ? metadata.product_id : kind === "post" && typeof metadata.post_id === "string" ? metadata.post_id : kind === "subscription" && typeof metadata.plan_id === "string" ? metadata.plan_id : null;
    const provider = paymentByOrder.get(order.id)?.provider ?? null;
    const providerPaymentId = paymentByOrder.get(order.id)?.provider_payment_id ?? null;
    const purchase = provider && providerPaymentId ? purchaseByProvider.get(`${provider}:${providerPaymentId}`) : undefined;
    const creatorId = typeof metadata.creator_id === "string" ? metadata.creator_id : purchase?.creator_id ?? null;
    const creator = creatorId ? creatorById.get(creatorId) : undefined;
    const title = typeof metadata.title === "string" && metadata.title.trim() ? metadata.title : kind === "subscription" ? "Assinatura Fans" : kind === "post" ? "Conteúdo Fans" : "Operação Fans";

    return {
      id: order.id,
      orderNumber: order.order_number,
      kind,
      title,
      amount: Number(order.total || 0),
      currency: String(order.currency || "BRL").trim() || "BRL",
      orderStatus: String(order.status),
      paymentStatus: paymentByOrder.get(order.id)?.status ?? null,
      provider,
      paidAt: paymentByOrder.get(order.id)?.paid_at ?? purchase?.paid_at ?? null,
      createdAt: order.created_at,
      renewal: metadata.renewal === true || metadata.renewal === "true",
      purchaseStatus: purchase?.status ?? null,
      accessStartsAt: purchase?.access_starts_at ?? null,
      accessEndsAt: purchase?.access_ends_at ?? null,
      creatorSlug: creator?.slug ?? null,
      productId,
    };
  });

  const paid = rows.filter((row) => row.purchaseStatus === "paid" || row.paymentStatus === "paid").length;
  const refunds = rows.filter((row) => row.orderStatus === "refunded" || row.paymentStatus === "refunded" || row.paymentStatus === "chargeback" || row.purchaseStatus === "refunded").length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <nav className="mx-auto mb-8 flex max-w-6xl items-center justify-between gap-4">
        <Link href="/fans" className="font-semibold text-slate-900">Pecatho <span className="text-slate-500">Fans</span></Link>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/fans" className="rounded-lg border bg-white px-3 py-2">Explorar</Link>
          <Link href="/fans/minhas-assinaturas" className="rounded-lg border bg-white px-3 py-2">Minhas assinaturas</Link>
          <Link href="/painel" className="rounded-lg bg-slate-900 px-3 py-2 text-white">Painel Pecatho</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl">
        <header className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Pecatho Fans · Área do fã</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Minhas compras</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Histórico completo das operações Fans vinculadas à sua conta: conteúdo adquirido, assinaturas, renovações, pagamentos e eventuais reembolsos ou chargebacks. A situação exibida é baseada nos registros comerciais confirmados.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">{rows.length} operação(ões)</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">{paid} paga(s)</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">{refunds} reembolso(s)/chargeback(s)</span>
          </div>
        </header>

        <section className="mt-6 grid gap-4">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
              <h2 className="text-xl font-bold text-slate-950">Nenhuma compra registrada</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Quando uma operação Fans for criada para sua conta, o pedido e seu estado comercial aparecerão aqui.</p>
              <Link href="/fans" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Explorar Fans</Link>
            </div>
          ) : rows.map((row) => {
            const status = row.purchaseStatus || row.paymentStatus || row.orderStatus;
            const activeAccess = row.kind === "subscription" && row.purchaseStatus === "paid" && row.accessEndsAt && new Date(row.accessEndsAt).getTime() >= Date.now();
            return (
              <article key={row.id} className="rounded-2xl border bg-white p-6 shadow-sm sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(status)}`}>{statusLabel(status)}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{row.kind === "subscription" ? "ASSINATURA" : row.kind === "post" ? "CONTEÚDO" : "FANS"}</span>
                      {row.renewal && <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">RENOVAÇÃO</span>}
                    </div>
                    <h2 className="mt-3 text-xl font-bold text-slate-950">{row.title}</h2>
                    {row.creatorSlug && <p className="mt-1 text-sm text-slate-600">Criador: {row.creatorSlug}</p>}
                    <p className="mt-2 text-xs text-slate-500">Pedido {row.orderNumber} · criado em {date(row.createdAt)}</p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-2xl font-bold text-slate-950">{money(row.amount, row.currency)}</p>
                    <p className="mt-1 text-sm text-slate-500">{row.provider ? `Pagamento via ${row.provider}` : "Pagamento ainda não vinculado"}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 border-t pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><span className="text-slate-500">Pagamento</span><p className="mt-1 font-semibold text-slate-900">{row.paymentStatus ? statusLabel(row.paymentStatus) : "—"}</p></div>
                  <div><span className="text-slate-500">Confirmação</span><p className="mt-1 font-semibold text-slate-900">{date(row.paidAt)}</p></div>
                  {row.kind === "subscription" ? <>
                    <div><span className="text-slate-500">Período de acesso</span><p className="mt-1 font-semibold text-slate-900">{date(row.accessStartsAt)}</p></div>
                    <div><span className="text-slate-500">Término do período</span><p className="mt-1 font-semibold text-slate-900">{date(row.accessEndsAt)}</p></div>
                  </> : <>
                    <div><span className="text-slate-500">Operação</span><p className="mt-1 font-semibold text-slate-900">{statusLabel(row.orderStatus)}</p></div>
                    <div><span className="text-slate-500">Acesso</span><p className="mt-1 font-semibold text-slate-900">{row.purchaseStatus === "paid" ? "Liberado" : "Não liberado"}</p></div>
                  </>}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {row.kind === "post" && row.productId && row.purchaseStatus === "paid" && <Link href={`/fans/publicacoes/${row.productId}`} className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Abrir conteúdo</Link>}
                  {row.kind === "subscription" && <Link href="/fans/minhas-assinaturas" className="inline-flex rounded-xl border px-4 py-2.5 text-sm font-semibold text-slate-900">Ver assinatura</Link>}
                  {row.creatorSlug && <Link href={`/fans/${row.creatorSlug}`} className="inline-flex rounded-xl border px-4 py-2.5 text-sm font-semibold text-slate-900">Ver criador</Link>}
                </div>

                {activeAccess && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">Esta compra de assinatura corresponde a um período de acesso pago que permanece válido até {date(row.accessEndsAt)}.</p>}
                {row.purchaseStatus === "refunded" && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs leading-5 text-red-800">Esta compra foi reembolsada ou estornada. O estado atual da assinatura é recalculado a partir dos demais períodos efetivamente pagos.</p>}
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
