"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Post = {
  id: string; creator_id: string; title: string; body: string | null; price: number;
  access_type: "free" | "paid" | "subscriber"; status: string;
};
type Media = {
  id: string; storage_bucket: string; storage_path: string; media_type: "image" | "video";
  mime_type: string | null; size_bytes: number | null; sort_order: number; is_preview: boolean; url?: string;
};
type Comment = { id: string; body: string; created_at: string; status: string };
const statusLabel: Record<string, string> = { draft: "Rascunho", pending_review: "Em análise", published: "Publicado", rejected: "Rejeitado", archived: "Arquivado" };
const accessLabel: Record<string, string> = { free: "Gratuito", paid: "Venda avulsa", subscriber: "Assinantes" };
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"]);
function formatBytes(value: number | null) { if (!value) return "—"; const units = ["B", "KB", "MB", "GB"]; let size = value, index = 0; while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; } return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }

export default function FansPublicationEditorPage() {
  const params = useParams<{ id: string }>(); const router = useRouter(); const supabase = createClient();
  const [post, setPost] = useState<Post | null>(null); const [media, setMedia] = useState<Media[]>([]);
  const [comments, setComments] = useState<Comment[]>([]); const [likesCount, setLikesCount] = useState(0); const [commentsCount, setCommentsCount] = useState(0); const [unreadActivity, setUnreadActivity] = useState(0);
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [accessType, setAccessType] = useState<Post["access_type"]>("free"); const [price, setPrice] = useState("0");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState(false); const [message, setMessage] = useState("");

  async function loadMedia(postId: string) {
    const { data, error } = await supabase.from("fans_post_media").select("id,storage_bucket,storage_path,media_type,mime_type,size_bytes,sort_order,is_preview").eq("post_id", postId).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) { setMessage(error.message); return; }
    const rows = (data ?? []) as Media[];
    const withUrls = await Promise.all(rows.map(async item => { if (item.storage_bucket !== "pecatho-private") return item; const { data: signed } = await supabase.storage.from("pecatho-private").createSignedUrl(item.storage_path, 300); return { ...item, url: signed?.signedUrl }; }));
    setMedia(withUrls);
  }

  async function loadInteractions(postId: string) {
    const [{ count: likeCount }, { count: commentCount, data: commentRows }, { count: unreadCount }] = await Promise.all([
      supabase.from("fans_likes").select("id", { count: "exact", head: true }).eq("post_id", postId),
      supabase.from("fans_comments").select("id,body,created_at,status", { count: "exact" }).eq("post_id", postId).eq("status", "visible").order("created_at", { ascending: false }).limit(10),
      supabase.from("fans_notifications").select("id", { count: "exact", head: true }).eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "").in("type", ["fans_like", "fans_comment"]).is("read_at", null).contains("data", { post_id: postId }),
    ]);
    setLikesCount(likeCount ?? 0); setCommentsCount(commentCount ?? 0); setComments((commentRows ?? []) as Comment[]); setUnreadActivity(unreadCount ?? 0);
  }

  useEffect(() => { let active = true; async function load() {
    const { data: { user } } = await supabase.auth.getUser(); if (!user) { router.push("/login"); return; }
    const { data: creator } = await supabase.from("fans_creators").select("id").eq("user_id", user.id).maybeSingle(); if (!creator) { router.push("/fans/ativar"); return; }
    const { data, error } = await supabase.from("fans_posts").select("id,creator_id,title,body,price,access_type,status").eq("id", params.id).eq("creator_id", creator.id).maybeSingle();
    if (!active) return; if (error || !data) { setMessage("Publicação não encontrada ou sem acesso."); setLoading(false); return; }
    setPost(data as Post); setTitle(data.title); setBody(data.body ?? ""); setAccessType(data.access_type); setPrice(String(data.price ?? 0)); await Promise.all([loadMedia(data.id), loadInteractions(data.id)]); if (active) setLoading(false);
  } load(); return () => { active = false; }; }, [params.id, router]);

  async function save() {
    if (!post) return; setMessage(""); if (title.trim().length < 3) { setMessage("Informe um título com pelo menos 3 caracteres."); return; }
    const numericPrice = Number(price.replace(",", ".")); if (!Number.isFinite(numericPrice) || numericPrice < 0) { setMessage("Informe um preço válido."); return; }
    if (accessType === "paid" && numericPrice <= 0) { setMessage("Uma publicação paga precisa ter preço maior que zero."); return; }
    setSaving(true); const { error } = await supabase.from("fans_posts").update({ title: title.trim(), body: body.trim() || null, access_type: accessType, price: accessType === "free" ? 0 : numericPrice }).eq("id", post.id).eq("creator_id", post.creator_id); setSaving(false);
    if (error) { setMessage(error.message); return; } setPost({ ...post, title: title.trim(), body: body.trim() || null, access_type: accessType, price: accessType === "free" ? 0 : numericPrice }); setMessage("Alterações salvas com sucesso."); router.refresh();
  }

  async function uploadFiles(event: React.ChangeEvent<HTMLInputElement>) {
    if (!post || !["draft", "rejected"].includes(post.status)) return; const files = Array.from(event.target.files ?? []); event.target.value = ""; if (!files.length) return; setMessage("");
    const invalid = files.find(file => !ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE); if (invalid) { setMessage(`Arquivo inválido: ${invalid.name}. Aceitos: JPG, PNG, WebP, GIF, MP4, WebM e MOV até 50 MB.`); return; }
    setUploading(true); let completed = 0;
    try { for (const file of files) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "bin"; const objectPath = `${post.creator_id}/${post.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("pecatho-private").upload(objectPath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(`Falha no upload de ${file.name}: ${uploadError.message}`);
      const { error: rowError } = await supabase.from("fans_post_media").insert({ post_id: post.id, storage_bucket: "pecatho-private", storage_path: objectPath, media_type: file.type.startsWith("video/") ? "video" : "image", mime_type: file.type, size_bytes: file.size, sort_order: media.length + completed, is_preview: media.length === 0 && completed === 0 });
      if (rowError) { await supabase.storage.from("pecatho-private").remove([objectPath]); throw new Error(`Falha ao registrar ${file.name}: ${rowError.message}`); } completed += 1;
    } await loadMedia(post.id); setMessage(`${completed} mídia(s) adicionada(s) com segurança.`); } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível concluir o upload."); } finally { setUploading(false); }
  }

  async function removeMedia(item: Media) {
    if (!post || !["draft", "rejected"].includes(post.status)) return; setUploading(true); setMessage("");
    const { error: storageError } = await supabase.storage.from(item.storage_bucket).remove([item.storage_path]); if (storageError) { setUploading(false); setMessage(`Não foi possível remover o arquivo: ${storageError.message}`); return; }
    const { error: rowError } = await supabase.from("fans_post_media").delete().eq("id", item.id).eq("post_id", post.id); setUploading(false);
    if (rowError) { setMessage(`Arquivo removido do storage, mas o registro não pôde ser removido: ${rowError.message}`); return; } await loadMedia(post.id); setMessage("Mídia removida.");
  }

  async function setPreview(item: Media) {
    if (!post || !["draft", "rejected"].includes(post.status)) return; setUploading(true); setMessage("");
    const { error: clearError } = await supabase.from("fans_post_media").update({ is_preview: false }).eq("post_id", post.id).eq("is_preview", true);
    if (clearError) { setMessage(clearError.message); } else { const { error } = await supabase.from("fans_post_media").update({ is_preview: true }).eq("id", item.id).eq("post_id", post.id); if (error) setMessage(error.message); }
    await loadMedia(post.id); setUploading(false);
  }

  async function submitForReview() { if (!post) return; setMessage(""); setSaving(true); const response = await fetch("/api/fans/publicacoes/enviar-analise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_id: post.id }) }); const result = await response.json().catch(() => ({})); setSaving(false); if (!response.ok) { setMessage(result.error || "Não foi possível enviar a publicação para análise."); return; } setPost({ ...post, status: "pending_review" }); setMessage("Publicação enviada para análise. A publicação definitiva depende da moderação."); }
  async function archive() { if (!post || !["draft", "rejected"].includes(post.status)) return; setSaving(true); const { error } = await supabase.from("fans_posts").update({ status: "archived" }).eq("id", post.id).eq("creator_id", post.creator_id); setSaving(false); if (error) { setMessage(error.message); return; } router.push("/fans/gerenciar/publicacoes"); router.refresh(); }

  if (loading) return <main className="mx-auto max-w-3xl p-6"><p className="text-sm text-slate-500">Carregando publicação…</p></main>;
  const editable = post ? ["draft", "rejected"].includes(post.status) : false;
  return <main className="mx-auto max-w-4xl space-y-6 p-6">
    <header><p className="text-sm text-slate-500">Pecatho Fans · Criador</p><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">Gerenciar publicação</h1>{post && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{statusLabel[post.status] ?? post.status}</span>}</div><p className="mt-1 text-sm text-slate-600">Conteúdo, mídias e interações ficam vinculados ao mesmo contexto operacional. Conteúdo privado permanece protegido e a publicação definitiva depende de moderação.</p></header>
    {message && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{message}</div>}
    {post && <>
      <section className="grid gap-4 sm:grid-cols-4">
        <article className="rounded-xl border bg-white p-5"><p className="text-xs font-semibold tracking-wide text-slate-500">ACESSO</p><p className="mt-2 text-lg font-semibold">{accessLabel[post.access_type] ?? post.access_type}</p><p className="mt-1 text-sm text-slate-500">{post.access_type === "free" ? "Sem cobrança" : `R$ ${Number(post.price ?? 0).toFixed(2).replace(".", ",")}`}</p></article>
        <article className="rounded-xl border bg-white p-5"><p className="text-xs font-semibold tracking-wide text-slate-500">CURTIDAS</p><p className="mt-2 text-2xl font-semibold">{likesCount}</p><p className="mt-1 text-sm text-slate-500">Interações da publicação</p></article>
        <article className="rounded-xl border bg-white p-5"><p className="text-xs font-semibold tracking-wide text-slate-500">COMENTÁRIOS</p><p className="mt-2 text-2xl font-semibold">{commentsCount}</p><p className="mt-1 text-sm text-slate-500">Comentários visíveis</p></article>
        <article className="rounded-xl border bg-white p-5"><p className="text-xs font-semibold tracking-wide text-slate-500">ATIVIDADE</p><p className="mt-2 text-2xl font-semibold">{unreadActivity}</p><p className="mt-1 text-sm text-slate-500">Interações não lidas</p></article>
      </section>
      <section className="space-y-5 rounded-xl border bg-white p-6"><div><p className="text-xs font-semibold tracking-wide text-slate-500">CONTEÚDO</p><h2 className="mt-1 text-xl font-semibold">Dados da publicação</h2></div><label className="block"><span className="text-sm font-medium">Título</span><input value={title} onChange={e=>setTitle(e.target.value)} disabled={!editable} maxLength={180} className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100" /></label><label className="block"><span className="text-sm font-medium">Descrição</span><textarea value={body} onChange={e=>setBody(e.target.value)} disabled={!editable} rows={8} className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="text-sm font-medium">Acesso</span><select value={accessType} onChange={e=>setAccessType(e.target.value as Post["access_type"])} disabled={!editable} className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"><option value="free">Gratuito</option><option value="paid">Venda avulsa</option><option value="subscriber">Assinantes</option></select></label><label className="block"><span className="text-sm font-medium">Preço (R$)</span><input value={price} onChange={e=>setPrice(e.target.value)} disabled={!editable || accessType === "free"} inputMode="decimal" className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100" /></label></div><div className="flex flex-wrap gap-3"><button onClick={save} disabled={saving || !editable} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Salvando…" : "Salvar"}</button>{editable && <button onClick={submitForReview} disabled={saving} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Enviar para análise</button>}{editable && <button onClick={archive} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-medium">Arquivar</button>}<button onClick={()=>router.push("/fans/gerenciar/publicacoes")} className="rounded-lg border px-4 py-2 text-sm font-medium">Voltar</button><button onClick={()=>router.push("/fans/gerenciar/atividade")} className="rounded-lg border px-4 py-2 text-sm font-medium">Ver atividade</button></div></section>
      <section className="space-y-5 rounded-xl border bg-white p-6"><div><p className="text-xs font-semibold tracking-wide text-slate-500">MÍDIAS DA PUBLICAÇÃO</p><h2 className="mt-1 text-xl font-semibold">Imagens e vídeos</h2><p className="mt-1 text-sm text-slate-600">Até 50 MB por arquivo. Os arquivos são armazenados no bucket privado do Pecatho e o acesso será controlado pelas regras do conteúdo.</p></div>{editable && <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:bg-slate-50"><span className="font-medium">Adicionar imagens ou vídeos</span><span className="mt-1 text-xs text-slate-500">JPG, PNG, WebP, GIF, MP4, WebM ou MOV · até 50 MB</span><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={uploadFiles} disabled={uploading} className="sr-only" /></label>}{media.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{media.map(item => <article key={item.id} className="overflow-hidden rounded-xl border bg-slate-50"><div className="aspect-video bg-slate-100">{item.url ? (item.media_type === "video" ? <video src={item.url} controls className="h-full w-full object-cover" /> : <img src={item.url} alt="Mídia da publicação" className="h-full w-full object-cover" />) : <div className="flex h-full items-center justify-center text-sm text-slate-400">Prévia indisponível</div>}</div><div className="space-y-2 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium uppercase text-slate-500">{item.media_type}</span>{item.is_preview && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700">Preview</span>}</div><p className="text-xs text-slate-500">{formatBytes(item.size_bytes)} · ordem {item.sort_order + 1}</p>{editable && <div className="flex flex-wrap gap-2"><button onClick={()=>setPreview(item)} disabled={uploading || item.is_preview} className="rounded-md border px-2 py-1 text-xs font-medium">Usar como preview</button><button onClick={()=>removeMedia(item)} disabled={uploading} className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700">Remover</button></div>}</div></article>)}</div> : <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">Nenhuma mídia adicionada. A publicação não poderá ser enviada para análise sem pelo menos uma mídia.</div>}</section>
      <section className="space-y-5 rounded-xl border bg-white p-6"><div><p className="text-xs font-semibold tracking-wide text-slate-500">RELACIONAMENTO</p><h2 className="mt-1 text-xl font-semibold">Interações recentes</h2><p className="mt-1 text-sm text-slate-600">Curtidas e comentários visíveis desta publicação, sem expor dados pessoais desnecessários.</p></div>{comments.length ? <div className="space-y-3">{comments.map(comment => <article key={comment.id} className="rounded-lg border bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium uppercase tracking-wide text-slate-500">Comentário</span><time className="text-xs text-slate-500">{formatDate(comment.created_at)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.body}</p></article>)}</div> : <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">Nenhum comentário visível nesta publicação.</div>}<div className="flex flex-wrap gap-3"><button onClick={()=>loadInteractions(post.id)} disabled={uploading || saving} className="rounded-lg border px-4 py-2 text-sm font-medium">Atualizar interações</button><button onClick={()=>router.push("/fans/gerenciar/atividade")} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Abrir central de atividade</button></div></section>
    </>}
  </main>;
}
