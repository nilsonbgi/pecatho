"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function NewFansPlanPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function save() {
    setBusy(true); setError(""); setSuccess("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
      const { data: creator } = await supabase.from("fans_creators").select("id").eq("user_id", user.id).maybeSingle();
      if (!creator) throw new Error("Seu espaço Fans ainda não foi criado.");
      const numericPrice = Number(price.replace(".", "").replace(",", "."));
      const numericDuration = Number(duration);
      if (!name.trim() || name.trim().length < 3) throw new Error("Informe um nome de plano com pelo menos 3 caracteres.");
      if (!Number.isFinite(numericPrice) || numericPrice < 0) throw new Error("Informe um preço válido.");
      if (!Number.isInteger(numericDuration) || numericDuration <= 0) throw new Error("Informe uma duração válida em dias.");
      const { error: insertError } = await supabase.from("fans_plans").insert({ creator_id: creator.id, name: name.trim(), description: description.trim() || null, price: numericPrice, currency: "BRL", duration_days: numericDuration, status: "draft" });
      if (insertError) throw new Error(insertError.message);
      setSuccess("Plano criado como rascunho. Você poderá revisá-lo antes de ativar.");
      setName(""); setDescription(""); setPrice(""); setDuration("30");
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível criar o plano."); }
    finally { setBusy(false); }
  }

  return <main className="shell fansShell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div><div className="navLinks"><Link href="/fans/gerenciar/planos">Planos</Link><Link href="/fans/gerenciar">Central</Link></div></nav><section className="hero fansHero"><div className="eyebrow">NOVO PLANO</div><h1>Crie uma <em>assinatura.</em></h1><p className="heroCopy">Comece sempre em rascunho. A ativação de um plano não cria cobrança e não movimenta saldo.</p><section className="authCard"><label>Nome do plano<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Acesso Premium" maxLength={120} /></label><label>Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explique o que o assinante recebe." rows={5} maxLength={2000} /></label><div className="formGrid"><label>Preço mensal (R$)<input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0,00" /></label><label>Duração (dias)<input value={duration} onChange={(e) => setDuration(e.target.value)} inputMode="numeric" type="number" min={1} max={3650} /></label></div>{error && <p className="formError" role="alert">{error}</p>}{success && <p className="formSuccess" role="status">{success}</p>}<button className="primaryButton" type="button" onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar como rascunho"}</button><Link className="secondaryButton" href="/fans/gerenciar/planos">Cancelar</Link></section></section></main>;
}
