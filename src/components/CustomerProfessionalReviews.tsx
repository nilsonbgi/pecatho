"use client";

import { useEffect, useState } from "react";

type Experience = {
  id: string;
  service_label: string | null;
  occurred_at: string;
  profile: { id: string; display_name: string | null; title: string | null; slug: string | null } | null;
  review: { id: string; rating: number; comment: string | null; status: string } | null;
};

export default function CustomerProfessionalReviews() {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/clientes/avaliacoes-profissionais", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível carregar suas experiências.");
      setItems(body.experiences ?? []);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível carregar suas experiências.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function submit(experienceId: string) {
    setBusy(experienceId);
    setError("");
    try {
      const response = await fetch("/api/clientes/avaliacoes-profissionais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experience_id: experienceId,
          rating: ratings[experienceId] ?? 5,
          comment: comments[experienceId] ?? "",
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível registrar a avaliação.");
      setOpen(null);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível registrar a avaliação.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <section className="card"><div className="eyebrow">EXPERIÊNCIAS</div><h2>Avaliar experiências</h2><p className="fieldNote">Carregando experiências verificadas...</p></section>;

  return (
    <section className="card">
      <div className="eyebrow">EXPERIÊNCIAS VERIFICADAS</div>
      <h2>Avalie quem você contratou</h2>
      <p className="fieldNote">Somente experiências verificadas pelo Pecatho podem gerar avaliação. Sua identidade não é exibida publicamente como parte do comentário.</p>
      {error && <p className="fieldNote" style={{ color: "#f87171", marginTop: 10 }}>{error}</p>}
      {items.length === 0 ? (
        <p className="fieldNote" style={{ marginTop: 16 }}>Nenhuma experiência verificada disponível para avaliação neste momento.</p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {items.map((item) => {
            const reviewed = Boolean(item.review);
            const rating = ratings[item.id] ?? item.review?.rating ?? 5;
            return (
              <article key={item.id} style={{ border: "1px solid rgba(255,255,255,.09)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.025)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <strong>{item.profile?.display_name || "Acompanhante"}</strong>
                    <p className="fieldNote">{item.service_label || item.profile?.title || "Experiência de serviço"} · {new Date(item.occurred_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  {reviewed ? (
                    <span style={{ border: "1px solid rgba(16,185,129,.25)", background: "rgba(16,185,129,.08)", color: "#6ee7b7", borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 800 }}>
                      {item.review?.status === "approved" ? "✓ Avaliação publicada" : "✓ Avaliação em moderação"}
                    </span>
                  ) : (
                    <button type="button" className="primaryButton" onClick={() => setOpen(open === item.id ? null : item.id)}>★ Avaliar experiência</button>
                  )}
                </div>
                {open === item.id && !reviewed && (
                  <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 14 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1,2,3,4,5].map((value) => (
                        <button key={value} type="button" aria-label={value + " estrela" + (value === 1 ? "" : "s")} onClick={() => setRatings((current) => ({ ...current, [item.id]: value }))} style={{ border: 0, background: "transparent", fontSize: 25, color: value <= rating ? "#E7C33F" : "rgba(255,255,255,.2)", cursor: "pointer" }}>★</button>
                      ))}
                    </div>
                    <textarea value={comments[item.id] ?? ""} onChange={(event) => setComments((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={1000} rows={4} placeholder="Conte como foi sua experiência. O comentário será analisado antes de ser publicado." style={{ width: "100%", marginTop: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", color: "inherit", padding: 12, resize: "vertical" }} />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                      <button type="button" className="secondaryButton" onClick={() => setOpen(null)}>Cancelar</button>
                      <button type="button" className="primaryButton" disabled={busy === item.id} onClick={() => void submit(item.id)}>{busy === item.id ? "Enviando..." : "Enviar avaliação"}</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
