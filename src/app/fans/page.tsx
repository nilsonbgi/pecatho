import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("fans_creators")
    .select("id,slug,display_name,bio,status,avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  let plansCount = 0;
  let postsCount = 0;

  if (creator) {
    const [{ count: plans }, { count: posts }] = await Promise.all([
      supabase.from("fans_plans").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
      supabase.from("fans_posts").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
    ]);
    plansCount = plans || 0;
    postsCount = posts || 0;
  }

  return (
    <main className="shell fansShell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div>
        <div className="navLinks">
          <Link href="/fans/minhas-assinaturas">Minhas assinaturas</Link>
          <Link href="/painel">Painel Pecatho</Link>
          <Link href="/">Página inicial</Link>
        </div>
      </nav>

      <section className="hero fansHero">
        <div className="eyebrow">SERVIÇO ADICIONAL DO PECATHO</div>
        <h1>Seu conteúdo. <em>Sua audiência.</em></h1>
        <p className="heroCopy">
          O Pecatho Fans é um serviço independente dentro do ecossistema Pecatho para quem deseja criar uma audiência e monetizar conteúdos.
          Você pode utilizar o Fans com ou sem um perfil de anunciante no Pecatho principal.
        </p>

        {!creator ? (
          <section className="fansOnboarding card">
            <div className="cardIcon">F</div>
            <h2>Crie seu espaço no Fans</h2>
            <p>Você não precisa anunciar serviços no Pecatho para utilizar o Fans. Crie seu perfil de criador, configure sua página e depois cadastre planos e conteúdos.</p>
            <div className="heroActions"><Link className="primaryButton" href="/fans/ativar">Criar meu espaço Fans</Link><Link className="secondaryButton" href="/fans/minhas-assinaturas">Minhas assinaturas</Link></div>
            <small>Seu perfil de anunciante, se existir, continuará separado e poderá ser associado ao Fans posteriormente.</small>
          </section>
        ) : (
          <>
            <section className="fansCreator card">
              <div>
                <span className="serviceLabel">CRIADOR FANS</span>
                <h2>{creator.display_name}</h2>
                <p>{creator.bio || "Seu espaço de conteúdo está pronto para ser configurado."}</p>
              </div>
              <span className="statusBadge">{creator.status === "active" ? "Ativo" : creator.status}</span>
            </section>

            <section className="fansMetrics">
              <article className="card"><span className="metricLabel">PLANOS</span><strong>{plansCount}</strong><p>Planos de assinatura</p></article>
              <article className="card"><span className="metricLabel">PUBLICAÇÕES</span><strong>{postsCount}</strong><p>Conteúdos cadastrados</p></article>
              <article className="card"><span className="metricLabel">CONTEÚDO</span><strong>Fans</strong><p>Área exclusiva para sua audiência</p></article>
            </section>

            <section className="fansOnboarding card">
              <h2>Área do fã</h2>
              <p>Consulte suas assinaturas e os acessos adquiridos independentemente da sua atuação como criador.</p>
              <div className="heroActions"><Link className="primaryButton" href="/fans/minhas-assinaturas">Minhas assinaturas</Link><Link className="secondaryButton" href="/fans/gerenciar">Gerenciar meu Fans</Link></div>
            </section>
          </>
        )}

        <section className="ecosystem fansBoundary">
          <div>
            <div className="eyebrow">SEPARAÇÃO FUNCIONAL</div>
            <h2>O Fans não substitui o Pecatho.</h2>
            <p>
              O Pecatho principal continua responsável pelos anúncios de serviços. O Fans possui sua própria operação de conteúdo e relacionamento com fãs.
              Um mesmo usuário pode ter apenas Fans ou utilizar simultaneamente o Pecatho como anunciante e o Fans como criador.
            </p>
          </div>
          <div className="architecture"><span>Pecatho</span><b>→</b><span>Anunciante</span><b>→</b><span>Fans</span></div>
        </section>
      </section>
    </main>
  );
}
