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

function dateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
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
  if (error) {
    console.error("Falha ao carregar publicações do criador:", {
      creatorId: creator.id,
      code: error.code,
    });
  }

  const publicationLoadError = Boolean(error);
  const list = posts ?? [];
  const { data: boostRows, error: boostError } = await supabase
    .from("fans_boosts")
    .select("id,post_id,plan_id,view_count,status,starts_at,ends_at")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });
  if (boostError) {
    console.error("Falha ao carregar impulsionamentos do criador:", {
      creatorId: creator.id,
      code: boostError.code,
    });
  }
  const boostLoadError = Boolean(boostError);

  const planIds = [...new Set((boostRows ?? []).map((boost) => boost.plan_id).filter((id): id is string => Boolean(id)))];
  const { data: plans, error: plansError } = planIds.length
    ? await supabase.from("fans_boost_plans").select("id,name,multiplier").in("id", planIds)
    : { data: [], error: null };
  if (plansError) {
    console.error("Falha ao carregar planos de impulsionamento:", {
      creatorId: creator.id,
      code: plansError.code,
    });
  }
  const boostPlansLoadError = Boolean(plansError);

  const planById = new Map((plans ?? []).map((plan) => [plan.id, plan]));
  const now = Date.now();
  const activeBoosts = (boostRows ?? []).filter((boost) =>
    boost.status === "active" && new Date(boost.starts_at).getTime() <= now && new Date(boost.ends_at).getTime() > now
  );
  const activeBoostByPost = new Map<string, (typeof activeBoosts)[number]>();
  for (const boost of activeBoosts) {
    if (boost.post_id && !activeBoostByPost.has(boost.post_id)) activeBoostByPost.set(boost.post_id, boost);
  }
  const totalBoostExposures = (boostRows ?? []).reduce((total, boost) => total + Math.max(0, Number(boost.view_count) || 0), 0);

  return (
    <main className="shell fansShell">
      <style>{`
        .fp-boost-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0}
        .fp-boost-stat{border:1px solid rgba(231,195,63,.2);background:rgba(231,195,63,.045);border-radius:15px;padding:15px}
        .fp-boost-stat span{display:block;color:#a6adbb;font-size:9px;letter-spacing:.13em;font-weight:850}
        .fp-boost-stat strong{display:block;color:#e7c33f;font-size:24px;margin-top:7px}
        .fp-post-row{min-height:0;display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
        .fp-post-main{min-width:0;flex:1}
        .fp-post-actions{display:flex;flex-direction:column;align-items:flex-end;gap:9px;flex-shrink:0}
        .fp-boost-badge{display:inline-flex;align-items:center;gap:5px;border:1px solid rgba(231,195,63,.35);background:rgba(231,195,63,.09);color:#e7c33f;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900;letter-spacing:.04em}
        .fp-boost-detail{margin-top:12px;border-top:1px solid rgba(231,195,63,.15);padding-top:11px;display:flex;gap:16px;flex-wrap:wrap;color:#b8a65e;font-size:10px;line-height:1.5}
        .fp-muted{color:#8b93a3;font-size:10px}
        @media(max-width:620px){.fp-boost-summary{grid-template-columns:1fr 1fr}.fp-post-row{flex-direction:column}.fp-post-actions{width:100%;align-items:stretch}.fp-post-actions a{text-align:center}.fp-boost-summary .fp-boost-stat:last-child{grid-column:1/-1}}
      `}</style>
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div>
        <div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href="/fans">Visão geral</Link></div>
      </nav>
      <section className="hero fansHero">
        <div className="eyebrow">CONTEÚDO • PUBLICAÇÕES</div>
        <h1>Suas <em>publicações.</em></h1>
        <p className="heroCopy">Crie, organize e prepare conteúdos para sua audiência. A publicação definitiva continua condicionada à análise e às regras de integridade do Pecatho Fans.</p>
        <div className="heroActions"><Link className="primaryButton" href="/fans/gerenciar/publicacoes/nova">Nova publicação</Link><Link className="secondaryButton" href="/fans/gerenciar/conteudos">Loja de conteúdo</Link><Link className="secondaryButton" href="/fans/gerenciar">Voltar à central</Link></div>

        <section className="fansMetrics">
          <article className="card"><span className="metricLabel">TOTAL</span><strong>{publicationLoadError ? "—" : list.length}</strong><p>Publicações</p></article>
          <article className="card"><span className="metricLabel">PUBLICADAS</span><strong>{publicationLoadError ? "—" : list.filter((p) => p.status === "published").length}</strong><p>Conteúdos ativos</p></article>
          <article className="card"><span className="metricLabel">EM ANÁLISE</span><strong>{publicationLoadError ? "—" : list.filter((p) => p.status === "pending_review").length}</strong><p>Aguardando moderação</p></article>
        </section>

        <section className="fp-boost-summary" aria-label="Resumo dos impulsionamentos">
          <article className="fp-boost-stat"><span>IMPULSIONAMENTOS ATIVOS</span><strong>{boostLoadError ? "—" : activeBoosts.length}</strong></article>
          <article className="fp-boost-stat"><span>EXPOSIÇÕES REGISTRADAS</span><strong>{boostLoadError ? "—" : totalBoostExposures.toLocaleString("pt-BR")}</strong></article>
          <article className="fp-boost-stat"><span>PUBLICAÇÕES IMPULSIONADAS</span><strong>{boostLoadError ? "—" : activeBoostByPost.size}</strong></article>
        </section>

        <section className="fansOnboarding card">
          <div className="eyebrow">CATÁLOGO DE CONTEÚDO</div>
          {publicationLoadError ? <div role="alert" className="card"><h2>Não foi possível carregar suas publicações</h2><p>Seus conteúdos não foram alterados. Atualize a página; se o problema persistir, entre em contato com o suporte.</p></div> : list.length ? <div style={{ display: "grid", gap: 12 }}>{list.map((post) => {
            const boost = activeBoostByPost.get(post.id);
            const plan = boost?.plan_id ? planById.get(boost.plan_id) : null;
            return (
              <article key={post.id} className="card fp-post-row">
                <div className="fp-post-main">
                  <span className="serviceLabel">{statusLabel[post.status] ?? post.status} • {accessLabel[post.access_type] ?? post.access_type}</span>
                  <h2 style={{ marginTop: 8 }}>{post.title}</h2>
                  <p>{post.body || "Sem descrição cadastrada."}</p>
                  <small className="fp-muted">{post.access_type === "free" ? "Gratuito" : brl(Number(post.price || 0))}</small>
                  {boost ? <div className="fp-boost-detail">
                    <span>✦ IMPULSIONADA{plan?.multiplier ? ` · ${Number(plan.multiplier).toLocaleString("pt-BR") }×` : ""}</span>
                    <span>{Math.max(0, Number(boost.view_count) || 0).toLocaleString("pt-BR")} exposições</span>
                    <span>Encerra em {dateTime(boost.ends_at)}</span>
                  </div> : null}
                </div>
                <div className="fp-post-actions">
                  {boost ? <span className="fp-boost-badge">✦ Impulsionada</span> : null}
                  <Link className="secondaryButton" href={`/fans/gerenciar/publicacoes/${post.id}`}>Gerenciar</Link>
                </div>
              </article>
            );
          })}</div> : <div><h2>Nenhuma publicação</h2><p>Crie sua primeira publicação e depois associe as mídias necessárias antes de enviá-la para análise.</p></div>}
        </section>
      </section>
    </main>
  );
}
