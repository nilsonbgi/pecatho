import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function FansCreatorPublicPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const { data: creator } = await admin.from("fans_creators").select("id,slug,display_name,bio,avatar_url,status,user_id").eq("slug", slug).maybeSingle();
  if (!creator || creator.status !== "active") notFound();
  const isOwner = !!user && creator.user_id === user.id;

  const { data: posts } = await admin.from("fans_posts")
    .select("id,title,body,price,currency,access_type,published_at,created_at")
    .eq("creator_id", creator.id).eq("status", "published")
    .order("published_at", { ascending: false }).order("created_at", { ascending: false });

  const cards = await Promise.all((posts ?? []).map(async post => {
    const { data: preview } = await admin.from("fans_post_media").select("storage_bucket,storage_path,media_type,mime_type,width,height").eq("post_id", post.id).eq("is_preview", true).order("sort_order", { ascending: true }).limit(1).maybeSingle();
    let previewUrl: string | null = null;
    if (preview?.storage_bucket === "pecatho-private") {
      const { data } = await admin.storage.from("pecatho-private").createSignedUrl(preview.storage_path, 180);
      previewUrl = data?.signedUrl ?? null;
    }
    return { ...post, body: isOwner || post.access_type === "free" ? post.body : null, previewUrl, previewType: preview?.media_type ?? null };
  }));

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-slate-50 px-4 py-8 sm:px-6">
      <nav className="mb-8 flex items-center justify-between gap-4"><Link href="/fans" className="font-semibold text-slate-900">Pecatho <span className="text-slate-500">Fans</span></Link><div className="flex gap-2 text-sm"><Link href="/anunciantes" className="rounded-lg border bg-white px-3 py-2">Pecatho</Link>{user ? <Link href="/fans/gerenciar" className="rounded-lg bg-slate-900 px-3 py-2 text-white">Meu Fans</Link> : <Link href="/login" className="rounded-lg bg-slate-900 px-3 py-2 text-white">Entrar</Link>}</div></nav>
      <header className="overflow-hidden rounded-3xl border bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-3xl font-semibold text-slate-500">{creator.avatar_url ? <img src={creator.avatar_url} alt={creator.display_name} className="h-full w-full object-cover" /> : creator.display_name?.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Criador Pecatho Fans</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{creator.display_name}</h1><p className="mt-2 max-w-3xl text-slate-600">{creator.bio || "Conteúdos exclusivos, publicados com controle de acesso."}</p></div></div></header>
      <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Conteúdo</p><h2 className="text-2xl font-bold text-slate-950">Publicações</h2></div><span className="text-sm text-slate-500">{cards.length} publicação(ões)</span></div>
        {cards.length === 0 ? <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500">Este criador ainda não publicou conteúdo.</div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards.map(post => <article key={post.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm"><Link href={`/fans/publicacoes/${post.id}`} className="block"><div className="relative aspect-[4/3] overflow-hidden bg-slate-100">{post.previewUrl ? (post.previewType === "video" ? <video src={post.previewUrl} muted playsInline className="h-full w-full object-cover" /> : <img src={post.previewUrl} alt="Preview da publicação" className="h-full w-full object-cover" />) : <div className="flex h-full items-center justify-center text-sm text-slate-400">Sem preview</div>}<span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">{post.access_type === "free" ? "Grátis" : post.access_type === "paid" ? `R$ ${Number(post.price).toFixed(2).replace(".", ",")}` : "Assinantes"}</span></div><div className="p-5"><h3 className="font-semibold text-slate-950">{post.title}</h3>{post.body ? <p className="mt-2 line-clamp-3 text-sm text-slate-600">{post.body}</p> : <p className="mt-2 text-sm text-slate-500">Conteúdo protegido. Abra a publicação para verificar as condições de acesso.</p>}<span className="mt-4 inline-flex text-sm font-semibold text-slate-900">Ver publicação →</span></div></Link></article>)}</div>}
      </section>
    </main>
  );
}
