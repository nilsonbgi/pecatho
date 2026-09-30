"use client";

import { useState } from "react";

type Props = {
  recipientType: "advertiser" | "creator";
  recipientId: string;
  recipientName: string;
  compact?: boolean;
};

const presets = [20, 50, 100, 200, 500];

export default function GiftButton({ recipientType, recipientId, recipientName, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(50);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function sendGift() {
    if (busy) return;
    setBusy(true);
    setNotice("");

    try {
      const intentResponse = await fetch("/api/gifts/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_type: recipientType,
          recipient_id: recipientId,
          amount,
          message: message.trim() || null,
        }),
      });
      const intent = await intentResponse.json().catch(() => ({}));

      if (intentResponse.status === 401) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }

      if (!intentResponse.ok || !intent?.order_id) {
        throw new Error(intent?.error || "Não foi possível preparar o presente.");
      }

      const providerResponse = await fetch("/api/gifts/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: intent.order_id }),
      });
      const provider = await providerResponse.json().catch(() => ({}));

      if (!providerResponse.ok || !provider.checkout_url) {
        throw new Error(provider?.error || "Não foi possível abrir o pagamento.");
      }

      window.location.href = provider.checkout_url;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível iniciar o presente.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={compact ? "secondaryButton" : "primaryButton"}
        onClick={() => { setOpen(true); setNotice(""); }}
      >
        🎁 Enviar presente
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={"Enviar presente para " + recipientName}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: 18,
            background: "rgba(2,6,23,.68)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: "min(520px,100%)",
              borderRadius: 24,
              border: "1px solid rgba(231,195,63,.28)",
              background: "#0b0b12",
              color: "#fff",
              padding: 24,
              boxShadow: "0 30px 90px rgba(0,0,0,.45)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".16em", color: "#c4b5fd" }}>PECATHO · PRESENTE</div>
                <h2 style={{ margin: "8px 0 0", fontSize: 28, letterSpacing: "-.04em" }}>Para {recipientName}</h2>
                <p style={{ margin: "8px 0 0", color: "#aeb4c2", lineHeight: 1.6, fontSize: 13 }}>
                  O pagamento é feito pelo checkout oficial. O destinatário recebe somente após a confirmação financeira.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" style={{ border: 0, background: "transparent", color: "#94a3b8", fontSize: 22, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
              {presets.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value)}
                  style={{
                    border: amount === value ? "1px solid #e7c33f" : "1px solid rgba(255,255,255,.12)",
                    borderRadius: 12,
                    padding: "11px 6px",
                    background: amount === value ? "rgba(231,195,63,.14)" : "rgba(255,255,255,.04)",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  R$ {value}
                </button>
              ))}
            </div>

            <label style={{ display: "block", marginTop: 14, fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>
              OUTRO VALOR
              <input
                type="number"
                min={10}
                max={10000}
                step={0.01}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                style={{ width: "100%", marginTop: 7, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "#11131b", color: "#fff", padding: "12px 13px", outline: "none" }}
              />
            </label>

            <label style={{ display: "block", marginTop: 14, fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>
              MENSAGEM OPCIONAL
              <textarea
                value={message}
                maxLength={300}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Escreva uma mensagem..."
                rows={3}
                style={{ width: "100%", marginTop: 7, resize: "vertical", borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "#11131b", color: "#fff", padding: "12px 13px", outline: "none" }}
              />
            </label>

            {notice && <p style={{ marginTop: 12, color: "#fca5a5", fontSize: 12 }}>{notice}</p>}

            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" className="secondaryButton" onClick={() => setOpen(false)} disabled={busy}>Cancelar</button>
              <button type="button" className="primaryButton" onClick={() => void sendGift()} disabled={busy || !Number.isFinite(amount) || amount < 10 || amount > 10000}>
                {busy ? "Abrindo pagamento..." : "Continuar para pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
