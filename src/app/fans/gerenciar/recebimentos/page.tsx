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

  const { data: liveReconciliationData, error: liveReconciliationError } = await supabase
    .rpc("fans_live_financial_reconciliation", { p_creator_id: creator.id });
  if (liveReconciliationError) throw new Error(liveReconciliationError.message);

  type LiveReconciliation = {
    gross_live_sales: number | string;
    live_refunds: number | string;
    live_creator_holds: number | string;
    live_hold_releases: number | string;
    live_net_creator_impact: number | string;
    live_completed_count: number | string;
    live_refunded_count: number | string;
    live_refund_pending_count: number | string;
    available: number | string;
  };

  const liveReconciliation = ((liveReconciliationData ?? [])[0] ?? {
    gross_live_sales: 0,
    live_refunds: 0,
    live_creator_holds: 0,
    live_hold_releases: 0,
    live_net_creator_impact: 0,
    live_completed_count: 0,
    live_refunded_count: 0,
    live_refund_pending_count: 0,
    available,
  }) as LiveReconciliation;

  const liveGrossSales = Number(liveReconciliation.gross_live_sales);
  const liveRefunds = Number(liveReconciliation.live_refunds);
  const liveCreatorHolds = Number(liveReconciliation.live_creator_holds);
  const liveHoldReleases = Number(liveReconciliation.live_hold_releases);
  const liveNetCreatorImpact = Number(liveReconciliation.live_net_creator_impact);
  const liveCompletedCount = Number(liveReconciliation.live_completed_count);
  const liveRefundedCount = Number(liveReconciliation.live_refunded_count);
  const liveRefundPendingCount = Number(liveReconciliation.live_refund_pending_count);

  type LiveStatementRow = {
    session_id: string;
    order_id: string | null;
    payment_id: string | null;
    title: string | null;
    session_status: string;
    commercial_outcome: string | null;
    ended_reason: string | null;
    amount: number | string;
    currency: string;
    paid_at: string | null;
    started_at: string | null;
    ended_at: string | null;
    refund_status: string | null;
    refund_amount: number | string | null;
    refund_reason: string | null;
    sale_gross: number | string;
    provider_fees: number | string;
    platform_fees: number | string;
    creator_credit: number | string;
    creator_debit: number | string;
    creator_hold: number | string;
    hold_release: number | string;
    creator_net_impact: number | string;
  };

  const { data: liveStatementData, error: liveStatementError } = await supabase
    .rpc("fans_live_financial_statement", { p_creator_id: creator.id });
  if (liveStatementError) throw new Error(liveStatementError.message);
  const liveStatement = (liveStatementData ?? []) as LiveStatementRow[];

  const liveOutcomeLabel = (value: string | null) => ({
    creator_removed_participant: "Participante removido pelo criador",
    creator_ended_early: "Criador encerrou antes do término",
    creator_completed: "Concluída pelo criador",
    buyer_left: "Participante saiu",
    system_expired: "Encerrada automaticamente",
  } as Record<string, string>)[value ?? ""] ?? value ?? "—";

  const liveRefundLabel = (value: string | null) => ({
    not_required: "Não necessário",
    required: "Reembolso necessário",
    requested: "Reembolso em processamento",
    refunded: "Reembolsado",
    failed: "Falha no reembolso",
  } as Record<string, string>)[value ?? ""] ?? value ?? "—";

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

        <section className="card" style={{ marginTop: 20 }}>
          <div className="eyebrow">CONCILIAÇÃO DAS CHAMADAS AO VIVO</div>
          <h2>Resultado financeiro das chamadas</h2>
          <p>
            Esta visão separa as chamadas ao vivo do restante da operação e considera vendas, reembolsos,
            reservas temporárias de saldo e liberações de reservas. O saldo disponível continua sendo
            calculado pela mesma fonte financeira usada para os recebimentos.
          </p>
          <div className="fansMetrics" style={{ marginTop: 20 }}>
            <article className="card">
              <span className="metricLabel">VENDAS AO VIVO</span>
              <strong>{money(liveGrossSales)}</strong>
              <p>{liveCompletedCount} chamada(s) concluída(s)</p>
            </article>
            <article className="card">
              <span className="metricLabel">REEMBOLSOS</span>
              <strong>{money(liveRefunds)}</strong>
              <p>{liveRefundedCount} chamada(s) com reembolso concluído</p>
            </article>
            <article className="card">
              <span className="metricLabel">SALDO RESERVADO</span>
              <strong>{money(liveCreatorHolds)}</strong>
              <p>{liveRefundPendingCount} tratamento(s) ainda pendente(s)</p>
            </article>
            <article className="card">
              <span className="metricLabel">IMPACTO LÍQUIDO</span>
              <strong>{money(liveNetCreatorImpact)}</strong>
              <p>{money(liveHoldReleases)} em reservas liberadas</p>
            </article>
          </div>
          <p style={{ marginTop: 18, marginBottom: 0 }}>
            O valor reservado não representa perda definitiva: enquanto o provedor processa um reembolso,
            o crédito do criador permanece bloqueado. Se o reembolso falhar, a reserva é liberada de forma
            idempotente; se for concluído, a reserva permanece como débito financeiro definitivo.
          </p>
        </section>

        <section className="card" style={{ marginTop: 20, overflowX: "auto" }}>
          <div style={{ minWidth: 1120 }}>
            <div className="eyebrow">CONCILIAÇÃO POR CHAMADA</div>
            <h2>Histórico financeiro das chamadas ao vivo</h2>
            <p>Cada chamada é reconciliada pelo <strong>order_id</strong> no ledger financeiro. A coluna “Impacto do criador” representa o crédito menos os débitos efetivamente registrados; o valor do reembolso ao comprador é exibido separadamente. Assim, uma mesma chamada não é contabilizada duas vezes entre pagamento, reembolso e saldo.</p>
            <div style={{ marginTop: 24 }}>
              {liveStatement.length === 0 ? <p>Nenhuma chamada ao vivo registrada ainda.</p> : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th align="left">Data</th><th align="left">Chamada</th><th align="left">Resultado</th>
                    <th align="left">Reembolso</th><th align="right">Contratado</th><th align="right">Bruto</th>
                    <th align="right">Taxas</th><th align="right">Reembolso</th><th align="right">Impacto</th>
                  </tr></thead>
                  <tbody>{liveStatement.map(s => (
                    <tr key={s.session_id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td>{date(s.ended_at || s.started_at || s.paid_at)}</td>
                      <td>{s.title || "Chamada ao vivo"}</td>
                      <td>{liveOutcomeLabel(s.commercial_outcome)}</td>
                      <td>{liveRefundLabel(s.refund_status)}</td>
                      <td align="right">{money(Number(s.amount))}</td>
                      <td align="right">{money(Number(s.sale_gross))}</td>
                      <td align="right">{money(Number(s.provider_fees) + Number(s.platform_fees))}</td>
                      <td align="right">{money(Number(s.refund_amount || 0))}</td>
                      <td align="right"><strong>{money(Number(s.creator_net_impact))}</strong></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20, overflowX: "auto" }}><div style={{ minWidth: 900 }}><div className="eyebrow">EXTRATO</div><h1>Extrato financeiro</h1><p>Os indicadores financeiros são calculados por agregação no banco. A tabela abaixo exibe os 200 movimentos mais recentes.</p><div style={{ marginTop: 24 }}>{posted.length === 0 ? <p>Nenhum movimento financeiro registrado ainda.</p> : <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th align="left">Data</th><th align="left">Evento</th><th align="left">Direção</th><th align="right">Valor</th><th align="left">Provedor</th></tr></thead><tbody>{posted.map(e => <tr key={e.id} style={{ borderTop: "1px solid #e5e7eb" }}><td>{date(e.occurred_at)}</td><td>{entryLabel(e.entry_type)}</td><td>{e.direction === "credit" ? "Crédito" : "Débito"}</td><td align="right">{money(Number(e.amount))}</td><td>{e.provider || "—"}</td></tr>)}</tbody></table>}</div></div></section>
        <section className="card" style={{ marginTop: 20, overflowX: "auto" }}><div style={{ minWidth: 900 }}><div className="eyebrow">HISTÓRICO DE RECEBIMENTOS</div><h2>Solicitações de recebimento</h2><p>O saldo reservado considera todas as solicitações abertas, não apenas as exibidas nesta tabela. A tabela mostra as 50 solicitações mais recentes.</p><div style={{ marginTop: 20 }}>{payoutRows.length === 0 ? <p>Nenhuma solicitação registrada ainda.</p> : <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th align="left">Solicitado</th><th align="right">Valor</th><th align="left">Status</th><th align="left">Processado</th><th align="left">Motivo</th></tr></thead><tbody>{payoutRows.map(p => <tr key={p.id} style={{ borderTop: "1px solid #e5e7eb" }}><td>{date(p.requested_at)}</td><td align="right">{money(Number(p.amount))}</td><td>{statusLabel(p.status)}</td><td>{date(p.processed_at)}</td><td>{p.rejection_reason || "—"}</td></tr>)}</tbody></table>}</div></div></section>
        <p style={{ marginTop: 20 }}>Para acompanhar vendas confirmadas, estornos e contestações, consulte <Link href="/fans/gerenciar/vendas">Vendas e monetização</Link>.</p>
      </section>
    </main>
  );
}
