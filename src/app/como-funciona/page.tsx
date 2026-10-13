import Link from "next/link";

const journey = [
  { number: "01", title: "Descubra perfis", text: "Explore anunciantes, criadores Fans e parceiros. Leia a apresentação, confira os serviços e conteúdos oferecidos e avalie as informações antes de iniciar uma conversa ou realizar uma compra." },
  { number: "02", title: "Crie sua conta", text: "Use o cadastro para acessar os recursos que exigem autenticação. Mantenha seus dados de acesso privados e informe apenas dados verdadeiros e necessários." },
  { number: "03", title: "Converse com respeito", text: "Use as mensagens para esclarecer dúvidas e combinar detalhes. Respeite limites, privacidade, consentimento e as condições publicadas por cada perfil." },
  { number: "04", title: "Escolha a experiência", text: "Acompanhe criadores, consulte planos e publicações Fans, conheça estabelecimentos parceiros ou compre conteúdos digitais disponíveis para venda." },
];

const features = [
  { id: "anunciantes", title: "Anunciantes e acompanhantes", text: "Os perfis podem apresentar descrição, localização aproximada, serviços, disponibilidade, períodos e preços, formas de contato e mídias aprovadas. Consulte cada perfil: disponibilidade e condições são definidas pelo próprio anunciante. O contato não significa que uma contratação foi confirmada." },
  { id: "parceiros", title: "Parceiros e estabelecimentos", text: "Consulte páginas de casas, bares, lounges e outros estabelecimentos cadastrados. Confira estrutura, diferenciais, localização e contatos publicados. O Pecatho não garante a qualidade de uma experiência apenas porque um perfil está publicado; confirme as condições diretamente com o estabelecimento." },
  { id: "fans", title: "Pecatho Fans: criadores, planos e publicações", text: "A área Fans permite descobrir criadores, visualizar seus perfis e, conforme a oferta disponível, assinar planos ou acessar publicações. Conteúdos exclusivos dependem das permissões da conta e da situação da compra ou assinatura." },
  { id: "conteudos", title: "Compra de conteúdos digitais", text: "Confira a descrição, o preço e o que está incluído antes de comprar. O acesso a arquivos pagos é liberado conforme a confirmação da transação e as regras da oferta. Não compartilhe links privados, arquivos adquiridos ou credenciais de acesso sem autorização." },
  { id: "mensagens", title: "Mensagens e relacionamento", text: "Acesse o painel de mensagens para continuar conversas disponíveis na sua conta. Mensagens, reações e indicadores de presença podem depender da conexão e das permissões da conversa. Não envie spam, ameaças, conteúdo ilegal ou arquivos destinados a enganar, intimidar ou expor outra pessoa." },
  { id: "presentes", title: "Presentes e recursos de apoio", text: "Quando um recurso de presente estiver disponível, confira o valor e os detalhes exibidos antes de confirmar. Uma confirmação visual não substitui o comprovante da transação; em caso de divergência, procure os canais de suporte disponíveis no site." },
  { id: "pagamentos", title: "Pagamentos, cancelamentos e reembolsos", text: "Leia as condições apresentadas antes de confirmar uma compra. Compras de conteúdo digital e assinaturas podem seguir regras diferentes de contatos ou serviços combinados diretamente entre as partes. Não envie dinheiro para supostas taxas de desbloqueio, garantia ou liberação fora dos fluxos oficiais apresentados pela plataforma." },
  { id: "privacidade", title: "Privacidade, segurança e evidências", text: "Não publique endereço residencial, documentos, telefone ou conversas privadas de outra pessoa sem base legítima e autorização. Se precisar documentar um problema, preserve os registros originais e evite editar imagens de forma que altere o contexto. Não divulgue evidências publicamente: elas podem conter dados pessoais." },
];

const rules = [
  ["Respeite consentimento e limites", "Não pressione ninguém a aceitar contato, serviço, encontro, conteúdo ou prática que tenha recusado. Uma recusa deve ser respeitada."],
  ["Não ameace, assedie ou persiga", "Ameaças, chantagem, perseguição, intimidação, discurso de ódio e contato insistente após pedido para parar podem levar à restrição da conta."],
  ["Não aplique golpes nem falsifique informações", "São proibidos comprovantes falsos, fraude de pagamento, tentativa de chargeback fraudulento, falsa identidade, impersonação, extorsão e promessas enganosas."],
  ["Não exponha nem use indevidamente dados", "Não publique dados pessoais, documentos, localização privada ou conversas íntimas de terceiros para constranger, ameaçar ou retaliar."],
  ["Não compartilhe conteúdo sem autorização", "Não redistribua conteúdo pago ou privado, não publique imagens íntimas sem consentimento e não use material de outra pessoa para criar perfis falsos."],
  ["Não envie spam nem tente contornar controles", "Mensagens em massa não solicitadas, links maliciosos, automação abusiva, tentativa de acessar contas alheias e contorno de bloqueios ou decisões de moderação podem gerar medidas na conta."],
  ["Não use a plataforma para atividades ilegais", "Não publique ofertas ilegais, exploração, tráfico, coerção, conteúdo sexual envolvendo menores ou qualquer material que viole a lei. Conteúdo envolvendo menores em contexto sexual é proibido e pode ser encaminhado às autoridades competentes."],
  ["Não abuse de denúncias ou listas de bloqueio", "Não use denúncias para vingança, discriminação, intimidação ou concorrência desleal. Uma acusação deve ser honesta, específica e apoiada pelos fatos disponíveis."],
];

const faq = [
  ["O cadastro ou um perfil publicado garante que a outra pessoa é confiável?", "Não. Leia as informações disponíveis, use seu próprio critério e confirme os detalhes relevantes. Nunca compartilhe senhas, códigos de autenticação ou dados bancários para provar confiança."],
  ["O Pecatho paga antecipadamente por serviços de acompanhantes ou parceiros?", "Não trate um contato ou uma combinação de serviço como uma compra processada pelo Pecatho. As condições de serviços combinados diretamente devem ser esclarecidas entre as partes. Pagamentos dentro da plataforma devem ocorrer apenas nos fluxos oficiais explicitamente apresentados."],
  ["Quando recebo um conteúdo digital comprado?", "O acesso depende da confirmação da compra e da disponibilidade do produto. Entre na conta utilizada na compra e consulte o conteúdo ou a área correspondente. Se o acesso não for liberado após a confirmação, procure o suporte com os dados da transação."],
  ["Posso compartilhar conteúdo comprado com outras pessoas?", "Não, a menos que a oferta conceda expressamente esse direito. Conteúdos privados, exclusivos ou pagos não devem ser copiados, redistribuídos, gravados ou publicados sem autorização."],
  ["O que pode acontecer após uma violação das regras?", "Dependendo da gravidade, da repetição, do risco e das evidências disponíveis, podem ser aplicadas medidas como remoção de conteúdo, limitação de recursos, suspensão temporária ou encerramento de conta. Quando aplicável, a decisão deve ser proporcional e sujeita a revisão pelos canais de suporte disponíveis."],
  ["Como agir se alguém me ameaçar, tentar aplicar um golpe ou divulgar meus dados?", "Interrompa o contato se necessário, preserve mensagens e comprovantes originais, registre datas e contexto e evite publicar dados pessoais ou retaliar. Use os canais de suporte disponíveis na plataforma. Se houver perigo imediato ou possível crime, procure as autoridades competentes."],
  ["Uma acusação de outro usuário suspende automaticamente minha conta?", "Uma acusação isolada não deve ser tratada como prova conclusiva. A análise deve considerar o contexto e as evidências disponíveis, com medidas urgentes proporcionais quando houver risco à segurança."],
  ["O que devo fazer se discordar de uma decisão de moderação?", "Reúna informações objetivas, informe o motivo da contestação e encaminhe os registros pertinentes pelo canal de suporte disponível. Não crie novas contas para contornar uma restrição nem ameace quem participou da análise."],
];

export default function ComoFuncionaPage() {
  return (
    <main className="shell howPage">
      <nav className="topbar">
        <Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link>
        <div className="navLinks">
          <Link href="/anunciantes">Anunciantes</Link>
          <Link href="/parceiros">Parceiros</Link>
          <Link href="/fans">Fans</Link>
          <Link href="/cadastro" className="navCta">Criar conta</Link>
        </div>
      </nav>

      <section className="hero howHero">
        <div className="eyebrow">GUIA DA COMUNIDADE · PECATHO</div>
        <h1>Saiba como usar.<br /><em>Cuide da sua experiência.</em></h1>
        <p className="heroCopy">Encontre perfis, conheça criadores e parceiros, converse com respeito e entenda as regras que ajudam a manter a comunidade mais segura.</p>
        <div className="heroActions"><Link className="primaryButton" href="/anunciantes">Explorar anunciantes</Link><Link className="secondaryButton" href="/fans">Conhecer Fans</Link></div>
      </section>

      <nav className="howContents" aria-label="Navegação deste guia">
        <a href="#jornada">Como começar</a><a href="#funcionalidades">Funcionalidades</a><a href="#convivencia">Regras e Blacklist</a><a href="#duvidas">Perguntas frequentes</a><Link href="/painel/seguranca">Central de segurança</Link>
      </nav>

      <section id="jornada" className="howSection">
        <div className="eyebrow">PRIMEIROS PASSOS</div><h2>Uma jornada simples, com escolhas conscientes.</h2>
        <div className="howGrid">{journey.map((item) => <article className="card howCard" key={item.number}><span className="howNumber">{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section id="funcionalidades" className="howSection">
        <div className="eyebrow">RECURSOS DA PLATAFORMA</div><h2>O que você encontra no Pecatho.</h2>
        <div className="howFeatureGrid">{features.map((item) => <article className="card howFeature" id={item.id} key={item.id}><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section id="convivencia" className="howSection howRules">
        <div className="eyebrow">SEGURANÇA E GOVERNANÇA</div><h2>Condutas que podem levar a restrições ou à Blacklist.</h2>
        <p className="howLead">A segurança da comunidade depende de limites claros. As situações abaixo podem motivar análise de moderação e medidas proporcionais, conforme a gravidade, o contexto e as evidências disponíveis.</p>
        <div className="howRulesGrid">{rules.map(([title, text], index) => <article className="howRule" key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        <div className="howNotice"><strong>Sobre a Blacklist e as denúncias</strong><p>Uma lista de restrição deve servir à proteção da comunidade, não à vingança. Relatos precisam ser específicos e verdadeiros; evidências devem ser preservadas sem adulteração e tratadas com confidencialidade. Uma denúncia não equivale, por si só, a uma decisão final de suspensão. A aplicação de uma restrição geral da plataforma deve passar por análise de governança, com registro do motivo e possibilidade de contestação quando cabível.</p><p>Se você sofreu uma situação grave, preserve as mensagens e os arquivos originais e procure os canais de suporte disponíveis. Não publique provas com dados pessoais de terceiros nem tente resolver o conflito por ameaças.</p><p>Para registrar um bloqueio pessoal ou encaminhar uma denúncia confidencial com evidências privadas, acesse a <Link href="/painel/seguranca">Central de segurança do Pecatho</Link>. É necessário entrar na sua conta.</p></div>
      </section>

      <section id="duvidas" className="howSection">
        <div className="eyebrow">PERGUNTAS FREQUENTES</div><h2>Respostas para usar o Pecatho com mais segurança.</h2>
        <div className="howFaq">{faq.map(([question, answer]) => <details className="howFaqItem" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="ctaPanel howCta">
        <div><div className="eyebrow">CONTINUE SUA EXPERIÊNCIA</div><h2>Explore com informação e respeito.</h2><p>Conheça os perfis e os recursos disponíveis, confira as condições antes de comprar e trate cada pessoa com respeito.</p></div>
        <div className="heroActions"><Link className="primaryButton" href="/anunciantes">Ver anunciantes</Link><Link className="secondaryButton" href="/cadastro">Criar conta</Link></div>
      </section>

      <footer><span>© {new Date().getFullYear()} Pecatho</span><span>Uma comunidade que exige respeito.</span></footer>

      <style jsx>{`
        .howPage{color:#F4F6FB}
        .howHero{max-width:980px;padding-bottom:24px}
        .howPage h1,.howPage h2,.howPage h3,.howPage strong{color:#F8FAFC}
        .howPage p,.howPage .heroCopy{color:#C4CAD6;line-height:1.75}
        .howContents{display:flex;flex-wrap:wrap;gap:9px;margin:8px 0 38px;padding:13px;border:1px solid rgba(231,195,63,.2);border-radius:16px;background:#11131B}
        .howContents a{display:inline-flex;align-items:center;padding:9px 12px;border:1px solid rgba(255,255,255,.12);border-radius:999px;color:#F4F6FB;text-decoration:none;font-size:12px;font-weight:750}
        .howContents a:hover,.howContents a:focus-visible{border-color:#E7C33F;color:#E7C33F}
        .howSection{scroll-margin-top:28px;margin:48px 0}
        .howSection>h2{max-width:850px;font-size:clamp(26px,4vw,38px);letter-spacing:-.04em;line-height:1.15;margin:10px 0 22px}
        .howGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
        .howCard{padding:22px;min-width:0;background:#171A24;border:1px solid rgba(255,255,255,.1)}
        .howNumber{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:rgba(231,195,63,.12);color:#E7C33F;font-weight:900;font-size:12px}
        .howCard h3,.howFeature h3,.howRule h3{font-size:17px;line-height:1.35;margin:15px 0 8px}
        .howCard p,.howFeature p,.howRule p{font-size:13px;margin:0}
        .howFeatureGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .howFeature{padding:22px;background:#171A24;border:1px solid rgba(255,255,255,.1);scroll-margin-top:22px}
        .howFeature h3{margin-top:0}
        .howRules{padding:clamp(20px,4vw,34px);border:1px solid rgba(231,195,63,.22);border-radius:24px;background:linear-gradient(135deg,#171A23,#101219)}
        .howLead{max-width:850px;margin-bottom:24px}
        .howRulesGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 24px}
        .howRule{display:grid;grid-template-columns:34px minmax(0,1fr);gap:12px;align-items:start}
        .howRule>span{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:#262A35;color:#E7C33F;font-size:11px;font-weight:900}
        .howRule h3{margin:3px 0 6px;font-size:15px}
        .howRule p{font-size:12px}
        .howNotice{margin-top:26px;padding:19px;border:1px solid rgba(231,195,63,.28);border-radius:16px;background:#20202A}
        .howNotice strong{color:#E7C33F}
        .howNotice p{font-size:12px;margin:8px 0 0}
        .howFaq{display:grid;gap:10px}
        .howFaqItem{border:1px solid rgba(255,255,255,.12);border-radius:14px;background:#171A24;overflow:hidden}
        .howFaqItem summary{position:relative;cursor:pointer;list-style:none;padding:17px 48px 17px 18px;color:#F8FAFC;font-size:14px;font-weight:800;line-height:1.5}
        .howFaqItem summary::-webkit-details-marker{display:none}
        .howFaqItem summary:after{content:"+";position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:22px;color:#E7C33F}
        .howFaqItem[open] summary:after{content:"−"}
        .howFaqItem p{padding:0 18px 18px;margin:0;font-size:13px}
        .howCta{margin-top:44px}
        @media(max-width:900px){.howGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:620px){.howGrid,.howFeatureGrid,.howRulesGrid{grid-template-columns:1fr}.howSection{margin:36px 0}.howCard,.howFeature{padding:18px}.howRules{padding:20px 16px}.howContents{gap:7px}.howContents a{font-size:11px;padding:8px 10px}}
      `}</style>
    </main>
  );
}
