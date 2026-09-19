import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: creator } = user
    ? await supabase.from("fans_creators").select("id,slug,display_name,bio,status,avatar_url").eq("user_id", user.id).maybeSingle()
    : { data: null };
  let plansCount = 0;
  let postsCount = 0;
  const { data: creators } = await supabase.from("fans_creators").select("id,slug,display_name,bio,avatar_url,status").eq("status","active").order("display_name",{ascending:true}).limit(24);
  const creatorIds = (creators || []).map((item) => item.id);
  const [{ data: creatorPlans }, { data: creatorOffers }] = creatorIds.length ? await Promise.all([
    supabase.from("fans_plans").select("creator_id").in("creator_id",creatorIds).eq("status","active"),
    supabase.from("fans_live_offers").select("creator_id").in("creator_id",creatorIds).eq("status","active")
  ]) : [{data:[]},{data:[]}];
  const planMap = new Map<string,number>();
  const offerMap = new Map<string,number>();
  for (const item of creatorPlans || []) planMap.set(item.creator_id,(planMap.get(item.creator_id) || 0)+1);
  for (const item of creatorOffers || []) offerMap.set(item.creator_id,(offerMap.get(item.creator_id) || 0)+1);
  if (creator !== null) {
    const [{ count: plans }, { count: posts }] = await Promise.all([
      supabase.from("fans_plans").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
      supabase.from("fans_posts").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
    ]);
    plansCount = plans || 0;
    postsCount = posts || 0;
  }

  return <main className="fansPremiumShell"><style>{`
    .fansPremiumShell{min-height:100vh;background:#07080c;color:#f7f7fa}.fansPremiumShell *{box-sizing:border-box}.fansWrap{width:min(1180px,100%);margin:auto;padding:0 28px}
    .fansNav{height:82px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.09)}.fansBrand{display:flex;align-items:center;gap:11px;color:#fff;text-decoration:none;font-size:23px;font-weight:850;letter-spacing:-.06em}.fansMark{width:38px;height:38px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(145deg,#fff,#b9bdc8);color:#08090d;font-weight:950}.fansBrand small{font-size:12px;letter-spacing:.03em;color:#b5a4ff;margin-left:5px}.fansNavLinks{display:flex;gap:22px;align-items:center;font-size:12px}.fansNavLinks a{color:#9ba2b2;text-decoration:none}.fansNavLinks a:hover{color:#fff}
    .fansHero{padding:86px 0 65px;position:relative}.fansHero:before{content:"";position:absolute;right:-280px;top:-240px;width:650px;height:650px;border-radius:50%;background:radial-gradient(circle,rgba(157,111,255,.17),transparent 68%);pointer-events:none}.fansEyebrow{font-size:10px;font-weight:850;letter-spacing:.2em;color:#8e95a6;margin-bottom:20px}.fansHero h1{font-size:clamp(50px,7vw,86px);line-height:.94;letter-spacing:-.08em;max-width:820px;margin:0 0 25px}.fansHero h1 em{font-style:normal;background:linear-gradient(110deg,#fff,#b9a6ff,#e4b7ff);-webkit-background-clip:text;background-clip:text;color:transparent}.fansLead{max-width:680px;color:#a6adbd;font-size:17px;line-height:1.75;margin:0}.fansActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:30px}.fansPrimary,.fansSecondary{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:11px;text-decoration:none;font-size:13px;font-weight:800}.fansPrimary{background:#f5f5f7;color:#08090d}.fansSecondary{border:1px solid rgba(255,255,255,.16);color:#fff;background:rgba(255,255,255,.025)}
    .fansPanel{margin-top:42px;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:28px;background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.018));box-shadow:0 25px 90px rgba(0,0,0,.3)}.fansPanelTop{display:flex;justify-content:space-between;gap:15px;align-items:center;color:#858d9f;font-size:10px;letter-spacing:.15em}.fansStatus{color:#a8edc0}.fansPanel h2{font-size:30px;letter-spacing:-.055em;margin:30px 0 10px}.fansPanel p{color:#929aaa;font-size:13px;line-height:1.7;max-width:700px;margin:0}.fansMetrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px}.fansMetric{border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:19px;background:rgba(0,0,0,.14)}.fansMetric span{display:block;font-size:10px;letter-spacing:.12em;color:#7e8798;margin-bottom:12px}.fansMetric strong{font-size:29px;letter-spacing:-.05em}.fansMetric p{font-size:11px;margin-top:7px}
    .fansCard{border:1px solid rgba(255,255,255,.1);border-radius:19px;padding:28px;background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015))}.fansCard h2{font-size:28px;letter-spacing:-.05em;margin:0 0 10px}.fansCard p{color:#929aaa;font-size:13px;line-height:1.7;margin:0}.fansOnboarding{margin-top:24px}.fansCreator{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-top:24px}.fansStatusBadge{border:1px solid rgba(164,237,191,.25);color:#a4edbf;background:rgba(164,237,191,.07);padding:7px 11px;border-radius:999px;font-size:11px;white-space:nowrap}.fansLabel{font-size:10px;letter-spacing:.15em;color:#8c94a5;font-weight:850}.fansArchitecture{margin-top:70px;padding:45px 0;border-top:1px solid rgba(255,255,255,.09);display:grid;grid-template-columns:1fr 1fr;gap:50px}.fansArchitecture h2{font-size:38px;line-height:1.04;letter-spacing:-.065em;margin:0 0 16px}.fansArchitecture p{font-size:13px;line-height:1.8;color:#929aaa;margin:0}.fansFlow{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}.fansFlow span{border:1px solid rgba(255,255,255,.13);border-radius:12px;padding:14px 17px;background:rgba(255,255,255,.03);font-size:12px}.fansFlow b{color:#8e95a6}.fansFooter{display:flex;justify-content:space-between;gap:20px;padding:25px 0 40px;color:#626b7c;font-size:11px}
    @media(max-width:760px){.fansWrap{padding:0 17px}.fansNav{height:72px}.fansNavLinks a:not(:last-child){display:none}.fansHero{padding:62px 0 45px}.fansHero h1{font-size:51px}.fansLead{font-size:16px}.fansActions{flex-direction:column}.fansPrimary,.fansSecondary{width:100%}.fansMetrics{grid-template-columns:1fr}.fansArchitecture{grid-template-columns:1fr;gap:30px;margin-top:55px}.fansArchitecture h2{font-size:34px}.fansFooter{flex-direction:column}}
  `}</style><div className="fansWrap">
    <nav className="fansNav"><Link href="/" className="fansBrand"><span className="fansMark">P</span><span>Pecatho <small>Fans</small></span></Link><div className="fansNavLinks"><Link href="/fans/minhas-assinaturas">Minhas assinaturas</Link><Link href="/painel">Painel Pecatho</Link><Link href="/">Página inicial</Link></div></nav>
    <section className="fansHero">
      <section className="fansCard" style={{marginBottom:24}}>
        <div className="fansLabel">DESCOBERTA</div>
        <h2>Encontre criadores no Pecatho Fans.</h2>
        <p>Explore perfis, conteúdos, assinaturas e experiências privadas.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:20}}>
          {(creators || []).map((item) => <Link key={item.id} href={"/fans/"+item.slug} style={{textDecoration:"none",color:"#fff",border:"1px solid rgba(255,255,255,.1)",borderRadius:18,padding:18,background:"rgba(255,255,255,.035)"}}>
            <div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:48,height:48,borderRadius:15,overflow:"hidden",background:"#fff",color:"#111",display:"grid",placeItems:"center",fontWeight:900}}>{item.avatar_url ? <img src={item.avatar_url} alt={item.display_name} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : item.display_name.slice(0,1).toUpperCase()}</div><div><strong style={{fontSize:14}}>{item.display_name}</strong><div style={{fontSize:10,color:"#929aaa",marginTop:4}}>{planMap.get(item.id) || 0} plano(s) · {offerMap.get(item.id) || 0} experiência(s)</div></div></div>
            <div style={{fontSize:10,color:"#929aaa",lineHeight:1.6,marginTop:13}}>{item.bio || "Conteúdos e experiências exclusivas."}</div>
            <div style={{fontSize:10,fontWeight:900,marginTop:13}}>VER PERFIL →</div>
          </Link>)}
        </div>
      </section><div className="fansEyebrow">PECATHO FANS · CRIADORES E AUDIÊNCIA</div><h1>Seu conteúdo.<br /><em>Sua audiência.</em></h1><p className="fansLead">Um espaço para criadores publicarem, construírem sua audiência e monetizarem conteúdos. Com identidade própria, operação independente e integração ao ecossistema Pecatho.</p>
      {user && creator === null ? <section className="fansCard fansOnboarding"><div className="fansLabel">COMECE SUA EXPERIÊNCIA</div><h2>Crie seu espaço no Fans.</h2><p>Configure sua página de criador, publique conteúdos e desenvolva sua relação com assinantes. Você pode utilizar o Fans com ou sem um perfil de anunciante no Pecatho principal.</p><div className="fansActions"><Link className="fansPrimary" href="/fans/ativar">Criar meu espaço Fans ↗</Link><Link className="fansSecondary" href="/fans/minhas-assinaturas">Minhas assinaturas</Link></div></section> : <><section className="fansCard fansCreator"><div><div className="fansLabel">SEU ESPAÇO DE CRIADOR</div><h2>{creator.display_name}</h2><p>{creator.bio || "Seu espaço de conteúdo está pronto para ser configurado."}</p></div><span className="fansStatusBadge">{creator.status === "active" ? "Ativo" : creator.status}</span></section><section className="fansMetrics"><article className="fansMetric"><span>PLANOS</span><strong>{plansCount}</strong><p>Planos de assinatura</p></article><article className="fansMetric"><span>PUBLICAÇÕES</span><strong>{postsCount}</strong><p>Conteúdos cadastrados</p></article><article className="fansMetric"><span>ECOSSISTEMA</span><strong>Fans</strong><p>Área exclusiva para sua audiência</p></article></section><section className="fansCard fansOnboarding"><div className="fansLabel">ÁREA DO FÃ</div><h2>Seu relacionamento continua aqui.</h2><p>Consulte suas assinaturas e acessos adquiridos independentemente da sua atuação como criador.</p><div className="fansActions"><Link className="fansPrimary" href="/fans/minhas-assinaturas">Minhas assinaturas</Link><Link className="fansSecondary" href="/fans/gerenciar">Gerenciar meu Fans</Link></div></section></>}
      <section className="fansArchitecture"><div><div className="fansEyebrow">SEPARAÇÃO FUNCIONAL</div><h2>O Fans não substitui o Pecatho. Amplia o ecossistema.</h2><p>O Pecatho principal permanece responsável pelos anúncios de serviços. O Fans possui sua própria operação de conteúdo e relacionamento com fãs. Um mesmo usuário pode utilizar os dois ambientes.</p></div><div className="fansFlow"><span>Pecatho</span><b>→</b><span>Anunciante</span><b>→</b><span>Fans</span></div></section>
    </section><footer className="fansFooter"><span>© {new Date().getFullYear()} Pecatho Fans</span><span>Conteúdo, audiência e experiências em evolução.</span></footer></div></main>;
}
