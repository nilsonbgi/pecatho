"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Summary = { credits: number; fees: number; reversals: number; requested: number; available: number };
type Payout = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  status_label: string;
  requested_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
};

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroPage() {
  const [summary, setSummary] = useState<Summary>({ credits: 0, fees: 0, reversals: 0, requested: 0, available: 0 });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/painel/financeiro", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar o financeiro.");
      setSummary(payload.summary);
      setPayouts(payload.payouts || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar o financeiro.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function requestPayout(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const numericAmount = Number(amount.replace(/\./g, "").replace(",", "."));
    try {
      const response = await fetch("/api/painel/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount, idempotency_key: crypto.randomUUID() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível solicitar o recebimento.");
      setAmount("");
      setMessage("Solicitação de recebimento registrada. Ela seguirá para análise financeira.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível solicitar o recebimento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell advertiserDashboard">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div>
        <div className="navLinks"><Link href="/painel">Painel</Link><Link href="/painel/anuncio">Meu anúncio</Link><Link href="/painel/conteudos">Conteúdo</Link></div>
      </nav>
      <section className="hero">
        <div className="eyebrow">PECATHO · FINANCEIRO</div>
        <h1>Saldo e recebimentos</h1>
        <p className="heroCopy">O resultado das vendas digitais do anúncio fica separado dos pagamentos presenciais. O saldo elegível para recebimento considera créditos, taxas, reversões e solicitações ainda em aberto.</p>

        {error && <p className="formError">{error}</p>}
        {message && <p className="formSuccess">{message}</p>}

        <section className="pillars">
          <article className="card"><div className="cardIcon">R$</div><h2>Disponível</h2><p className="financeBig">{loading ? "..." : money(summary.available)}</p><p>Valor atualmente disponível para solicitar.</p></article>
          <article className="card"><div className="cardIcon">+</div><h2>Créditos</h2><p className="financeBig">{loading ? "..." : money(summary.credits)}</p><p>Vendas e demais créditos contabilizados.</p></article>
          <article className="card"><div className="cardIcon">−</div><h2>Reservado</h2><p className="financeBig">{loading ? "..." : money(summary.requested)}</p><p>Solicitações aguardando conclusão.</p></article>
          <article className="card"><div className="cardIcon">↩</div><h2>Reversões</h2><p className="financeBig">{loading ? "..." : money(summary.reversals)}</p><p>Estornos e chargebacks contabilizados.</p></article>
        </section>

        <section className="card financeRequestCard">
          <div className="eyebrow">RECEBIMENTO</div>
          <h2>Solicitar recebimento</h2>
          <p>O valor mínimo é de R$ 20,00. A solicitação não é paga automaticamente: ela passa pelo fluxo de análise e processamento do Pecatho.</p>
          <form onSubmit={requestPayout} className="financeRequestForm">
            <label>Valor do recebimento
              <input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9,.]/g, ""))} inputMode="decimal" placeholder="0,00" />
            </label>
            <button className="primaryButton" disabled={busy || loading || summary.available < 20}>{busy ? "Solicitando..." : "Solicitar recebimento"}</button>
          </form>
        </section>

        <section className="card">
          <div className="eyebrow">HISTÓRICO</div>
          <h2>Solicitações de recebimento</h2>
          {loading ? <p>Carregando histórico...</p> : payouts.length === 0 ? <p className="fieldNote">Nenhuma solicitação de recebimento foi registrada para esta conta.</p> : (
            <div className="financeHistory">
              {payouts.map((payout) => (
                <article key={payout.id}>
                  <div><strong>{money(Number(payout.amount))}</strong><small>{new Date(payout.requested_at).toLocaleString("pt-BR")}</small></div>
                  <span className={"financeStatus financeStatus-" + payout.status}>{payout.status_label}</span>
                  {payout.rejection_reason && <p>{payout.rejection_reason}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
