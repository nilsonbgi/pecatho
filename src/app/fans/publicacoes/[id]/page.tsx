"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Media = { id: string; media_type: "image" | "video"; mime_type: string | null; url: string; is_preview: boolean; sort_order: number };
type Payload = {
  post: { id: string; title: string; body: string | null; price: number; currency: string; access_type: "free" | "paid" | "subscriber"; published_at: string | null };
  creator: { id: string; slug: string; display_name: string; bio: string | null; avatar_url: string | null };
  access: { entitled: boolean; requires_login: boolean; requires_purchase: boolean; requires_subscription: boolean };
  media: Media[];
};

export default function PublicFansPublicationPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/fans/publicacoes/${params.id}/acesso`, { cache: "no-store" })
      .then(async response => { const json = await response.json(); if (!response.ok) throw new Error(json.error || "Publicação não encontrada."); return json as Payload; })
      .then(value => { if (alive) setData(value); })
      .catch(err => { if (alive) setError(err instanceof Error ? err.message : "Não foi possível carregar a publicação."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [params.id]);

  if (loading) return <main className="mx-auto max-w-4xl p-6"><p className="text-sm text-slate-500">Carregando publicação…</p></main>;
  if (error || !data) return <main className="mx-auto max-w-4xl p-6"><div className="rounded-2xl border bg-white p-8 text-center"><p className="text-sm text-red-600">{error || "Publicação não encontrada."}</p><Link href="/fans" className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Voltar ao Fans</Link></div></main>;

  const { post, creator, access, media } = data;
  const locked = !access.entitled;
  const price = Number(post.price || 0).toFixed(2).replace(".", ",");

  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-slate-50 px-4 py-8 sm:px-6">
      <nav className="mb-8 flex items-center justify-between gap-3"><Link href={`/fans/${creator.slug}`} className="font-semibold text-slate-900">← {creator.display_name}</Link><Link href="/fans" className="rounded-lg border bg-white px-3 py-2 text-sm">Pecatho Fans</Link></nav>
      <article className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <header className="border-b p-6 sm:p-8"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-semibold text-slate-500">{creator.avatar_url ? <img src={creator.avatar_url} alt={creator.display_name} className="h-full w-full object-cover" /> : creator.display_name.slice(0, 1).toUpperCase()}</div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{creator.display_name}</p><h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{post.title}</h1></div></div></header>
        {media.length > 0 && <section className="grid gap-3 bg-slate-100 p-3 sm:grid-cols-2">{media.map(item => <div key={item.id} className="relative overflow-hidden rounded-2xl bg-black"><div className="aspect-[4/3]">{item.media_type === "video" ? <video src={item.url} controls playsInline className="h-full w-full object-contain" /> : <img src={item.url} alt={item.is_preview && locked ? "Preview" : post.title} className={`h-full w-full object-cover ${locked && item.is_preview ? "" : ""}`} />}</div>{locked && item.is_preview && <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">Preview</span>}</div>)}</section>}
        <section className="p-6 sm:p-8">
          {access.entitled ? <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{post.body || "Conteúdo publicado no Pecatho Fans."}</p> : <div className="rounded-2xl border bg-slate-50 p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Conteúdo protegido</p><h2 className="mt-2 text-xl font-bold text-slate-950">{access.requires_purchase ? `Desbloqueie por R$ ${price}` : "Conteúdo exclusivo para assinantes"}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{access.requires_purchase ? "Esta publicação é vendida separadamente. O desbloqueio será disponibilizado pelo checkout seguro do Pecatho." : "Esta publicação está disponível para assinantes do criador."}</p><div className="mt-5 flex flex-wrap gap-3">{access.requires_login && <Link href="/login" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Entrar para continuar</Link>}{access.requires_purchase && !access.requires_login && <button disabled className="rounded-xl bg-slate-300 px-5 py-3 text-sm font-semibold text-slate-600">Compra segura em preparação</button>}{access.requires_subscription && !access.requires_login && <Link href={`/fans/${creator.slug}`} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Ver assinatura</Link>}</div></div>}
        </section>
      </article>
    </main>
  );
}
