"use client";

import { useEffect, useState } from "react";

type Props = {
  sourceType: "digital_content" | "profile_media" | "service_experience";
  sourceId: string;
  customerName?: string | null;
};

type Review = {
  id: string;
  customer_user_id: string;
  rating: number;
  comment: string | null;
};

export default function CustomerReview({ sourceType, sourceId, customerName }: Props) {
  const [existing, setExisting] = useState<Review | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const query = "/api/clientes/reputacao/review?source_type=" + encodeURIComponent(sourceType) + "&source_id=" + encodeURIComponent(sourceId);
    fetch(query, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Não foi possível carregar a avaliação.");
        if (!cancelled) setExisting(body.review ?? null);
      })
      .catch((failure) => {
        if (!cancelled) setError(failure instanceof Error ? failure.message : "Não foi possível carregar a avaliação.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [sourceType, sourceId]);

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/clientes/reputacao/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_type: sourceType, source_id: sourceId, rating, comment }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível registrar a avaliação.");
      setExisting(body.review);
      setOpen(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível registrar a avaliação.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  if (existing) {
    return (
      <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-2">
        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">Cliente avaliado</div>
        <div className="mt-1 text-sm font-black tracking-wide text-amber-300">
          {"★".repeat(existing.rating)}{"☆".repeat(5 - existing.rating)}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-300/[0.1]">
        ★ Avaliar cliente{customerName ? " · " + customerName : ""}
      </button>
      {open ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">Avaliação verificada{customerName ? " · " + customerName : ""}</div>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" aria-label={value + " estrela" + (value === 1 ? "" : "s")} onClick={() => setRating(value)} className={"text-2xl leading-none transition " + (value <= rating ? "text-amber-300" : "text-white/20 hover:text-white/40")}>★</button>
            ))}
          </div>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} rows={3} placeholder="Comentário opcional sobre sua experiência com este cliente." className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-emerald-400/40" />
          {error ? <div className="mt-2 text-xs font-semibold text-red-300">{error}</div> : null}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-xs font-bold text-white/45 hover:text-white/70">Cancelar</button>
            <button type="button" disabled={saving} onClick={() => void submit()} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60">{saving ? "Registrando…" : "Publicar avaliação"}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
