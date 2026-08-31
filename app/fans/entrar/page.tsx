import Link from "next/link";
import styles from "../fans.module.css";

export default function FansLoginPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/fans" className={styles.brand}>Pecatho <span>Fans</span></Link>
        <Link href="/fans" className={styles.navCta}>Voltar</Link>
      </header>
      <section className={styles.profileHero} style={{ minHeight: "70vh" }}>
        <div>
          <p className={styles.eyebrow}>Acesso seguro</p>
          <h1>Entre na sua conta Pecatho.</h1>
          <p className={styles.heroText}>
            O acesso do Pecatho Fans utiliza a mesma identidade da plataforma Pecatho. Isto mantém sua conta única sem misturar as funções do serviço de conteúdo.
          </p>
          <Link href="/login" className={styles.primaryButton}>Ir para o login</Link>
        </div>
      </section>
    </main>
  );
}
