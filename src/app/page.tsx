import Link from "next/link";

const categories = [
  ["01", "Anunciantes", "Descubra perfis por categoria, localização e características."],
  ["02", "Conteúdo Fans", "Acompanhe criadores, publicações e experiências exclusivas."],
  ["03", "Relacionamento", "Mensagens, avaliações, seguidores e interação em um só ecossistema."],
  ["04", "Confiança", "Verificação, moderação e proteção pensadas para uma plataforma adulta séria."],
];

const highlights = [
  ["Descoberta inteligente", "Filtros e informações estruturadas para encontrar exatamente o que procura."],
  ["Perfis completos", "Apresentação profissional, mídia, serviços, disponibilidade e localização aproximada."],
  ["Experiência Fans", "Publicações, planos, assinaturas, compras e relacionamento com criadores."],
  ["Comércio protegido", "Pedidos, pagamentos, recebimentos e rastreabilidade preparados para crescer com segurança."],
];

export default function HomePage() {
  return (
    <main className="homePage">
      <style>{`
        .homePage{min-height:100vh;background:radial-gradient(circle at 75% 5%,rgba(116,126,255,.13),transparent 28%),radial-gradient(circle at 15% 30%,rgba(255,255,255,.045),transparent 30%),#08090d;color:#f6f7fb}
        .homeWrap{max-width:1240px;margin:auto;padding:0 28px}
        .homeNav{height:78px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.08)}
        .homeBrand{display:flex;align-items:center;gap:11px;font-size:21px;font-weight:800;letter-spacing:-.04em}.homeMark{width:35px;height:35px;border-radius:11px;display:grid;place-items:center;background:#fff;color:#08090d;font-weight:900}
        .homeNavLinks{display:flex;align-items:center;gap:22px;font-size:13px}.homeNavLinks a{color:#aeb3c2;text-decoration:none}.homeNavLinks a:hover{color:#fff}.homeNavCta{border:1px solid rgba(255,255,255,.16);border-radius:10px;padding:10px 15px;color:#fff!important}
        .homeHero{padding:92px 0 72px;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(330px,.8fr);gap:70px;align-items:end}.homeEyebrow{font-size:10px;font-weight:850;letter-spacing:.18em;color:#858d9e;margin-bottom:18px}.homeHero h1{font-size:clamp(48px,6.5vw,82px);line-height:.96;letter-spacing:-.07em;margin:0 0 25px;max-width:850px}.homeHero h1 em{font-style:normal;color:#9299aa}.homeLead{font-size:18px;line-height:1.7;color:#aeb4c1;max-width:720px;margin:0}.homeActions{display:flex;gap:10px;margin-top:32px;flex-wrap:wrap}.homePrimary,.homeSecondary{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 19px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:750}.homePrimary{background:#fff;color:#08090d}.homeSecondary{border:1px solid rgba(255,255,255,.16);color:#fff}.heroPanel{border:1px solid rgba(255,255,255,.1);border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.018));padding:23px;box-shadow:0 25px 80px rgba(0,0,0,.25)}.heroPanelTop{display:flex;justify-content:space-between;align-items:center;color:#777f90;font-size:10px;letter-spacing:.12em}.liveDot{width:7px;height:7px;border-radius:50%;background:#9be7b2;box-shadow:0 0 14px rgba(155,231,178,.55)}.heroPanel h2{font-size:25px;letter-spacing:-.04em;margin:30px 0 9px}.heroPanel p{color:#8f97a7;font-size:13px;line-height:1.6;margin:0}.panelLinks{display:grid;gap:8px;margin-top:22px}.panelLinks a{display:flex;justify-content:space-between;align-items:center;padding:13px 14px;border:1px solid rgba(255,255,255,.08);border-radius:10px;color:#dfe2e8;text-decoration:none;font-size:12px;background:rgba(255,255,255,.025)}.panelLinks span{color:#686f7f}
        .sectionHead{display:flex;justify-content:space-between;align-items:end;gap:20px;margin:15px 0 22px}.sectionHead h2{font-size:31px;letter-spacing:-.05em;margin:0}.sectionHead p{max-width:540px;color:#858d9d;font-size:13px;line-height:1.6;margin:0;text-align:right}
        .categoryGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.categoryCard{min-height:190px;border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:20px;background:rgba(255,255,255,.025);transition:transform .18s ease,border-color .18s ease}.categoryCard:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.2)}.categoryNo{font-size:10px;color:#686f7e;letter-spacing:.12em}.categoryCard h3{font-size:18px;margin:47px 0 8px;letter-spacing:-.025em}.categoryCard p{font-size:12px;line-height:1.55;color:#858d9d;margin:0}
        .experience{margin:90px 0 0;padding:58px 0;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08)}.experienceGrid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start}.experience h2{font-size:42px;line-height:1.02;letter-spacing:-.06em;margin:0 0 17px}.experienceIntro{color:#8e96a5;font-size:14px;line-height:1.7;max-width:510px;margin:0}.highlightGrid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.highlight{border:1px solid rgba(255,255,255,.08);border-radius:13px;padding:18px;background:rgba(255,255,255,.02)}.highlight strong{font-size:13px}.highlight p{font-size:11px;line-height:1.55;color:#777f90;margin:8px 0 0}
        .fansBanner{margin:72px 0 35px;border:1px solid rgba(255,255,255,.11);border-radius:22px;padding:35px;display:flex;align-items:center;justify-content:space-between;gap:35px;background:linear-gradient(110deg,rgba(255,255,255,.06),rgba(255,255,255,.018))}.fansBanner h2{font-size:29px;letter-spacing:-.05em;margin:0 0 9px}.fansBanner p{color:#8b93a3;font-size:13px;line-height:1.6;margin:0;max-width:650px}.fansBanner a{flex:0 0 auto}.homeFooter{display:flex;justify-content:space-between;padding:24px 0 42px;color:#5f6776;font-size:11px}
        @media(max-width:900px){.homeHero{grid-template-columns:1fr;gap:35px}.categoryGrid{grid-template-columns:1fr 1fr}.experienceGrid{grid-template-columns:1fr;gap:35px}.sectionHead{align-items:start;flex-direction:column}.sectionHead p{text-align:left}.fansBanner{align-items:flex-start;flex-direction:column}}
        @media(max-width:560px){.homeWrap{padding:0 17px}.homeNavLinks a:not(.homeNavCta){display:none}.homeHero{padding:65px 0 55px}.homeHero h1{font-size:48px}.homeLead{font-size:16px}.homeActions{flex-direction:column}.homePrimary,.homeSecondary{width:100%}.categoryGrid,.highlightGrid{grid-template-columns:1fr}.categoryCard{min-height:155px}.categoryCard h3{margin-top:32px}.experience{margin-top:65px;padding:45px 0}.experience h2{font-size:35px}.fansBanner{padding:25px;margin-top:55px}.homeFooter{gap:15px;flex-direction:column}}
      `}</style>

      <div className="homeWrap">
        <nav className="homeNav">
          <Link href="/" className="homeBrand"><span className="homeMark">P</span><span>Pecatho</span></Link>
          <div className="homeNavLinks">
            <Link href="/anunciantes">Anunciantes</Link>
            <Link href="/fans">Fans</Link>
            <Link href="/como-funciona">Como funciona</Link>
            <Link href="/login" className="homeNavCta">Entrar</Link>
          </div>
        </nav>

        <section className="homeHero">
          <div>
            <div className="homeEyebrow">PECATHO · UM ECOSSISTEMA</div>
            <h1>Descubra. <em>Conecte.</em> Viva a experiência Pecatho.</h1>
            <p className="homeLead">Uma plataforma adulta moderna para descobrir anunciantes, conhecer perfis completos e conectar experiências com mais informação, confiança e liberdade.</p>
            <div className="homeActions">
              <Link className="homePrimary" href="/anunciantes">Explorar anunciantes</Link>
              <Link className="homeSecondary" href="/fans">Conhecer Fans</Link>
              <Link className="homeSecondary" href="/cadastro">Criar minha conta</Link>
            </div>
          </div>
          <aside className="heroPanel">
            <div className="heroPanelTop"><span>EXPERIÊNCIA PECATHO</span><span className="liveDot" /></div>
            <h2>Encontre o que procura.</h2>
            <p>O catálogo está sendo estruturado para que localização, categoria, características, serviços e apresentação trabalhem juntos — sem perder a riqueza do Pecatho original.</p>
            <div className="panelLinks">
              <Link href="/anunciantes"><span>01</span> Explorar catálogo <span>→</span></Link>
              <Link href="/cadastro"><span>02</span> Criar perfil <span>→</span></Link>
              <Link href="/fans"><span>03</span> Entrar no universo Fans <span>→</span></Link>
            </div>
          </aside>
        </section>

        <section>
          <div className="sectionHead">
            <div><div className="homeEyebrow">DESCUBRA O ECOSSISTEMA</div><h2>Mais do que um catálogo.</h2></div>
            <p>O Pecatho reúne descoberta, relacionamento, conteúdo e comércio em uma experiência contínua — com a base de confiança necessária para uma plataforma adulta profissional.</p>
          </div>
          <div className="categoryGrid">
            {categories.map(([no,title,text]) => <article className="categoryCard" key={title}><div className="categoryNo">{no}</div><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section className="experience">
          <div className="experienceGrid">
            <div>
              <div className="homeEyebrow">UMA NOVA EXPERIÊNCIA</div>
              <h2>Construído para ser melhor, não apenas diferente.</h2>
              <p className="experienceIntro">A evolução do Pecatho mantém a profundidade funcional do sistema legado e moderniza a experiência: informação estruturada, navegação responsiva, segurança, moderação, pagamentos e novas possibilidades para anunciantes, usuários e criadores.</p>
            </div>
            <div className="highlightGrid">
              {highlights.map(([title,text]) => <article className="highlight" key={title}><strong>{title}</strong><p>{text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="fansBanner">
          <div>
            <div className="homeEyebrow">PECATHO FANS</div>
            <h2>Seu conteúdo. Seu público. Seu negócio.</h2>
            <p>O Fans faz parte do mesmo ecossistema Pecatho, com identidade compartilhada e uma experiência própria para criadores, assinantes, publicações, planos e transações.</p>
          </div>
          <Link className="homePrimary" href="/fans">Explorar Fans →</Link>
        </section>

        <footer className="homeFooter"><span>© {new Date().getFullYear()} Pecatho</span><span>Uma plataforma em evolução contínua.</span></footer>
      </div>
    </main>
  );
}
