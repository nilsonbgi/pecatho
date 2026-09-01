import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Painel() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("display_name,username,status").eq("id", user.id).single();
  const { data: advertiser } = await supabase.from("advertiser_profiles").select("id,title,status,verification_status,city_id,state_id").eq("user_id", user.id).maybeSingle();
  const { data: creator } = await supabase.from("fans_creators").select("id,slug,display_name,status,bio").eq("user_id", user.id).maybeSingle();

  const publicationStatus: Record<string, string> = { draft: "Rascunho", pending_review: "Em análise", published: "Publicado", paused: "Pausado", suspended: "Suspenso", archived: "Arquivado" };
  const verificationStatus: Record<string, string> = { unverified: "Não verificada", pending: "Em análise", verified: "Verificada", rejected: "Rejeitada", expired: "Expirada" };
  const creatorStatus: Record<string, string> = { active: "Ativo", suspended: "Suspenso", inactive: "Inativo" };

  return (
    <main className="shell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div>
        <div className="navLinks"><Link href="/">Página inicial</Link><Link href="/anunciantes">Anunciantes</Link><Link href="/admin" className="navCta">Administração</Link></div>
      </nav>
      <section className="hero">
        <div className="eyebrow">PAINEL DO USUÁRIO</div>
        <h1>Olá, <em>{profile?.display_name || user.email}</em></h1>
        <p className="heroCopy">O painel reúne os serviços que pertencem à sua conta. Anunciar no Pecatho e vender conteúdo no Fans são módulos distintos e podem ser usados separadamente.</p>

        <section className="pillars">
          <article className="card">
            <div className="cardIcon">A</div><h2>Meu anúncio Pecatho</h2>
            <p>{advertiser ? advertiser.title : "Você ainda não criou um anúncio de serviços."}</p>
            <p>Status: {advertiser ? publicationStatus[advertiser.status] || advertiser.status : "Não iniciado"}</p>
            <Link className="secondaryButton" href="/painel/anuncio">{advertiser ? "Editar anúncio" : "Criar anúncio"}</Link>
          </article>
          <article className="card">
            <div className="cardIcon">V</div><h2>Verificação do anúncio</h2>
            <p>{advertiser ? verificationStatus[advertiser.verification_status] || advertiser.verification_status : "Não há anúncio para verificar."}</p>
            {advertiser && <Link className="secondaryButton" href="/painel/anuncio">Completar dados</Link>}
          </article>
          <article className="card">
            <div className="cardIcon">F</div><h2>Meu Fans</h2>
            <p>{creator ? `${creator.display_name} · ${creatorStatus[creator.status] || creator.status}` : "Você pode vender conteúdo sem possuir um anúncio de serviços."}</p>
            <Link className="secondaryButton" href="/fans">{creator ? "Abrir Fans" : "Criar perfil Fans"}</Link>
          </article>
          <article className="card">
            <div className="cardIcon">C</div><h2>Conteúdo</h2>
            <p>{creator ? "Gerencie publicações, planos e conteúdo do seu perfil Fans." : "O módulo Fans pode ser iniciado independentemente do anúncio Pecatho."}</p>
            <Link className="secondaryButton" href="/fans">Gerenciar conteúdo</Link>
          </article>
          <article className="card">
            <div className="cardIcon">L</div><h2>Localização</h2>
            <p>Estados e municípios oficiais da base territorial do Pecatho.</p>
            {advertiser ? <Link className="secondaryButton" href="/painel/localidades">Consultar localidades</Link> : <span className="fieldNote">Disponível ao criar o anúncio.</span>}
          </article>
          <article className="card">
            <div className="cardIcon">P</div><h2>Perfil da conta</h2>
            <p>{profile?.status === "active" ? "Conta ativa" : "Conta em configuração"}</p>
            <p className="fieldNote">Edite seus dados pessoais, endereço e preferências cadastrais.</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:16}}><Link className="secondaryButton" href="/painel/perfil">Editar meus dados</Link><Link className="secondaryButton" href="/admin">Administração</Link></div>
          </article>
        </section>
      </section>
    </main>
  );
}
