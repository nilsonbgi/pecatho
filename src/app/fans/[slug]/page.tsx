import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import StartFansChatButton from "@/components/fans/StartFansChatButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

type Plan = { id: string; name: string; description: string | null; price: number; currency: string; duration_days: number; status: string };
type LiveOffer = { id: string; title: string; description: string | null; duration_minutes: number; price: number; currency: string; status: string };
type Card = { id: string; title: string; body: string | null; price: number; currency: string; access_type: "free" | "paid" | "subscriber"; published_at: string | null; created_at: string; previewUrl: string | null; previewType: string | null; likesCount: number; commentsCount: number };

function money(value: number, currency = "BRL") { return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(Number(value || 0)); }
function durationLabel(days: number) { return days === 30 ? "por mês" : days === 90 ? "por trimestre" : days === 365 ? "por ano" : `por ${days} dias`; }

export default async function FansCreatorPublicPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const { data: creator } = await admin.from("fans_creators").select("id,slug,display_name,bio,avatar_url,status,user_id").eq("slug", slug).maybeSingle();
  if (!creator || creator.status !== "active") notFound();
  const isOwner = !!user && creator.user_id === user.id;
  const [{ data: posts }, { data: plans }, { data: liveOffers }] = await Promise.all([
    admin.from("fans_posts").select("id,title,body,price,currency,access_type,published_at,created_at").eq("creator_id", creator.id).eq("status", "published").order("published_at", { ascending: false }).order("created_at", { ascending: false }),
    admin.from("fans_plans").select("id,name,description,price,currency,duration_days,status").eq("creator_id", creator.id).eq("status", "active").order("price", { ascending: true }),
    admin.from("fans_live_offers").select("id,title,description,duration_minutes,price,currency,status").eq("creator_id", creator.id).eq("status", "active").order("price", { ascending: true }),
  ]);
  const cards: Card[] = await Promise.all((posts ?? []).map(async post => {
    const [{ data: preview }, { count: likesCount }, { count: commentsCount }] = await Promise.all([
      admin.from("fans_post_media").select("storage_bucket,storage_path,media_type,mime_type,width,height").eq("post_id", post.id).eq("is_preview", true).order("sort_order", { ascending: true }).limit(1).maybeSingle(),
      admin.from("fans_likes").select("id", { count: "exact", head: true }).eq("post_id", post.id),
      admin.from("fans_comments").select("id", { count: "exact", head: true }).eq("post_id", post.id).eq("status", "visible"),
    ]);
    let previewUrl: string | null = null;
    if (preview?.storage_path) {
      const bucket = String(preview.storage_bucket || "fans-private").trim();
      if (bucket) {
        const { data } = await admin.storage.from(bucket).createSignedUrl(preview.storage_path, 180);
        previewUrl = data?.signedUrl ?? null;
      }
    }
    return { ...post, body: isOwner || post.access_type === "free" ? post.body : null, previewUrl, previewType: preview?.media_type ?? null, likesCount: likesCount ?? 0, commentsCount: commentsCount ?? 0 } as Card;
  }));
  const activePlans = (plans ?? []) as Plan[];
  const activeLiveOffers = (liveOffers ?? []) as LiveOffer[];
  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-slate-50 px-4 py-8 sm:px-6">
      <nav className="mb-8 flex items-center justify-between gap-4"><Link href="/fans" className="font-semibold text-slate-900">Pecatho <span className="text-slate-500">Fans</span></Link><div className="flex gap-2 text-sm"><Link href="/anunciantes" className="rounded-lg border bg-white px-3 py-2">Pecatho</Link>{user ? <Link href="/fans/gerenciar" className="rounded-lg bg-slate-900 px-3 py-2 text-white">Meu Fans</Link> : <Link href={`/login?next=/fans/${creator.slug}`} className="rounded-lg bg-slate-900 px-3 py-2 text-white">Entrar</Link>}</div></nav>
      <header className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="bg-slate-950 px-6 py-8 text-white sm:px-8 sm:py-10"><div className="flex flex-col gap-6 sm:flex-row sm:items-center"><div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-4xl font-semibold text-white ring-4 ring-white/10">{creator.avatar_url ? <img src={creator.avatar_url} alt={creator.display_name} className="h-full w-full object-cover" /> : creator.display_name?.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Criador Pecatho Fans</p><h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{creator.display_name}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">{creator.bio || "Conteúdos exclusivos, publicados com controle de acesso."}</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-300"><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{cards.length} publicação(ões)</span>{activePlans.length > 0 && <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{activePlans.length} plano(s) de assinatura</span>}{activeLiveOffers.length > 0 && <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{activeLiveOffers.length} videochamada(s)</span>}</div></div></div></div>
        <div className="flex flex-wrap gap-3 border-t bg-white p-5 sm:p-6">{activePlans.length > 0 && <a href="#assinatura" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Ver planos de assinatura</a>}<a href="#publicacoes" className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-900">Ver publicações</a>{activeLiveOffers.length > 0 && <a href="#videochamadas" className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-900">Videochamadas</a>}<StartFansChatButton creatorId={creator.id} /></div>
      </header>
      {activePlans.length > 0 && <section id="assinatura" className="mt-8 scroll-mt-6"><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assinatura</p><h2 className="text-2xl font-bold text-slate-950">Tenha acesso ao conteúdo exclusivo</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Escolha um plano para acompanhar as publicações destinadas a assinantes. A ativação depende da confirmação oficial do pagamento.</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{activePlans.map(plan => <article key={plan.id} className="rounded-2xl border bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-950">{plan.name}</p>{plan.description && <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description}</p>}<div className="mt-5"><span className="text-2xl font-bold text-slate-950">{money(plan.price, plan.currency)}</span> <span className="text-sm text-slate-500">{durationLabel(plan.duration_days)}</span></div><Link href={user ? `/fans/assinar/${plan.id}` : `/login?next=/fans/${creator.slug}`} className="mt-5 inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{user ? "Assinar plano" : "Entrar para assinar"}</Link></article>)}</div></section>}
      {activeLiveOffers.length > 0 && <section id="videochamadas" className="mt-10 scroll-mt-6"><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Interação privada</p><h2 className="text-2xl font-bold text-slate-950">Videochamadas</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Escolha uma modalidade e faça o pagamento pelo checkout oficial. O acesso somente é liberado após a confirmação do pagamento.</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{activeLiveOffers.map(offer => <article key={offer.id} className="rounded-2xl border bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-950">{offer.title}</p>{offer.description && <p className="mt-2 text-sm leading-6 text-slate-600">{offer.description}</p>}<div className="mt-5"><span className="text-2xl font-bold text-slate-950">{money(offer.price, offer.currency)}</span><span className="ml-2 text-sm text-slate-500">{offer.duration_minutes} min</span></div><Link href={user ? `/fans/videochamadas/${offer.id}` : `/login?next=/fans/${creator.slug}`} className="mt-5 inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{user ? "Contratar videochamada" : "Entrar para contratar"}</Link></article>)}</div></section>}
      <section id="publicacoes" className="mt-10 scroll-mt-6"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Conteúdo</p><h2 className="text-2xl font-bold text-slate-950">Publicações</h2></div><span className="text-sm text-slate-500">{cards.length} publicação(ões)</span></div>{cards.length === 0 ? <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500">Este criador ainda não publicou conteúdo.</div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards.map(post => <article key={post.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md"><Link href={`/fans/publicacoes/${post.id}`} className="block"><div className="relative aspect-[4/3] overflow-hidden bg-slate-100">{post.previewUrl ? (post.previewType === "video" ? <video src={post.previewUrl} muted playsInline className="h-full w-full object-cover" /> : <img src={post.previewUrl} alt="Preview da publicação" className="h-full w-full object-cover" />) : <div className="flex h-full items-center justify-center text-sm text-slate-400">Sem preview</div>}<span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">{post.access_type === "free" ? "Grátis" : post.access_type === "paid" ? money(post.price, post.currency) : "Assinantes"}</span></div><div className="p-5"><h3 className="font-semibold text-slate-950">{post.title}</h3>{post.body ? <p className="mt-2 line-clamp-3 text-sm text-slate-600">{post.body}</p> : <p className="mt-2 text-sm text-slate-500">Conteúdo protegido. Abra a publicação para verificar as condições de acesso.</p>}<div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500"><span>♥ {post.likesCount}</span><span>💬 {post.commentsCount}</span><span className="font-semibold text-slate-900">Abrir →</span></div></div></Link></article>)}</div>}</section>
    </main>
  );
}
