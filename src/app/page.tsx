import Link from "next/link";

const pillars = [
  ["Anunciantes", "Perfis, publicação, categorias, localização e descoberta."],
  ["Relacionamento", "Mensagens, seguidores, avaliações, feedback e denúncias."],
  ["Comercial", "Planos, pedidos, pagamentos, créditos, cupons e afiliados."],
  ["Confiança", "Verificação, moderação, auditoria, segurança e antifraude."],
];

export default function HomePage() {
  return (
    <main className="shell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div>
        <div className="navLinks">
          <Link href="/anunciantes">Anunciantes</Link><Link href="/como-funciona">Como funciona</Link><Link href="/login" className="navCta">Entrar</Link>
        </div>
      </nav>
      <section className="hero">
        <div className="eyebrow">ECOSSISTEMA PECATHO</div>
        <h1>Uma plataforma. <em>Um ecossistema.</em></h1>
        <p className="heroCopy">A nova arquitetura do Pecatho preserva a profundidade do sistema existente e prepara uma base segura, escalável e preparada para a próxima geração de produtos.</p>
        <div className="heroActions"><Link className="primaryButton" href="/anunciantes">Explorar anunciantes</Link><Link className="secondaryButton" href="/cadastro">Criar conta</Link></div>
      </section>
      <section className="pillars">{pillars.map(([title,text])=><article className="card" key={title}><div className="cardIcon">{title[0]}</div><h2>{title}</h2><p>{text}</p></article>)}</section>
      <section className="ecosystem"><div><div className="eyebrow">ARQUITETURA EVOLUTIVA</div><h2>O Pecatho principal vem primeiro.</h2><p>O Fans será incorporado posteriormente como um domínio funcional do mesmo ecossistema, compartilhando identidade, confiança, pagamentos e infraestrutura sem transformar os produtos em sistemas independentes.</p></div><div className="architecture"><span>Pecatho</span><b>→</b><span>Identidade</span><b>→</b><span>Confiança</span><b>→</b><span>Comercial</span></div></section>
      <footer><span>© {new Date().getFullYear()} Pecatho</span><span>Construído para evoluir.</span></footer>
    </main>
  );
}