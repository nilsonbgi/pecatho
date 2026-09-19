"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const categories = [
  ["01", "Anunciantes", "Perfis, categorias, localização, características, serviços e disponibilidade."],
  ["02", "Pecatho Fans", "Criadores, publicações, assinaturas e experiências exclusivas."],
  ["03", "Conexões", "Mensagens, avaliações, favoritos e relacionamento em um só ecossistema."],
  ["04", "Confiança", "Verificação, moderação, privacidade e ferramentas de proteção."],
];

const highlights = [
  ["Descoberta inteligente", "Filtros e informações organizadas para encontrar o perfil adequado."],
  ["Perfis que valorizam pessoas", "Galeria, apresentação, serviços, valores e localização aproximada."],
  ["Experiência Fans", "Publicações, planos, assinaturas, compras e relacionamento com criadores."],
  ["Estrutura comercial", "Pagamentos, recebimentos, histórico, notificações e rastreabilidade."],
];

export default function HomePage() {
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);

  useEffect(() => {
    setAgeVerified(window.localStorage.getItem("pecatho_age_verified") === "true");
  }, []);

  function confirmAge() {
    window.localStorage.setItem("pecatho_age_verified", "true");
    setAgeVerified(true);
  }

  function leaveAgeRestrictedSite() {
    window.location.href = "https://www.google.com";
  }

  return (
    <main className="pecathoHome">
      {ageVerified === false && (
        <div className="pAgeGate" role="dialog" aria-modal="true" aria-labelledby="pecatho-age-title">
          <div className="pAgeCard">
            <div className="pAgeMark">18+</div>
            <div className="pAgeKicker">ACESSO RESTRITO</div>
            <h2 id="pecatho-age-title">Conteúdo destinado a maiores de 18 anos</h2>
            <p>O Pecatho reúne anúncios e experiências de natureza adulta. Para continuar, você deve confirmar que possui 18 anos ou mais e que o acesso a esse conteúdo é permitido no local onde se encontra.</p>
            <div className="pAgeWarning"><strong>⚠ Aviso:</strong> este ambiente pode apresentar conteúdo sexualmente explícito. Se você tiver menos de 18 anos, não prossiga.</div>
            <div className="pAgeActions"><button type="button" className="pAgeEnter" onClick={confirmAge}>TENHO 18 ANOS OU MAIS · ENTRAR</button><button type="button" className="pAgeLeave" onClick={leaveAgeRestrictedSite}>SAIR</button></div>
            <div className="pAgeLegal">Ao entrar, você confirma sua maioridade. A confirmação é armazenada neste navegador para evitar a repetição do aviso em acessos futuros.</div>
          </div>
        </div>
      )}
      <style>{`
        .pecathoHome{min-height:100vh;background:#07080c;color:#f7f7fa;overflow:hidden}
        .pecathoHome *{box-sizing:border-box}
        .pWrap{width:min(1240px,100%);margin:0 auto;padding:0 28px}
        .pNav{height:84px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.09);position:relative;z-index:2}
        .pBrand{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none;font-size:24px;font-weight:850;letter-spacing:-.06em}
        .pLogo{width:39px;height:39px;border:1px solid rgba(255,255,255,.28);border-radius:13px;display:grid;place-items:center;background:linear-gradient(145deg,#fff,#b9bdc8);color:#090a0f;font-size:22px;font-weight:950;box-shadow:0 0 35px rgba(255,255,255,.08)}
        .pNavLinks{display:flex;align-items:center;gap:25px;font-size:13px}.pNavLinks a{color:#a8adba;text-decoration:none;transition:color .2s}.pNavLinks a:hover{color:#fff}.pNavLinks .pNavCta{color:#08090d;background:#f5f5f7;border-radius:10px;padding:11px 17px;font-weight:800}
        .pHero{position:relative;padding:92px 0 86px;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(350px,.88fr);gap:70px;align-items:center}
        .pHero:before{content:"";position:absolute;width:680px;height:680px;right:-250px;top:-300px;border-radius:50%;background:radial-gradient(circle,rgba(170,120,255,.19),transparent 68%);pointer-events:none}
        .pEyebrow{font-size:10px;font-weight:850;letter-spacing:.22em;color:#8e94a5;text-transform:uppercase;margin-bottom:20px}.pHero h1{font-size:clamp(48px,6.5vw,82px);line-height:.96;letter-spacing:-.075em;max-width:800px;margin:0 0 27px}.pHero h1 em{font-style:normal;background:linear-gradient(110deg,#fff 5%,#a7adff 48%,#d8a8ff 90%);-webkit-background-clip:text;background-clip:text;color:transparent}.pLead{max-width:650px;color:#a7adbc;font-size:17px;line-height:1.75;margin:0}.pActions{display:flex;gap:11px;flex-wrap:wrap;margin-top:34px}.pPrimary,.pSecondary{min-height:49px;display:inline-flex;align-items:center;justify-content:center;padding:0 19px;border-radius:11px;text-decoration:none;font-size:13px;font-weight:800;transition:transform .2s,border-color .2s}.pPrimary{background:#f4f4f6;color:#08090d}.pSecondary{border:1px solid rgba(255,255,255,.17);color:#fff;background:rgba(255,255,255,.025)}.pPrimary:hover,.pSecondary:hover{transform:translateY(-2px)}
        .pShowcase{position:relative;border:1px solid rgba(255,255,255,.13);border-radius:25px;padding:22px;background:linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.018));box-shadow:0 30px 100px rgba(0,0,0,.38);overflow:hidden}.pShowcase:after{content:"";position:absolute;inset:auto -100px -170px auto;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(116,126,255,.22),transparent 70%)}.pShowTop{display:flex;justify-content:space-between;align-items:center;color:#858c9c;font-size:10px;letter-spacing:.14em}.pStatus{display:flex;align-items:center;gap:8px}.pDot{width:7px;height:7px;border-radius:50%;background:#a4edbf;box-shadow:0 0 16px rgba(164,237,191,.65)}.pShowcase h2{font-size:31px;line-height:1.05;letter-spacing:-.055em;margin:43px 0 12px;max-width:300px}.pShowcase p{font-size:13px;line-height:1.65;color:#969dad;margin:0;max-width:350px}.pMiniGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:25px}.pMini{border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:15px;background:rgba(0,0,0,.16)}.pMini span{display:block;color:#777f91;font-size:10px;margin-bottom:9px}.pMini strong{font-size:13px;letter-spacing:-.02em}.pShowLinks{display:grid;gap:9px;margin-top:12px}.pShowLinks a{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025);border-radius:12px;padding:14px;color:#e8e9ef;text-decoration:none;font-size:12px}.pShowLinks a span{color:#747c8d}
        .pSection{padding:20px 0 0}.pSectionHead{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:23px}.pSectionHead h2{font-size:35px;letter-spacing:-.06em;line-height:1.05;margin:0}.pSectionHead p{max-width:520px;color:#858d9e;font-size:13px;line-height:1.7;text-align:right;margin:0}.pCategoryGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.pCategory{min-height:215px;border:1px solid rgba(255,255,255,.1);border-radius:17px;padding:21px;background:linear-gradient(150deg,rgba(255,255,255,.045),rgba(255,255,255,.012));transition:transform .2s,border-color .2s}.pCategory:hover{transform:translateY(-4px);border-color:rgba(190,178,255,.45)}.pCategoryNo{font-size:10px;color:#737b8d;letter-spacing:.15em}.pCategory h3{font-size:20px;letter-spacing:-.04em;margin:65px 0 9px}.pCategory p{font-size:12px;line-height:1.6;color:#858d9e;margin:0}
        .pExperience{margin-top:100px;padding:65px 0;border-top:1px solid rgba(255,255,255,.09);border-bottom:1px solid rgba(255,255,255,.09)}.pExperienceGrid{display:grid;grid-template-columns:1fr 1fr;gap:65px}.pExperience h2{font-size:46px;line-height:1.02;letter-spacing:-.07em;margin:0 0 20px}.pExperienceIntro{font-size:14px;line-height:1.8;color:#929aaa;max-width:520px;margin:0}.pHighlightGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pHighlight{border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:19px;background:rgba(255,255,255,.025)}.pHighlight strong{font-size:13px}.pHighlight p{font-size:11px;line-height:1.65;color:#7f8798;margin:9px 0 0}
        .pFans{margin:72px 0 35px;border:1px solid rgba(255,255,255,.13);border-radius:24px;padding:36px;display:flex;align-items:center;justify-content:space-between;gap:30px;background:linear-gradient(110deg,rgba(130,112,255,.13),rgba(255,255,255,.035) 60%,rgba(255,255,255,.015));position:relative;overflow:hidden}.pFans:after{content:"";position:absolute;right:-80px;top:-150px;width:360px;height:360px;border-radius:50%;border:1px solid rgba(210,190,255,.15);box-shadow:0 0 0 35px rgba(210,190,255,.035),0 0 0 70px rgba(210,190,255,.025)}.pFans h2{font-size:31px;letter-spacing:-.06em;margin:0 0 11px}.pFans p{font-size:13px;line-height:1.7;color:#949cad;max-width:680px;margin:0}.pFans a{position:relative;z-index:1;flex:0 0 auto}.pFooter{display:flex;justify-content:space-between;gap:20px;padding:25px 0 42px;color:#626b7c;font-size:11px}
        @media(max-width:950px){.pHero{grid-template-columns:1fr;gap:35px}.pShowcase{max-width:650px}.pCategoryGrid{grid-template-columns:1fr 1fr}.pSectionHead{align-items:start;flex-direction:column}.pSectionHead p{text-align:left}.pExperienceGrid{grid-template-columns:1fr;gap:38px}.pFans{align-items:flex-start;flex-direction:column}}
        @media(max-width:560px){.pWrap{padding:0 17px}.pNav{height:72px}.pNavLinks{gap:10px}.pNavLinks a:not(.pNavCta){display:none}.pHero{padding:64px 0 55px}.pHero h1{font-size:49px}.pLead{font-size:16px}.pActions{flex-direction:column}.pPrimary,.pSecondary{width:100%}.pCategoryGrid,.pHighlightGrid{grid-template-columns:1fr}.pCategory{min-height:170px}.pCategory h3{margin-top:42px}.pExperience{margin-top:65px;padding:45px 0}.pExperience h2{font-size:36px}.pFans{padding:26px;margin-top:55px}.pFans h2{font-size:27px}.pFooter{flex-direction:column}}
        .pAgeGate{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.84);backdrop-filter:blur(14px)}.pAgeCard{width:min(570px,100%);border:1px solid rgba(231,195,63,.28);border-radius:25px;padding:34px;background:radial-gradient(circle at 50% 0,rgba(231,195,63,.11),transparent 42%),linear-gradient(145deg,#12110e,#080808);box-shadow:0 40px 120px rgba(0,0,0,.65);text-align:center}.pAgeMark{width:58px;height:58px;border-radius:17px;border:1px solid rgba(231,195,63,.55);display:grid;place-items:center;margin:0 auto 18px;color:#e7c33f;font-size:27px;font-weight:950;background:rgba(231,195,63,.07)}.pAgeKicker{color:#e7c33f;font-size:10px;font-weight:900;letter-spacing:.2em}.pAgeCard h2{font-size:34px;letter-spacing:-.055em;margin:10px 0 12px}.pAgeCard p{font-size:13px;line-height:1.75;color:#a19b91;margin:0 auto;max-width:470px}.pAgeWarning{margin:20px 0;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;background:rgba(255,255,255,.025);color:#d8d2c7;font-size:11px;line-height:1.65}.pAgeActions{display:flex;gap:10px;justify-content:center;margin-top:22px}.pAgeActions button{min-height:48px;border-radius:11px;padding:0 19px;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.pAgeEnter{border:0;background:linear-gradient(135deg,#f3d06a,#dcae31);color:#111}.pAgeLeave{border:1px solid rgba(255,255,255,.12);background:transparent;color:#c2bdb3}.pAgeLegal{margin-top:15px;color:#68645d;font-size:9px;line-height:1.6}@media(max-width:560px){.pAgeCard{padding:28px 20px}.pAgeCard h2{font-size:29px}.pAgeActions{flex-direction:column}.pAgeActions button{width:100%}}\n        .pecathoHome{background:radial-gradient(circle at 70% 0,rgba(231,195,63,.10),transparent 30%),#070707}.pNav{border-bottom-color:rgba(231,195,63,.11)}.pBrand{color:#f1c84b}.pLogo{border-color:rgba(231,195,63,.58);background:linear-gradient(145deg,rgba(231,195,63,.2),rgba(231,195,63,.025));color:#e7c33f}.pNavLinks a:hover{color:#e7c33f}.pNavLinks .pNavCta{background:linear-gradient(135deg,#f3d06a,#dcae31);color:#111}.pHero:before{background:radial-gradient(circle,rgba(231,195,63,.14),transparent 68%)}.pHero h1 em{color:#e7c33f;background:none}.pEyebrow{color:#e7c33f}.pPrimary{background:linear-gradient(135deg,#f3d06a,#dcae31);color:#111;box-shadow:0 12px 30px rgba(231,195,63,.14)}.pSecondary{border-color:rgba(231,195,63,.28);color:#e7c33f;background:rgba(231,195,63,.035)}.pShowcase{border-color:rgba(231,195,63,.18);background:linear-gradient(145deg,rgba(231,195,63,.08),rgba(255,255,255,.018))}.pShowcase:after{background:radial-gradient(circle,rgba(231,195,63,.14),transparent 70%)}.pCategory{border-color:rgba(231,195,63,.13);background:linear-gradient(150deg,rgba(231,195,63,.045),rgba(255,255,255,.012))}.pCategory:hover{border-color:rgba(231,195,63,.38)}.pCategoryNo{color:#e7c33f}.pFans{border-color:rgba(231,195,63,.18);background:linear-gradient(110deg,rgba(231,195,63,.10),rgba(255,255,255,.035) 60%,rgba(255,255,255,.015))}.pFans:after{border-color:rgba(231,195,63,.15)}\n      `}</style>

      <div className="pWrap">
        <nav className="pNav">
          <Link href="/" className="pBrand"><span className="pLogo">P</span><span>Pecatho</span></Link>
          <div className="pNavLinks"><Link href="/anunciantes">Anunciantes</Link><Link href="/fans">Fans</Link><Link href="/como-funciona">Como funciona</Link><Link href="/login" className="pNavCta">Entrar</Link></div>
        </nav>

        <section className="pHero">
          <div>
            <div className="pEyebrow">PECATHO · CONEXÕES QUE DESPERTAM</div>
            <h1>Descubra. <em>Conecte.</em><br />Viva Pecatho.</h1>
            <p className="pLead">Uma experiência adulta moderna para descobrir anunciantes, conhecer criadores, acompanhar conteúdos e estabelecer conexões com mais liberdade, informação e confiança.</p>
            <div className="pActions"><Link className="pPrimary" href="/anunciantes">Explorar anunciantes ↗</Link><Link className="pSecondary" href="/fans">Conhecer Pecatho Fans</Link><Link className="pSecondary" href="/cadastro">Criar minha conta</Link></div>
          </div>
          <aside className="pShowcase">
            <div className="pShowTop"><span>EXPERIÊNCIA PECATHO</span><span className="pStatus"><i className="pDot" /> ONLINE</span></div>
            <h2>O seu próximo encontro começa com uma descoberta.</h2>
            <p>Uma plataforma pensada para valorizar perfis, conteúdo, autonomia e relacionamento — em uma experiência elegante e responsiva.</p>
            <div className="pMiniGrid"><div className="pMini"><span>01 · CATÁLOGO</span><strong>Perfis e descobertas</strong></div><div className="pMini"><span>02 · CONTEÚDO</span><strong>Fans e criadores</strong></div></div>
            <div className="pShowLinks"><Link href="/anunciantes"><span>01</span> Explorar catálogo <span>→</span></Link><Link href="/cadastro"><span>02</span> Criar perfil <span>→</span></Link><Link href="/fans"><span>03</span> Entrar no universo Fans <span>→</span></Link></div>
          </aside>
        </section>

        <section className="pSection"><div className="pSectionHead"><div><div className="pEyebrow">UM ECOSSISTEMA COMPLETO</div><h2>Mais do que um catálogo.</h2></div><p>Descoberta, relacionamento, conteúdo e estrutura comercial em uma experiência contínua, construída para anunciantes, criadores e usuários.</p></div><div className="pCategoryGrid">{categories.map(([no,title,text])=><article className="pCategory" key={title}><div className="pCategoryNo">{no}</div><h3>{title}</h3><p>{text}</p></article>)}</div></section>

        <section className="pExperience"><div className="pExperienceGrid"><div><div className="pEyebrow">EVOLUÇÃO CONTÍNUA</div><h2>Construído para ser melhor, não apenas diferente.</h2><p className="pExperienceIntro">O Pecatho preserva a profundidade funcional já construída e transforma a apresentação em uma experiência mais atraente: navegação clara, perfis valorizados, segurança, moderação, pagamentos, notificações e novas possibilidades comerciais.</p></div><div className="pHighlightGrid">{highlights.map(([title,text])=><article className="pHighlight" key={title}><strong>{title}</strong><p>{text}</p></article>)}</div></div></section>

        <section className="pFans"><div><div className="pEyebrow">PECATHO FANS</div><h2>Seu conteúdo. Seu público. Seu negócio.</h2><p>Uma experiência própria para criadores e assinantes, com publicações, planos, assinaturas, compras, relacionamento e identidade integrada ao ecossistema Pecatho.</p></div><Link className="pPrimary" href="/fans">Explorar Fans →</Link></section>
        <footer className="pFooter"><span>© {new Date().getFullYear()} Pecatho</span><span>Conexões, conteúdo e experiências em evolução.</span></footer>
      </div>
    </main>
  );
}
