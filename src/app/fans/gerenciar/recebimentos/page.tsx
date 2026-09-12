import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PayoutRequestForm from "./PayoutRequestForm";

export const dynamic = "force-dynamic";

type LedgerRow = {
  id: string;
  entry_type: string;
  direction: "credit" | "debit" | string;
  amount: number | string;
  currency: string;
  status: string;
  provider: string | null;
  provider_reference: string | null;
  occurred_at: string;
  created_at: string;
};

type PayoutRow = {
  id: string;
  amount: number | string;
  currency: string;
  status: string;
  provider: string | null;
  provider_reference: string | null;
  requested_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
};

type FinancialSummary = {
  credits: number | string;
  debits: number | string;
  outstanding_payouts: number | string;
  available: number | string;
};

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

function statusLabel(status: string) {
  const labels: Record<string, string> = { requested: "Solicitado", approved: "Aprovado", processing: "Em processamento", paid: "Pago", completed: "Concluído", rejected: "Rejeitado", cancelled: "Cancelado", failed: "Falhou" };
  return labels[status] ?? status;
}

function entryLabel(entryType: string) {
  const labels: Record<string, string> = { sale_gross: "Venda bruta", provider_fee: "Taxa do provedor", platform_fee: "Taxa Pecatho", refund_gross: "Estorno bruto", refund_platform_fee: "Estorno da taxa Pecatho", refund_creator_credit: "Crédito de estorno ao criador", payout: "Recebimento" };
  return labels[entryType] ?? entryType;
}

export default async function FansReceiptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase.from("fans_creators").select("id,display_name").eq("user_id", user.id).maybeSingle();
  if (!creator) redirect("/fans/ativar");

  const admin = createAdminClient();
  const { data: summaryData, error: summaryError } = await admin.rpc("fans_financial_summary", { p_creator_id: creator.id });
  if (summaryError) throw new Error(summaryError.message);
  const summary = ((summaryData ?? [])[0] ?? { credits: 0, debits: 0, outstanding_payouts: 0, available: 0 }) as FinancialSummary;
  const credits = Number(summary.credits);
  const debits = Number(summary.debits);
  const outstandingPayouts = Number(summary.outstanding_payouts);
  const available = Number(summary.available);

  const { data: ledgerData, error: ledgerError } = await admin.from("fans_financial_ledger").select("id,entry_type,direction,amount,currency,status,provider,provider_reference,occurred_at,created_at").eq("creator_id", creator.id).order("occurred_at", { ascending: false }).limit(200);
  if (ledgerError) throw new Error(ledgerError.message);
  const ledger = (ledgerData ?? []) as LedgerRow[];
  const posted = ledger.filter(e => e.status === "posted");

  const { data: payoutsData, error: payoutsError } = await admin.from("fans_payout_requests").select("id,amount,currency,status,provider,provider_reference,requested_at,processed_at,rejection_reason").eq("creator_id", creator.id).order("requested_at", { ascending: false }).limit(50);
  if (payoutsError) throw new Error(payoutsError.message);
  const payoutRows = (payoutsData ?? []) as PayoutRow[];

  return (
    <main className="shell fansShell">
      <nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div><div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href="/fans">Visão geral</Link></div></nav>
      <section className="hero fansHero">
        <div className="eyebrow">RECEBIMENTOS · {creator.display_name}</div>
        <div className="fansMetrics">
          <article className="card"><span className="metricLabel">CRÉDITOS</span><strong>{money(credits)}</strong><p>Todos os créditos financeiros postados</p></article>
          <article className="card"><span className="metricLabel">DÉBITOS</span><strong>{money(debits)}</strong><p>Todos os débitos financeiros postados</p></article>
          <article className="card"><span className="metricLabel">EM PROCESSAMENTO</span><strong>{money(outstandingPayouts)}</strong><p>Solicitações ainda não concluídas</p></article>
          <article className="card"><span className="metricLabel">SALDO DISPONÍVEL</span><strong>{money(available)}</strong><p>Saldo agregado e validado no banco</p></article>
        </div>
        <PayoutRequestForm creatorId={creator.id} available={available} />
        <section className="card" style={{ marginTop: 20, overflowX: "auto" }}><div style={{ minWidth: 900 }}><div className="eyebrow">EXTRATO</div><h1>Extrato financeiro</h1><p>Os indicadores financeiros são calculados por agregação no banco. A tabela abaixo exibe os 200 movimentos mais recentes.</p><div style={{ marginTop: 24 }}>{posted.length === 0 ? <p>Nenhum movimento financeiro registrado ainda.</p> : <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th align="left">Data</th><th align="left">Evento</th><th align="left">Direção</th><th align="right">Valor</th><th align="left">Provedor</th></tr></thead><tbody>{posted.map(e => <tr key={e.id} style={{ borderTop: "1px solid #e5e7eb" }}><td>{date(e.occurred_at)}</td><td>{entryLabel(e.entry_type)}</td><td>{e.direction === "credit" ? "Crédito" : "Débito"}</td><td align="right">{money(Number(e.amount))}</td><td>{e.provider || "—"}</td></tr>)}</tbody></table>}</div></div></section>
        <section className="card" style={{ marginTop: 20, overflowX: "auto" }}><div style={{ minWidth: 900 }}><div className="eyebrow">HISTÓRICO DE RECEBIMENTOS</div><h2>Solicitações de recebimento</h2><p>O saldo reservado considera todas as solicitações abertas, não apenas as exibidas nesta tabela. A tabela mostra as 50 solicitações mais recentes.</p><div style={{ marginTop: 20 }}>{payoutRows.length === 0 ? <p>Nenhuma solicitação registrada ainda.</p> : <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th align="left">Solicitado</th><th align="right">Valor</th><th align="left">Status</th><th align="left">Processado</th><th align="left">Motivo</th></tr></thead><tbody>{payoutRows.map(p => <tr key={p.id} style={{ borderTop: "1px solid #e5e7eb" }}><td>{date(p.requested_at)}</td><td align="right">{money(Number(p.amount))}</td><td>{statusLabel(p.status)}</td><td>{date(p.processed_at)}</td><td>{p.rejection_reason || "—"}</td></tr>)}</tbody></table>}</div></div></section>
        <p style={{ marginTop: 20 }}>Para acompanhar vendas confirmadas, estornos e contestações, consulte <Link href="/fans/gerenciar/vendas">Vendas e monetização</Link>.</p>
      </section>
    </main>
  );
}
