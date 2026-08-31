import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../src/lib/supabase/server";
import styles from "../fans.module.css";

export const dynamic = "force-dynamic";

export default async function FansCreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: creator } = await supabase
    .from("fans_creators")
    .select("id, slug, display_name, bio, avatar_url")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!creator) notFound();

  const [{ data: plans }, { data: posts }] = await Promise.all([
    supabase.from("fans_plans").select("id, name, description, price, currency, duration_days").eq("creator_id", creator.id).eq("status", "active").order("price"),
    supabase.from("fans_posts").select("id, title, body, price, currency, access_type, published_at, created_at").eq("creator_id", creator.id).eq("status", "published").eq("access_type", "free").order("published_at", { ascending: false }).limit(24),
  ]);

  const formatMoney = (value: number, currency: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/fans" className={styles.brand}>Pecatho <span>Fans</span></Link>
        <nav className={styles.nav}>
          <Link href="/fans">Voltar</Link>
          <Link href="/fans/entrar" className={styles.navCta}>Entrar</Link>
        </nav>
      </header>

      <section className={styles.profileHero}>
        <div className={styles.avatarLarge}>
          {creator.avatar_url ? <img src={creator.avatar_url} alt="" /> : <span>{creator.display_name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div>
          <p className={styles.eyebrow}>Perfil no Pecatho Fans</p>
          <h1>{creator.display_name}</h1>
          <p className={styles.heroText}>{creator.bio || "Conteúdo exclusivo para quem deseja acompanhar de perto."}</p>
          <Link href="#assinaturas" className={styles.primaryButton}>Ver opções de assinatura</Link>
        </div>
      </section>

      <section id="assinaturas" className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Acesso exclusivo</p><h2>Assinaturas</h2></div></div>
        {plans && plans.length > 0 ? (
          <div className={styles.planGrid}>
            {plans.map((plan) => (
              <article key={plan.id} className={styles.planCard}>
                <span className={styles.planLabel}>ASSINATURA</span>
                <h3>{plan.name}</h3>
                <strong>{formatMoney(Number(plan.price), plan.currency)} <small>/ {plan.duration_days} dias</small></strong>
                <p>{plan.description || "Acesso aos conteúdos exclusivos deste criador."}</p>
                <Link href="/fans/entrar" className={styles.secondaryButton}>Assinar</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}><h3>Assinaturas em preparação</h3><p>Este criador ainda não publicou um plano de assinatura.</p></div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Publicações</p><h2>Conteúdo gratuito</h2></div></div>
        {posts && posts.length > 0 ? (
          <div className={styles.postGrid}>
            {posts.map((post) => (
              <article key={post.id} className={styles.postCard}>
                <span className={styles.freeBadge}>GRATUITO</span>
                <h3>{post.title}</h3>
                <p>{post.body || "Publicação disponível para todos."}</p>
                <span>{post.published_at ? new Intl.DateTimeFormat("pt-BR").format(new Date(post.published_at)) : "Publicado recentemente"}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}><h3>Nenhuma publicação gratuita</h3><p>Os conteúdos exclusivos ficam disponíveis conforme as regras de acesso definidas pelo criador.</p></div>
        )}
      </section>

      <footer className={styles.footer}>Pecatho Fans · Conteúdo adulto destinado exclusivamente a maiores de 18 anos.</footer>
    </main>
  );
}
