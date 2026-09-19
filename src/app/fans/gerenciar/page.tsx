import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CountResult = { count: number | null };

export default async function FansManagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("fans_creators")
    .select("id,slug,display_name,bio,status,avatar_url,advertiser_profile_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) redirect("/fans/ativar");

  const [plans, posts, subscribers, purchases, tips, payouts, activity] = await Promise.all([
    supabase.from("fans_plans").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
    supabase.from("fans_posts").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
    supabase.from("fans_subscriptions").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
    supabase.from("fans_purchases").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
    supabase.from("fans_tips").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
    supabase.from("fans_payout_requests").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
    supabase.from("fans_notifications").select("id,type,read_at,created_at", { count: "exact" }).eq("user_id", user.id).in("type", ["fans_like", "fans_comment"]).order("created_at", { ascending: false }).limit(5),
  ]) as [CountResult, CountResult, CountResult, CountResult, CountResult, CountResult, { data: { id: string; type: string; read_at: string | null; created_at: string }[] | null; count: number | null }];

  const activePlans = await supabase.from("fans_plans").select("id", { count: "exact", head: true }).eq("creator_id", creator.id).eq("status", "active");
  const publishedPosts = await supabase.from("fans_posts").select("id", { count: "exact", head: true }).eq("creator_id", creator.id).eq("status", "published");
  const unreadActivity = activity.data?.filter((item) => !item.read_at).length ?? 0;

  const cards = [
    { href: "/fans/gerenciar/perfil", icon: "◉", title: "Perfil do criador", text: "Nome, apresentação, avatar e identidade pública." },
    { href: "/fans/gerenciar/planos", icon: "R$", title: "Planos", text: "Crie e administre planos de assinatura." },
    { href: "/fans/gerenciar/publicacoes", icon: "✦", title: "Publicações", text: "Produza conteúdos, organize mídia e envie para moderação." },
    { href: "/fans/gerenciar/assinantes", icon: "♙", title: "Assinantes", text: "Acompanhe sua audiência e relacionamento." },
    { href: "/fans/gerenciar/vendas", icon: "↗", title: "Vendas", text: "Acompanhe compras de conteúdo e resultados." },
    { href: "/fans/gerenciar/gorjetas", icon: "♥", title: "Gorjetas", text: "Consulte as gorjetas recebidas e seu histórico." },
    { href: "/fans/gerenciar/recebimentos", icon: "₿", title: "Recebimentos", text: "Saldo, solicitações de saque e histórico financeiro." },
    { href: "/fans/gerenciar/configuracoes", icon: "⚙", title: "Configurações", text: "Preferências e controles do seu espaço Fans." },
    { href: "/painel/mensagens", icon: "◉", title: "Mensagens Fans", text: "Converse em tempo real com clientes e acompanhe novas interações." },
  ];

  return (
    <main className="shell fansShell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div>
        <div className="navLinks"><Link href="/fans">Visão geral</Link><Link href="/painel">Painel Pecatho</Link></div>
      </nav>

      <section className="hero fansHero">
        <div className="eyebrow">PAINEL DO CRIADOR</div>
        <div className="fansCreator card">
          <div><span className="serviceLabel">ESPAÇO FANS</span><h1>{creator.display_name}</h1><p>{creator.bio || "Administre aqui seu conteúdo, audiência e monetização."}</p></div>
          <span className="statusBadge">{creator.status === "active" ? "Ativo" : creator.status}</span>
        </div>

        <section className="fansMetrics">
          <article className="card"><span className="metricLabel">PLANOS</span><strong>{plans.count ?? 0}</strong><p>{activePlans.count ?? 0} ativos</p></article>
          <article className="card"><span className="metricLabel">PUBLICAÇÕES</span><strong>{posts.count ?? 0}</strong><p>{publishedPosts.count ?? 0} publicadas</p></article>
          <article className="card"><span className="metricLabel">ASSINANTES</span><strong>{subscribers.count ?? 0}</strong><p>Registros de assinatura</p></article>
          <article className="card"><span className="metricLabel">VENDAS</span><strong>{purchases.count ?? 0}</strong><p>Compras registradas</p></article>
        </section>
        <section className="fansMetrics">
          <article className="card"><span className="metricLabel">GORJETAS</span><strong>{tips.count ?? 0}</strong><p>Transações registradas</p></article>
          <article className="card"><span className="metricLabel">SAQUES</span><strong>{payouts.count ?? 0}</strong><p>Solicitações registradas</p></article>
          <Link href="/fans/gerenciar/atividade" className="card" style={{ textDecoration: "none" }}><span className="metricLabel">ATIVIDADE</span><strong>{activity.count ?? 0}</strong><p>{unreadActivity ? `${unreadActivity} não lidas` : "Curtidas e comentários"}</p><span className="serviceLabel">ABRIR →</span></Link>
        </section>

        <section className="fansOnboarding card">
          <div className="eyebrow">CENTRAL DE OPERAÇÃO</div><h2>Gerencie seu Fans</h2>
          <p>Central operacional do criador para perfil, planos, publicações, mídia, audiência e recebimentos. Os módulos financeiros permanecem somente de consulta até que o fluxo transacional seguro esteja implementado.</p>
          <div className="heroActions"><Link className="primaryButton" href="/fans/gerenciar/atividade">Ver atividade</Link><Link className="secondaryButton" href="/painel/notificacoes">Central de notificações</Link></div>
        </section>

        <section className="fansMetrics">
          {cards.map((card) => <Link key={card.href} href={card.href} className="card" style={{ textDecoration: "none" }}><span className="cardIcon">{card.icon}</span><h2>{card.title}</h2><p>{card.text}</p><span className="serviceLabel">ABRIR →</span></Link>)}
        </section>
      </section>
    </main>
  );
}
