"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props { postId: string; creatorName: string; }
type Comment = { id: string; body: string; created_at: string; user_id: string };

export default function PublicationEngagement({ postId, creatorName }: Props) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const [{ count }, { data: commentRows }, { data: auth }] = await Promise.all([
      supabase.from("fans_likes").select("post_id", { count: "exact", head: true }).eq("post_id", postId),
      supabase.from("fans_comments").select("id,body,created_at,user_id").eq("post_id", postId).eq("status", "visible").order("created_at", { ascending: false }).limit(20),
      supabase.auth.getUser(),
    ]);
    const currentUserId = auth.user?.id ?? null;
    setUserId(currentUserId);
    setLikes(count ?? 0);
    setComments((commentRows ?? []) as Comment[]);
    if (currentUserId) {
      const { data: ownLike } = await supabase.from("fans_likes").select("post_id").eq("post_id", postId).eq("user_id", currentUserId).maybeSingle();
      setLiked(!!ownLike);
    } else setLiked(false);
    setLoading(false);
  }

  useEffect(() => { let active = true; load().then(() => { if (!active) return; }).catch(() => { if (active) setMessage("Não foi possível carregar as interações."); setLoading(false); }); return () => { active = false; }; }, [postId]);

  async function toggleLike() {
    setMessage("");
    if (!userId) { window.location.assign(`/login?next=/fans/publicacoes/${postId}`); return; }
    if (busy) return;
    setBusy(true);
    if (liked) {
      const { error } = await supabase.from("fans_likes").delete().eq("post_id", postId).eq("user_id", userId);
      if (error) setMessage("Não foi possível remover a curtida."); else { setLiked(false); setLikes(value => Math.max(0, value - 1)); }
    } else {
      const { error } = await supabase.from("fans_likes").insert({ post_id: postId, user_id: userId });
      if (error) setMessage(error.code === "23505" ? "Esta publicação já está curtida." : "Não foi possível registrar a curtida."); else { setLiked(true); setLikes(value => value + 1); }
    }
    setBusy(false);
  }

  async function addComment() {
    setMessage("");
    if (!userId) { window.location.assign(`/login?next=/fans/publicacoes/${postId}`); return; }
    const body = commentText.trim();
    if (!body) { setMessage("Escreva um comentário antes de publicar."); return; }
    if (body.length > 1000) { setMessage("O comentário deve ter no máximo 1.000 caracteres."); return; }
    if (commenting) return;
    setCommenting(true);
    const { data, error } = await supabase.from("fans_comments").insert({ post_id: postId, user_id: userId, body }).select("id,body,created_at,user_id").single();
    if (error) setMessage("Não foi possível publicar o comentário.");
    else { setComments(current => [data as Comment, ...current]); setCommentText(""); }
    setCommenting(false);
  }

  if (loading) return <section className="border-t p-6 sm:p-8"><p className="text-sm text-slate-500">Carregando interações…</p></section>;

  return <section className="border-t p-6 sm:p-8">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={toggleLike} disabled={busy} aria-pressed={liked} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${liked ? "bg-slate-900 text-white" : "bg-white text-slate-900 hover:bg-slate-50"}`}>{liked ? "♥ Curtida" : "♡ Curtir"} <span className="ml-1 opacity-75">{likes}</span></button>
      <span className="text-sm text-slate-500">{comments.length} comentário{comments.length === 1 ? "" : "s"}</span>
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div><h2 className="text-lg font-bold text-slate-950">Comentários</h2>{comments.length === 0 ? <p className="mt-3 text-sm text-slate-500">Ainda não há comentários. Seja o primeiro a participar da conversa.</p> : <div className="mt-4 space-y-3">{comments.map(comment => <article key={comment.id} className="rounded-xl border bg-slate-50 p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body}</p><p className="mt-2 text-xs text-slate-400">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(comment.created_at))}</p></article>)}</div>}</div>
      <div className="rounded-2xl border bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-950">Participe</p><p className="mt-1 text-xs leading-5 text-slate-500">Comente de forma respeitosa e mantenha a conversa relacionada ao conteúdo de {creatorName}.</p><textarea value={commentText} onChange={event => setCommentText(event.target.value)} maxLength={1000} rows={5} placeholder={userId ? "Escreva seu comentário…" : "Entre para comentar…"} className="mt-4 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300" /><div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-slate-400">{commentText.length}/1.000</span><button type="button" onClick={addComment} disabled={commenting} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{commenting ? "Publicando…" : userId ? "Publicar comentário" : "Entrar para comentar"}</button></div></div>
    </div>
    {message && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
  </section>;
}
