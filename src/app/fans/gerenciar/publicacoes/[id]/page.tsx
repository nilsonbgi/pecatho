"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Post = {
  id: string;
  creator_id: string;
  title: string;
  body: string | null;
  price: number;
  access_type: "free" | "paid" | "subscriber";
  status: string;
};

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  pending_review: "Em análise",
  published: "Publicado",
  rejected: "Rejeitado",
  archived: "Arquivado",
};

export default function FansPublicationEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [accessType, setAccessType] = useState<Post["access_type"]>("free");
  const [price, setPrice] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: creator } = await supabase.from("fans_creators").select("id").eq("user_id", user.id).maybeSingle();
      if (!creator) { router.push("/fans/ativar"); return; }
      const { data, error } = await supabase.from("fans_posts").select("id,creator_id,title,body,price,access_type,status").eq("id", params.id).eq("creator_id", creator.id).maybeSingle();
      if (!active) return;
      if (error || !data) { setMessage("Publicação não encontrada ou sem acesso."); setLoading(false); return; }
      setPost(data as Post); setTitle(data.title); setBody(data.body ?? ""); setAccessType(data.access_type); setPrice(String(data.price ?? 0)); setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [params.id]);

  async function save() {
    if (!post) return;
    setMessage("");
    if (title.trim().length < 3) { setMessage("Informe um título com pelo menos 3 caracteres."); return; }
    const numericPrice = Number(price.replace(",", "."));
    if (!Number.isFinite(numericPrice) || numericPrice < 0) { setMessage("Informe um preço válido."); return; }
    if (accessType === "paid" && numericPrice <= 0) { setMessage("Uma publicação paga precisa ter preço maior que zero."); return; }
    setSaving(true);
    const { error } = await supabase.from("fans_posts").update({ title: title.trim(), body: body.trim() || null, access_type: accessType, price: accessType === "free" ? 0 : numericPrice }).eq("id", post.id).eq("creator_id", post.creator_id);
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    setMessage("Rascunho salvo com sucesso.");
    router.refresh();
  }

  async function archive() {
    if (!post || !["draft", "rejected"].includes(post.status)) return;
    setSaving(true);
    const { error } = await supabase.from("fans_posts").update({ status: "archived" }).eq("id", post.id).eq("creator_id", post.creator_id);
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    router.push("/fans/gerenciar/publicacoes"); router.refresh();
  }

  if (loading) return <main className="mx-auto max-w-3xl p-6"><p className="text-sm text-slate-500">Carregando publicação…</p></main>;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header><p className="text-sm text-slate-500">Pecatho Fans · Criador</p><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">Gerenciar publicação</h1>{post && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{statusLabel[post.status] ?? post.status}</span>}</div><p className="mt-1 text-sm text-slate-600">Edite o conteúdo permitido pelo estado atual. A publicação definitiva continua sob moderação.</p></header>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{message}</div>}
      {post && <section className="space-y-5 rounded-xl border bg-white p-6">
        <label className="block"><span className="text-sm font-medium">Título</span><input value={title} onChange={e=>setTitle(e.target.value)} disabled={post.status === "pending_review" || post.status === "published"} maxLength={180} className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100" /></label>
        <label className="block"><span className="text-sm font-medium">Descrição</span><textarea value={body} onChange={e=>setBody(e.target.value)} disabled={post.status === "pending_review" || post.status === "published"} rows={8} className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100" /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="text-sm font-medium">Acesso</span><select value={accessType} onChange={e=>setAccessType(e.target.value as Post["access_type"])} disabled={post.status === "pending_review" || post.status === "published"} className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"><option value="free">Gratuito</option><option value="paid">Venda avulsa</option><option value="subscriber">Assinantes</option></select></label><label className="block"><span className="text-sm font-medium">Preço (R$)</span><input value={price} onChange={e=>setPrice(e.target.value)} disabled={post.status === "pending_review" || post.status === "published" || accessType === "free"} inputMode="decimal" className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100" /></label></div>
        <div className="flex flex-wrap gap-3"><button onClick={save} disabled={saving || ["pending_review", "published", "archived"].includes(post.status)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Salvando…" : "Salvar"}</button>{["draft", "rejected"].includes(post.status) && <button onClick={archive} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-medium">Arquivar</button>}<button onClick={()=>router.push("/fans/gerenciar/publicacoes")} className="rounded-lg border px-4 py-2 text-sm font-medium">Voltar</button></div>
      </section>}
    </main>
  );
}
