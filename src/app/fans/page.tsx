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
          <Link href="/painel">Painel Pecatho</Link>
          <Link href="/">Página inicial</Link>
        </div>
      </nav>

      <section className="hero fansHero">
        <div className="eyebrow">SERVIÇO ADICIONAL DO PECATHO</div>
        <h1>Seu conteúdo. <em>Sua audiência.</em></h1>
        <p className="heroCopy">
          O Pecatho Fans é um serviço complementar para anunciantes que desejam vender conteúdos diretamente aos seus fãs.
          Ele compartilha a identidade do ecossistema Pecatho, mas possui operação, conteúdo e relacionamento próprios.
        </p>

        {!creator ? (
          <section className="fansOnboarding card">
            <div className="cardIcon">F</div>
            <h2>Ative seu espaço no Fans</h2>
            <p>Seu cadastro de anunciante permanece intacto. A ativação do Fans cria o seu espaço específico para conteúdos, planos e audiência.</p>
            <button className="primaryButton" disabled>Ativar Fans</button>
            <small>A ativação comercial será disponibilizada na próxima etapa.</small>
          </section>
        ) : (
          <>
            <section className="fansCreator card">
              <div>
                <span className="serviceLabel">CRIADOR</span>
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
          </>
        )}

        <section className="ecosystem fansBoundary">
          <div>
            <div className="eyebrow">SEPARAÇÃO FUNCIONAL</div>
            <h2>O Fans não substitui o Pecatho.</h2>
            <p>
              O anúncio continua sendo administrado no Pecatho principal. O Fans é uma extensão opcional para quem deseja monetizar conteúdos.
              A arquitetura mantém os dois produtos claramente separados, evitando misturar descoberta de anunciantes com consumo de conteúdo.
            </p>
          </div>
          <div className="architecture"><span>Pecatho</span><b>→</b><span>Anunciante</span><b>→</b><span>Fans</span></div>
        </section>
      </section>
    </main>
  );
}
