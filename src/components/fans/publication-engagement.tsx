"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props { postId: string; creatorName: string; }
type Comment = { id: string; body: string; created_at: string };
type ReactionSummary = { emoji: string; reaction_count: number; viewer_reacted: boolean };

const REACTION_OPTIONS = ["❤️", "😍", "🔥", "👏", "😂", "😮", "💯", "😘"] as const;

export default function PublicationEngagement({ postId, creatorName }: Props) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<ReactionSummary[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const [{ data: likeSummary }, { data: commentRows }, { data: reactionRows }, { data: auth }] = await Promise.all([
      supabase.rpc("get_public_fans_like_summary", { p_post_id: postId }),
      supabase.rpc("get_public_fans_comments", { p_post_id: postId }),
      supabase.rpc("get_public_fans_post_reaction_summary", { p_post_id: postId }),
      supabase.auth.getUser(),
    ]);
    const currentUserId = auth.user?.id ?? null;
    setUserId(currentUserId);
    const likeSummaryRow = Array.isArray(likeSummary) ? likeSummary[0] : null;
    setLikes(Number(likeSummaryRow?.likes_count ?? 0));
    setLiked(currentUserId ? Boolean(likeSummaryRow?.viewer_liked) : false);
    setComments((commentRows ?? []) as Comment[]);
    setReactions((reactionRows ?? []) as ReactionSummary[]);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [{ data: likeSummary }, { data: commentRows }, { data: reactionRows }, { data: auth }] = await Promise.all([
          supabase.rpc("get_public_fans_like_summary", { p_post_id: postId }),
          supabase.rpc("get_public_fans_comments", { p_post_id: postId }),
          supabase.rpc("get_public_fans_post_reaction_summary", { p_post_id: postId }),
          supabase.auth.getUser(),
        ]);
        if (!active) return;
        const currentUserId = auth.user?.id ?? null;
        const likeSummaryRow = Array.isArray(likeSummary) ? likeSummary[0] : null;
        setUserId(currentUserId);
        setLikes(Number(likeSummaryRow?.likes_count ?? 0));
        setLiked(currentUserId ? Boolean(likeSummaryRow?.viewer_liked) : false);
        setComments((commentRows ?? []) as Comment[]);
        setReactions((reactionRows ?? []) as ReactionSummary[]);
      } catch {
        if (active) setMessage("Não foi possível carregar as interações.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [postId]);

  async function toggleLike() {
    setMessage("");
    if (!userId) { window.location.assign(`/login?next=/fans/publicacoes/${postId}`); return; }
    if (busy) return;
    setBusy(true);
    if (liked) {
      const { error } = await supabase.from("fans_likes").delete().eq("post_id", postId).eq("user_id", userId);
      if (error) setMessage("Não foi possível remover a curtida.");
      else { setLiked(false); setLikes(value => Math.max(0, value - 1)); }
    } else {
      const { error } = await supabase.from("fans_likes").insert({ post_id: postId, user_id: userId });
      if (error) setMessage(error.code === "23505" ? "Esta publicação já está curtida." : "Não foi possível registrar a curtida.");
      else { setLiked(true); setLikes(value => value + 1); }
    }
    setBusy(false);
  }

  async function toggleReaction(emoji: string) {
    setMessage("");
    if (!userId) { window.location.assign(`/login?next=/fans/publicacoes/${postId}`); return; }
    if (reacting) return;
    setReacting(true);
    const current = reactions.find(item => item.viewer_reacted);
    const nextEmoji = current?.emoji === emoji ? null : emoji;
    const { error } = await supabase.rpc("set_fans_post_reaction", { p_post_id: postId, p_emoji: nextEmoji });
    if (error) {
      if (error.message.includes("publication_access_required")) setMessage("É necessário ter acesso a esta publicação para reagir.");
      else if (error.message.includes("creator_cannot_react_to_own_post")) setMessage("Você não pode reagir à sua própria publicação.");
      else setMessage("Não foi possível registrar a reação. Atualize a página e tente novamente.");
    } else {
      const { data, error: summaryError } = await supabase.rpc("get_public_fans_post_reaction_summary", { p_post_id: postId });
      if (summaryError) setMessage("Sua reação foi registrada, mas não foi possível atualizar os totais.");
      else setReactions((data ?? []) as ReactionSummary[]);
    }
    setReacting(false);
  }

  async function addComment() {
    setMessage("");
    if (!userId) { window.location.assign(`/login?next=/fans/publicacoes/${postId}`); return; }
    const body = commentText.trim();
    if (!body) { setMessage("Escreva um comentário antes de publicar."); return; }
    if (body.length > 1000) { setMessage("O comentário deve ter no máximo 1.000 caracteres."); return; }
    if (commenting) return;
    setCommenting(true);
    const { data, error } = await supabase.from("fans_comments").insert({ post_id: postId, user_id: userId, body }).select("id,body,created_at").single();
    if (error) setMessage("Não foi possível publicar o comentário.");
    else { setComments(current => [data as Comment, ...current]); setCommentText(""); }
    setCommenting(false);
  }

  if (loading) return <section className="border-t p-6 sm:p-8"><p className="text-sm text-slate-500">Carregando interações…</p></section>;

  const currentReaction = reactions.find(item => item.viewer_reacted)?.emoji ?? null;

  return <section className="border-t p-6 sm:p-8">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={toggleLike} disabled={busy} aria-pressed={liked} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${liked ? "bg-slate-900 text-white" : "bg-white text-slate-900 hover:bg-slate-50"}`}>{liked ? "♥ Curtida" : "♡ Curtir"} <span className="ml-1 opacity-75">{likes}</span></button>
      <span className="text-sm text-slate-500">{comments.length} comentário{comments.length === 1 ? "" : "s"}</span>
    </div>

    <div className="mt-6 rounded-2xl border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-sm font-bold text-slate-950">Reaja à publicação</h2><p className="mt-1 text-xs text-slate-500">Uma reação por pessoa. Você pode alterá-la ou removê-la.</p></div>
        {currentReaction && <span className="text-xs font-semibold text-slate-600">Sua reação: {currentReaction}</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {REACTION_OPTIONS.map(emoji => {
          const summary = reactions.find(item => item.emoji === emoji);
          const selected = currentReaction === emoji;
          return <button key={emoji} type="button" onClick={() => toggleReaction(emoji)} disabled={reacting} aria-pressed={selected} aria-label={`Reagir com ${emoji}`} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition disabled:opacity-50 ${selected ? "border-amber-400 bg-amber-50 ring-2 ring-amber-100" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"}`}><span className="text-lg">{emoji}</span><span className="text-xs font-semibold text-slate-600">{summary?.reaction_count ?? 0}</span></button>;
        })}
      </div>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div><h2 className="text-lg font-bold text-slate-950">Comentários</h2>{comments.length === 0 ? <p className="mt-3 text-sm text-slate-500">Ainda não há comentários. Seja o primeiro a participar da conversa.</p> : <div className="mt-4 space-y-3">{comments.map(comment => <article key={comment.id} className="rounded-xl border bg-slate-50 p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body}</p><p className="mt-2 text-xs text-slate-400">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(comment.created_at))}</p></article>)}</div>}</div>
      <div className="rounded-2xl border bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-950">Participe</p><p className="mt-1 text-xs leading-5 text-slate-500">Comente de forma respeitosa e mantenha a conversa relacionada ao conteúdo de {creatorName}.</p><textarea value={commentText} onChange={event => setCommentText(event.target.value)} maxLength={1000} rows={5} placeholder={userId ? "Escreva seu comentário…" : "Entre para comentar…"} className="mt-4 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300" /><div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-slate-400">{commentText.length}/1.000</span><button type="button" onClick={addComment} disabled={commenting} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{commenting ? "Publicando…" : userId ? "Publicar comentário" : "Entrar para comentar"}</button></div></div>
    </div>
    {message && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
  </section>;
}
