"use client";

import { useState } from "react";

export default function PayoutRequestForm({ creatorId, available }: { creatorId: string; available: number }) {
  const [amount, setAmount] = useState(available.toFixed(2));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value < 20) return setMessage("O valor mínimo para recebimento é R$ 20,00.");
    if (value > available) return setMessage("O valor informado é maior que o saldo disponível.");
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/fans/payout/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creator_id: creatorId, amount: Math.round(value * 100) / 100, idempotency_key: crypto.randomUUID() }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Não foi possível registrar a solicitação.");
      setMessage("Solicitação registrada. Ela ficará em análise antes do processamento.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível registrar a solicitação.");
    } finally { setBusy(false); }
  }

  return <div className="card" style={{ marginTop: 20 }}><div className="eyebrow">NOVO RECEBIMENTO</div><h2>Solicitar recebimento</h2><p>Saldo disponível para nova solicitação: <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(available)}</strong>.</p><div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap", marginTop: 16 }}><label style={{ display: "grid", gap: 6 }}><span>Valor (R$)</span><input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" min="20" step="0.01" disabled={busy || available < 20} style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, width: 180 }} /></label><button type="button" onClick={submit} disabled={busy || available < 20} style={{ padding: "10px 16px", border: 0, borderRadius: 8, cursor: busy || available < 20 ? "not-allowed" : "pointer" }}>{busy ? "Enviando…" : "Solicitar recebimento"}</button></div>{available < 20 && <p style={{ marginTop: 12 }}>O saldo ainda não atingiu o mínimo operacional de R$ 20,00.</p>}{message && <p role="status" style={{ marginTop: 12 }}>{message}</p>}</div>;
}
