import Link from "next/link";

const steps = [
  ["01", "Descubra", "Explore anunciantes por categoria e localização e encontre perfis completos, com informações claras para decidir com segurança."],
  ["02", "Conecte-se", "Acesse os canais de relacionamento disponíveis, acompanhe perfis e mantenha sua experiência dentro do ecossistema Pecatho."],
  ["03", "Escolha", "Compare informações, planos e conteúdos antes de contratar. A experiência é construída para reduzir atrito e aumentar confiança."],
  ["04", "Continue", "No Fans, acompanhe criadores, assine planos e acesse publicações em uma experiência integrada à mesma identidade Pecatho."],
];

const advantages = [
  ["Descoberta", "Busca e catálogo preparados para evoluir com categorias, localização, atributos e serviços estruturados."],
  ["Experiência", "Perfis públicos mais completos, responsivos e orientados à conversão, sem sacrificar informação."],
  ["Confiança", "Verificação, moderação, proteção de conteúdo, rastreabilidade e controles de acesso fazem parte da arquitetura."],
  ["Ecossistema", "Anunciantes e Fans compartilham identidade e infraestrutura, permitindo uma evolução contínua da plataforma."],
];

export default function ComoFuncionaPage() {
  return (
    <main className="shell">
      <nav className="topbar">
        <Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link>
        <div className="navLinks">
          <Link href="/anunciantes">Anunciantes</Link>
          <Link href="/fans">Fans</Link>
          <Link href="/cadastro" className="navCta">Criar conta</Link>
        </div>
      </nav>
      <section className="hero" style={{ maxWidth: "920px" }}>
        <div className="eyebrow">COMO FUNCIONA</div>
        <h1>Menos atrito.<br /><em>Mais experiência.</em></h1>
        <p className="heroCopy">O Pecatho reúne descoberta, relacionamento e experiências comerciais em um único ecossistema. A proposta é simples para quem usa e robusta onde realmente importa.</p>
        <div className="heroActions"><Link className="primaryButton" href="/anunciantes">Explorar anunciantes</Link><Link className="secondaryButton" href="/fans">Conhecer Fans</Link></div>
      </section>
      <section className="featureGrid" aria-label="Jornada Pecatho">
        {steps.map(([number, title, text]) => <article className="card featureCard" key={number}><span className="featureNumber">{number}</span><h2>{title}</h2><p>{text}</p></article>)}
      </section>
      <section className="ecosystem">
        <div><div className="eyebrow">POR QUE PECATHO</div><h2>Uma experiência construída para crescer.</h2><p>Em vez de separar recursos em produtos desconectados, o Pecatho evolui uma base única para anunciantes, clientes, criadores e parceiros. Isso permite ampliar recursos sem perder contexto, histórico ou confiança.</p></div>
        <div className="advantageGrid">{advantages.map(([title, text]) => <div className="advantage" key={title}><strong>{title}</strong><span>{text}</span></div>)}</div>
      </section>
      <section className="ctaPanel">
        <div><div className="eyebrow">PRÓXIMO PASSO</div><h2>Encontre o que procura.</h2><p>Comece pela descoberta pública ou crie sua conta para acessar uma experiência completa.</p></div>
        <div className="heroActions"><Link className="primaryButton" href="/anunciantes">Ver anunciantes</Link><Link className="secondaryButton" href="/cadastro">Criar conta</Link></div>
      </section>
      <footer><span>© {new Date().getFullYear()} Pecatho</span><span>Construído para evoluir.</span></footer>
    </main>
  );
}
