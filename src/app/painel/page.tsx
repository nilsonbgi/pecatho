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

  const publicationStatus: Record<string, string> = { draft: "Rascunho", pending_review: "Em análise", published: "Publicado", paused: "Pausado", suspended: "Suspenso", archived: "Arquivado" };
  const verificationStatus: Record<string, string> = { unverified: "Não verificada", pending: "Em análise", verified: "Verificada", rejected: "Rejeitada", expired: "Expirada" };

  return (
    <main className="shell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div>
        <Link href="/" className="navCta">Página inicial</Link>
      </nav>
      <section className="hero">
        <div className="eyebrow">ÁREA DO ANUNCIANTE</div>
        <h1>Olá, <em>{profile?.display_name || user.email}</em></h1>
        <p className="heroCopy">Gerencie sua conta, seu anúncio e, em seguida, sua publicação dentro do ecossistema Pecatho.</p>
        <section className="pillars">
          <article className="card"><h2>Minha conta</h2><p>Status da conta: {profile?.status === "active" ? "Ativa" : "Em configuração"}</p></article>
          <article className="card"><h2>Meu anúncio</h2><p>{advertiser ? advertiser.title : "Você ainda não criou seu anúncio."}</p><Link className="secondaryButton" href="/painel/anuncio">{advertiser ? "Editar anúncio" : "Criar anúncio"}</Link></article>
          <article className="card"><h2>Publicação</h2><p>{advertiser ? publicationStatus[advertiser.status] || advertiser.status : "Ainda não iniciada"}</p></article>
          <article className="card"><h2>Verificação</h2><p>{advertiser ? verificationStatus[advertiser.verification_status] || advertiser.verification_status : "Ainda não iniciada"}</p></article>
          <article className="card"><h2>Base territorial</h2><p>Estados e municípios oficiais do IBGE.</p><Link className="secondaryButton" href="/painel/localidades">Gerenciar localidades</Link></article>
        </section>
      </section>
    </main>
  );
}
