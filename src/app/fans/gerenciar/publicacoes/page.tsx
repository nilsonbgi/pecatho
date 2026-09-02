import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  pending_review: "Em análise",
  published: "Publicado",
  rejected: "Rejeitado",
  archived: "Arquivado",
};

const accessLabel: Record<string, string> = {
  free: "Gratuito",
  paid: "Venda avulsa",
  subscriber: "Assinantes",
};

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function FansPublicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase.from("fans_creators").select("id,display_name,status").eq("user_id", user.id).maybeSingle();
  if (!creator) redirect("/fans/ativar");

  const { data: posts, error } = await supabase
    .from("fans_posts")
    .select("id,title,body,price,currency,access_type,status,published_at,created_at,updated_at")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const list = posts ?? [];

  return (
    <main className="shell fansShell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div>
        <div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href="/fans">Visão geral</Link></div>
      </nav>
      <section className="hero fansHero">
        <div className="eyebrow">CONTEÚDO • PUBLICAÇÕES</div>
        <h1>Suas <em>publicações.</em></h1>
        <p className="heroCopy">Crie, organize e prepare conteúdos para sua audiência. A publicação definitiva continua condicionada à análise e às regras de integridade do Pecatho Fans.</p>
        <div className="heroActions"><Link className="primaryButton" href="/fans/gerenciar/publicacoes/nova">Nova publicação</Link><Link className="secondaryButton" href="/fans/gerenciar">Voltar à central</Link></div>

        <section className="fansMetrics">
          <article className="card"><span className="metricLabel">TOTAL</span><strong>{list.length}</strong><p>Publicações</p></article>
          <article className="card"><span className="metricLabel">PUBLICADAS</span><strong>{list.filter((p) => p.status === "published").length}</strong><p>Conteúdos ativos</p></article>
          <article className="card"><span className="metricLabel">EM ANÁLISE</span><strong>{list.filter((p) => p.status === "pending_review").length}</strong><p>Aguardando moderação</p></article>
        </section>

        <section className="fansOnboarding card">
          <div className="eyebrow">CATÁLOGO DE CONTEÚDO</div>
          {list.length ? <div style={{ display: "grid", gap: 12 }}>{list.map((post) => (
            <article key={post.id} className="card" style={{ minHeight: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
              <div style={{ minWidth: 0 }}>
                <span className="serviceLabel">{statusLabel[post.status] ?? post.status} • {accessLabel[post.access_type] ?? post.access_type}</span>
                <h2 style={{ marginTop: 8 }}>{post.title}</h2>
                <p>{post.body || "Sem descrição cadastrada."}</p>
                <small style={{ color: "#747c8b" }}>{post.access_type === "free" ? "Gratuito" : brl(Number(post.price || 0))}</small>
              </div>
              <Link className="secondaryButton" href={`/fans/gerenciar/publicacoes/${post.id}`}>Gerenciar</Link>
            </article>
          ))}</div> : <div><h2>Nenhuma publicação</h2><p>Crie sua primeira publicação e depois associe as mídias necessárias antes de enviá-la para análise.</p></div>}
        </section>
      </section>
    </main>
  );
}
