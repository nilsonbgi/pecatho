"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Offer = {
  id: string; title: string; description: string | null;
  duration_minutes: number; price: number; currency: string;
  status: "active" | "inactive";
};

const durations = [10, 15, 20, 30, 45, 60];

export default function LiveOffersPage() {
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(15);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login?redirect=/fans/gerenciar/videochamadas";
      return;
    }
    const { data: creator, error: creatorError } = await supabase
      .from("fans_creators").select("id").eq("user_id", user.id).maybeSingle();
    if (creatorError || !creator) {
      setError("Espaço Fans não encontrado."); setLoading(false); return;
    }
    setCreatorId(creator.id);
    const { data, error: offerError } = await supabase
      .from("fans_live_offers")
      .select("id,title,description,duration_minutes,price,currency,status")
      .eq("creator_id", creator.id).order("created_at", { ascending: false });
    if (offerError) setError("Não foi possível carregar as ofertas.");
    else setOffers((data ?? []) as Offer[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function createOffer(event: FormEvent) {
    event.preventDefault();
    if (!creatorId || saving) return;
    const amount = Number(price.replace(",", "."));
    if (!title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Informe título e valor válidos."); return;
    }
    setSaving(true); setError("");
    const supabase = createClient();
    const { data, error: insertError } = await supabase.from("fans_live_offers").insert({
      creator_id: creatorId, title: title.trim(),
      description: description.trim() || null, duration_minutes: duration,
      price: amount, currency: "BRL", status: "active"
    }).select("id,title,description,duration_minutes,price,currency,status").single();
    if (insertError) setError("Não foi possível criar a oferta.");
    else {
      setOffers(current => [data as Offer, ...current]);
      setTitle(""); setDescription(""); setDuration(15); setPrice("");
    }
    setSaving(false);
  }

  async function toggle(offer: Offer) {
    const supabase = createClient();
    const next = offer.status === "active" ? "inactive" : "active";
    const { data, error: updateError } = await supabase.from("fans_live_offers")
      .update({ status: next }).eq("id", offer.id)
      .select("id,title,description,duration_minutes,price,currency,status").single();
    if (updateError) { setError("Não foi possível alterar a oferta."); return; }
    setOffers(current => current.map(item => item.id === offer.id ? data as Offer : item));
  }

  const money = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return <main className="shell fansShell">
    <nav className="topbar">
      <Link href="/fans/gerenciar" className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></Link>
      <div className="navLinks"><Link href="/fans">Visão geral</Link><Link href="/painel">Painel Pecatho</Link></div>
    </nav>
    <section className="hero fansHero">
      <div className="eyebrow">INTERAÇÕES PAGAS</div>
      <h1>Videochamadas <em>privadas.</em></h1>
      <p className="heroCopy">Crie ofertas comerciais de videochamada. A chamada somente será liberada após pagamento confirmado pelo provedor.</p>
      <div className="card" style={{ marginTop: 24 }}>
        <h2>Nova oferta</h2>
        <form onSubmit={createOffer} style={{ display: "grid", gap: 14, marginTop: 18 }}>
          <label>Título<input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="Videochamada privada" /></label>
          <label>Descrição<textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} rows={3} placeholder="Explique o que está incluído na chamada." /></label>
          <label>Duração<select value={duration} onChange={e => setDuration(Number(e.target.value))}>{durations.map(item => <option key={item} value={item}>{item} minutos</option>)}</select></label>
          <label>Preço (BRL)<input inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="49,90" /></label>
          <button className="primaryButton" disabled={saving}>{saving ? "Salvando..." : "Publicar oferta"}</button>
        </form>
      </div>
      {error && <p className="fieldNote" style={{ marginTop: 12 }}>{error}</p>}
      <section className="fansMetrics" style={{ marginTop: 24 }}>
        {loading ? <article className="card"><p>Carregando ofertas...</p></article> :
          offers.length === 0 ? <article className="card"><h2>Nenhuma oferta criada.</h2><p>Cadastre sua primeira modalidade de videochamada paga.</p></article> :
          offers.map(offer => <article className="card" key={offer.id}>
            <span className="metricLabel">{offer.status === "active" ? "ATIVA" : "INATIVA"}</span>
            <h2>{offer.title}</h2><strong>{money(Number(offer.price))}</strong>
            <p>{offer.duration_minutes} minutos{offer.description ? " · " + offer.description : ""}</p>
            <button className="secondaryButton" onClick={() => void toggle(offer)}>{offer.status === "active" ? "Desativar" : "Ativar"}</button>
          </article>)}
      </section>
      <p style={{ marginTop: 24 }}><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link href="/fans/gerenciar/videochamadas/sessoes" className="primaryButton">Solicitações recebidas</Link><Link href="/fans/gerenciar" className="secondaryButton">← Voltar ao painel</Link></div></p>
    </section>
  </main>;
}
