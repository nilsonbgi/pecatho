"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NewFansPublicationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [accessType, setAccessType] = useState<"free" | "paid" | "subscriber">("free");
  const [price, setPrice] = useState("0");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function createDraft(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (title.trim().length < 3) return setMessage("Informe um título com pelo menos 3 caracteres.");
    const numericPrice = Number(price.replace(",", "."));
    if (!Number.isFinite(numericPrice) || numericPrice < 0) return setMessage("Informe um preço válido.");
    if (accessType === "paid" && numericPrice <= 0) return setMessage("Uma publicação paga precisa ter preço maior que zero.");

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: creator } = await supabase.from("fans_creators").select("id").eq("user_id", user.id).maybeSingle();
    if (!creator) { router.push("/fans/ativar"); return; }

    const { data, error } = await supabase.from("fans_posts").insert({
      creator_id: creator.id,
      title: title.trim(),
      body: body.trim() || null,
      price: accessType === "free" ? 0 : numericPrice,
      currency: "BRL",
      access_type: accessType,
      status: "draft",
    }).select("id").single();

    setSaving(false);
    if (error) { setMessage(error.message); return; }
    router.push(`/fans/gerenciar/publicacoes/${data.id}`);
  }

  return (
    <main className="shell fansShell">
      <nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div><div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href="/fans/gerenciar/publicacoes">Publicações</Link></div></nav>
      <section className="hero fansHero">
        <div className="eyebrow">CONTEÚDO • NOVA PUBLICAÇÃO</div>
        <h1>Crie um <em>rascunho.</em></h1>
        <p className="heroCopy">Primeiro estruturamos o conteúdo. Depois você poderá associar as mídias e enviar a publicação para análise. O criador não pode publicar diretamente.</p>
        {message && <div className="card" style={{ marginBottom: 18 }}><p>{message}</p></div>}
        <form onSubmit={createDraft} className="fansOnboarding card" style={{ display: "grid", gap: 18 }}>
          <label><span className="serviceLabel">TÍTULO</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={180} required className="mt-2 w-full rounded-lg border px-3 py-2" placeholder="Título da publicação" /></label>
          <label><span className="serviceLabel">DESCRIÇÃO / CONTEÚDO</span><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="mt-2 w-full rounded-lg border px-3 py-2" placeholder="Descreva o conteúdo…" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="serviceLabel">TIPO DE ACESSO</span><select value={accessType} onChange={(e) => setAccessType(e.target.value as typeof accessType)} className="mt-2 w-full rounded-lg border px-3 py-2"><option value="free">Gratuito</option><option value="paid">Venda avulsa</option><option value="subscriber">Exclusivo para assinantes</option></select></label>
            <label><span className="serviceLabel">PREÇO (R$)</span><input value={price} onChange={(e) => setPrice(e.target.value)} disabled={accessType === "free"} inputMode="decimal" className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100" /></label>
          </div>
          <div className="heroActions"><button type="submit" disabled={saving} className="primaryButton">{saving ? "Criando…" : "Criar rascunho"}</button><Link className="secondaryButton" href="/fans/gerenciar/publicacoes">Cancelar</Link></div>
        </form>
      </section>
    </main>
  );
}
