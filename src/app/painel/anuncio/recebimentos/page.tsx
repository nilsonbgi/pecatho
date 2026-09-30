import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdvertiserPayoutForm from "./AdvertiserPayoutForm";

export const dynamic = "force-dynamic";

type Payout = {
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

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const statusLabel = (value: string) => ({ requested: "Solicitado", approved: "Aprovado", processing: "Em processamento", paid: "Pago", rejected: "Rejeitado", cancelled: "Cancelado", failed: "Falhou" } as Record<string,string>)[value] ?? value;

export default async function AdvertiserReceiptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("advertiser_profiles").select("id,display_name").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/painel/anuncio");

  const admin = createAdminClient();
  const { data: ledger, error: ledgerError } = await admin.from("ledger_entries").select("entry_type,amount").eq("user_id", user.id);
  if (ledgerError) throw new Error(ledgerError.message);

  const { data: payoutRows, error: payoutError } = await admin.from("fans_payout_requests")
    .select("id,amount,currency,status,provider,provider_reference,requested_at,processed_at,rejection_reason")
    .eq("seller_user_id", user.id).order("requested_at", { ascending: false }).limit(50);
  if (payoutError) throw new Error(payoutError.message);

  const credits = (ledger ?? []).filter(e => ["credit","adjustment"].includes(e.entry_type)).reduce((sum,e) => sum + Number(e.amount),0);
  const debits = (ledger ?? []).filter(e => !["credit","adjustment"].includes(e.entry_type)).reduce((sum,e) => sum + Number(e.amount),0);
  const outstanding = (payoutRows ?? []).filter(p => ["requested","approved","processing"].includes(p.status)).reduce((sum,p) => sum + Number(p.amount),0);
  const available = Math.max(credits - debits - outstanding, 0);
  const payouts = (payoutRows ?? []) as Payout[];

  return <main className="shell">
    <nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><div className="navLinks"><Link href="/painel/anuncio">Painel do anúncio</Link></div></nav>
    <section className="hero">
      <div className="eyebrow">RECEBIMENTOS · {profile.display_name ?? "Anunciante"}</div>
      <h1>Saldo e recebimentos</h1>
      <p>Vendas de conteúdo exclusivo são liquidadas no mesmo ciclo financeiro do Pecatho. Serviços presenciais continuam sendo tratados diretamente entre cliente e anunciante.</p>
      <div className="fansMetrics" style={{ marginTop: 20 }}>
        <article className="card"><span className="metricLabel">CRÉDITOS</span><strong>{money(credits)}</strong><p>Créditos registrados no seu ledger.</p></article>
        <article className="card"><span className="metricLabel">DÉBITOS</span><strong>{money(debits)}</strong><p>Taxas, estornos e demais débitos.</p></article>
        <article className="card"><span className="metricLabel">EM PROCESSAMENTO</span><strong>{money(outstanding)}</strong><p>Solicitações ainda abertas.</p></article>
        <article className="card"><span className="metricLabel">SALDO DISPONÍVEL</span><strong>{money(available)}</strong><p>Valor disponível para nova solicitação.</p></article>
      </div>

      <AdvertiserPayoutForm available={available} />

      <section className="card" style={{ marginTop: 20, overflowX: "auto" }}>
        <div style={{ minWidth: 850 }}>
          <div className="eyebrow">HISTÓRICO</div><h2>Solicitações de recebimento</h2>
          {payouts.length === 0 ? <p>Nenhuma solicitação registrada ainda.</p> : <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
            <thead><tr><th align="left">Solicitado</th><th align="right">Valor</th><th align="left">Status</th><th align="left">Processado</th><th align="left">Motivo</th></tr></thead>
            <tbody>{payouts.map(p => <tr key={p.id} style={{ borderTop: "1px solid #e5e7eb" }}><td>{date(p.requested_at)}</td><td align="right">{money(Number(p.amount))}</td><td>{statusLabel(p.status)}</td><td>{date(p.processed_at)}</td><td>{p.rejection_reason || "—"}</td></tr>)}</tbody>
          </table>}
        </div>
      </section>
    </section>
  </main>;
}
