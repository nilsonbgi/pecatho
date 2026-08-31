import Link from "next/link";
import { createClient } from "../../src/lib/supabase/server";
import styles from "./fans.module.css";

export const dynamic = "force-dynamic";

export default async function FansHomePage() {
  const supabase = await createClient();
  const { data: creators } = await supabase
    .from("fans_creators")
    .select("id, slug, display_name, bio, avatar_url")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>Pecatho <span>Fans</span></Link>
        <nav className={styles.nav} aria-label="Navegação principal">
          <Link href="/fans">Início</Link>
          <Link href="/fans/entrar">Entrar</Link>
          <Link href="/cadastro" className={styles.navCta}>Criar conta</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Um serviço exclusivo da Pecatho</p>
          <h1>Conteúdo exclusivo, direto de quem você acompanha.</h1>
          <p className={styles.heroText}>
            Siga seus criadores favoritos, assine conteúdos exclusivos e compre publicações individuais com uma experiência segura e profissional.
          </p>
          <div className={styles.heroActions}>
            <Link href="#criadores" className={styles.primaryButton}>Explorar criadores</Link>
            <Link href="/fans/entrar" className={styles.secondaryButton}>Acessar minha conta</Link>
          </div>
        </div>
        <div className={styles.heroCard}>
          <span>PECATHO FANS</span>
          <strong>Seu conteúdo.</strong>
          <strong>Seu público.</strong>
          <strong>Seu negócio.</strong>
          <small>Uma extensão independente da plataforma de anunciantes.</small>
        </div>
      </section>

      <section id="criadores" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Descubra</p>
            <h2>Criadores em destaque</h2>
          </div>
          <span>{creators?.length ?? 0} disponíveis</span>
        </div>

        {creators && creators.length > 0 ? (
          <div className={styles.grid}>
            {creators.map((creator) => (
              <Link key={creator.id} href={`/fans/${creator.slug}`} className={styles.creatorCard}>
                <div className={styles.avatar}>
                  {creator.avatar_url ? <img src={creator.avatar_url} alt="" /> : <span>{creator.display_name.slice(0, 1).toUpperCase()}</span>}
                </div>
                <div className={styles.creatorBody}>
                  <h3>{creator.display_name}</h3>
                  <p>{creator.bio || "Conteúdo exclusivo para assinantes."}</p>
                  <span>Ver perfil →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✦</div>
            <h3>Os primeiros criadores estão chegando</h3>
            <p>O catálogo será exibido aqui assim que os perfis do Pecatho Fans forem publicados.</p>
          </div>
        )}
      </section>

      <section className={styles.features}>
        <article><strong>Conteúdo protegido</strong><span>Arquivos privados e acesso controlado por assinatura ou compra.</span></article>
        <article><strong>Pagamento organizado</strong><span>Compras, assinaturas e repasses registrados de forma independente.</span></article>
        <article><strong>Experiência profissional</strong><span>Uma área própria para o serviço de conteúdo, sem misturar funções da plataforma principal.</span></article>
      </section>

      <footer className={styles.footer}>© {new Date().getFullYear()} Pecatho Fans · Conteúdo adulto destinado exclusivamente a maiores de 18 anos.</footer>
    </main>
  );
}
