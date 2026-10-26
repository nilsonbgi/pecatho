"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/browser";
import { confirmAgeVerification, getAgeVerificationSnapshot, subscribeToAgeVerification } from "@/lib/age-verification";

type HomeCompanion = { id:string; slug:string|null; title:string|null; display_name:string|null; summary:string|null; city_name:string|null; state_uf:string|null; verification_status:string|null; imageUrl:string|null; featured:boolean };
type HomeCreator = { id:string; slug:string; display_name:string; bio:string|null; avatar_url:string|null; premium_featured?:boolean; plan_featured_card?:boolean };
type HomeBanner = { id:string; title:string|null; image_path:string|null; link_url:string|null; target:string|null; placement:string|null; sort_order:number; starts_at:string|null; ends_at:string|null; metadata:Record<string,unknown> };
type HomeBannerFormat = "leaderboard" | "rectangle" | "square" | "vertical";
function isSafeCampaignLink(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
const homeBannerFormats: Record<HomeBannerFormat, { maxWidth:number; ratio:string }> = {
  leaderboard: { maxWidth:1200, ratio:"5 / 1" }, rectangle: { maxWidth:600, ratio:"2 / 1" },
  square: { maxWidth:600, ratio:"1 / 1" }, vertical: { maxWidth:300, ratio:"1 / 2" },
};
function rotateItems<T>(items:T[], start:number, limit:number):T[] { if (!items.length) return []; return Array.from({length:Math.min(limit,items.length)},(_,index)=>items[(start+index)%items.length]); }
const categories = [
  ["01", "Acompanhantes", "Descubra perfis por cidade, categoria, características, serviços, disponibilidade e faixa de preço."],
  ["02", "Conteúdo exclusivo", "Compre fotos, vídeos e pacotes diretamente na plataforma e mantenha tudo no seu acervo."],
  ["03", "Pecatho Fans", "Acompanhe criadores, publicações, planos, presentes, mensagens e experiências exclusivas."],
  ["04", "Confiança", "Avaliações verificadas, perfis moderados, proteção de pagamentos e recursos de privacidade."],
];

const highlights = [
  ["Descoberta inteligente", "Filtros por localização, características, serviços, idade, duração e preço."],
  ["Perfil 360°", "Galeria, apresentação, serviços, valores, disponibilidade, avaliação e localização aproximada."],
  ["Conteúdo + encontros", "A mesma experiência conecta descoberta de acompanhantes, conteúdo digital e Pecatho Fans."],
  ["Relacionamento", "Favoritos, acompanhamento, mensagens e presentes criam uma experiência contínua, não uma visita isolada."],
];

export default function HomePage() {
  const ageVerified = useSyncExternalStore(subscribeToAgeVerification, getAgeVerificationSnapshot, () => false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredCompanions, setFeaturedCompanions] = useState<HomeCompanion[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<HomeCreator[]>([]);
  const [homeBanners, setHomeBanners] = useState<HomeBanner[]>([]);
  const [companionIndex, setCompanionIndex] = useState(0);
  const [creatorIndex, setCreatorIndex] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const [companionsResult, creatorsResult, bannersResult] = await Promise.all([
        supabase.rpc("search_public_advertisers", {p_category_id:null,p_state_id:null,p_city_id:null,p_query:null,p_attribute_filters:{},p_service_slugs:[],p_age_min:null,p_age_max:null,p_price_min:null,p_price_max:null,p_duration_minutes:null,p_sort:"recent",p_limit:24,p_offset:0}),
        supabase.rpc("get_public_fans_creator_leaderboard", {p_limit:24}),
        supabase.from("banners").select("id,title,image_path,link_url,target,placement,sort_order,starts_at,ends_at,metadata").eq("active",true).order("sort_order",{ascending:true}),
      ]);
      if (!active) return;
      let companions:HomeCompanion[] = ((companionsResult.data??[]) as Array<Omit<HomeCompanion,"imageUrl"|"featured">>).map(item=>({...item,imageUrl:null,featured:false}));
      if (companions.length) {
        const ids=companions.map(item=>item.id);
        const [{data:mediaRows},{data:premiumRows}]=await Promise.all([
          supabase.rpc("get_public_profile_media",{p_profile_ids:ids}),
          supabase.rpc("get_public_professional_plan_features",{p_entity_ids:ids,p_audience:"companion"}),
        ]);
        const media=(mediaRows??[]) as Array<{profile_id:string;preview_storage_bucket:string|null;preview_storage_path:string|null;is_public:boolean;show_in_cards:boolean;is_featured:boolean;is_primary:boolean}>;
        const premium=(premiumRows??[]) as Array<{entity_id:string;featured_card:boolean;search_priority:boolean}>;
        const byProfile=new Map<string,typeof media[number]>();
        for(const item of media){if(!item.is_public||!item.show_in_cards)continue;const current=byProfile.get(item.profile_id);if(!current||Number(item.is_featured)>Number(current.is_featured)||(item.is_featured===current.is_featured&&item.is_primary&&!current.is_primary))byProfile.set(item.profile_id,item);}
        const features=new Map(premium.map(item=>[item.entity_id,item]));
        companions=companions.map(item=>{const m=byProfile.get(item.id);const f=features.get(item.id);return {...item,imageUrl:m?.preview_storage_bucket&&m?.preview_storage_path?supabase.storage.from(m.preview_storage_bucket).getPublicUrl(m.preview_storage_path).data.publicUrl:null,featured:m?.is_featured===true||f?.featured_card===true};}).sort((a,b)=>Number(b.featured)-Number(a.featured));
      }
      setFeaturedCompanions(companions.slice(0,12));
      setFeaturedCreators(((creatorsResult.data??[]) as HomeCreator[]).slice(0,12));
      const now=Date.now();
      setHomeBanners(((bannersResult.data??[]) as HomeBanner[]).filter(b=>(!b.placement||["home","home_top","home_mid","home_bottom"].includes(b.placement))&&(!b.starts_at||new Date(b.starts_at).getTime()<=now)&&(!b.ends_at||new Date(b.ends_at).getTime()>=now)&&typeof b.image_path==="string"&&/^https?:\/\//i.test(b.image_path)).slice(0,8));
    };
    void load().catch(error=>console.error("Falha ao carregar vitrines da página inicial:",error));
    return ()=>{active=false;};
  },[]);
  useEffect(()=>{if(featuredCompanions.length<2)return;const timer=window.setInterval(()=>setCompanionIndex(i=>(i+1)%featuredCompanions.length),5000);return()=>window.clearInterval(timer);},[featuredCompanions.length]);
  useEffect(()=>{if(featuredCreators.length<2)return;const timer=window.setInterval(()=>setCreatorIndex(i=>(i+1)%featuredCreators.length),5000);return()=>window.clearInterval(timer);},[featuredCreators.length]);

  function renderHomeBanners(placements: string[]) {
    const banners = homeBanners.filter((banner) => placements.includes(banner.placement || "home_top"));
    if (!banners.length) return null;
    return <div className="pBannerRail" aria-label="Campanhas publicitárias em destaque">{banners.map((banner) => {
      const rawFormat = String(banner.metadata?.banner_format || "leaderboard");
      const format: HomeBannerFormat = rawFormat in homeBannerFormats ? rawFormat as HomeBannerFormat : "leaderboard";
      const size = homeBannerFormats[format];
      const requestedHref = (banner.link_url || "").trim();
      const href = isSafeCampaignLink(requestedHref) && requestedHref ? requestedHref : "/fans";
      return <Link className={`pLiveBanner pLiveBanner-${format}`} style={{ maxWidth: size.maxWidth, flex: `0 1 ${size.maxWidth}px`, aspectRatio: size.ratio }} href={href} key={banner.id} target={banner.target === "_blank" ? "_blank" : undefined} rel={banner.target === "_blank" ? "noopener noreferrer" : undefined} aria-label={banner.title || "Campanha Pecatho"}>
        <img src={banner.image_path!} alt={banner.title || "Campanha Pecatho"} loading="lazy" />
        <span>{banner.title || "Em destaque no Pecatho"}</span>
      </Link>;
    })}</div>;
  }

  function confirmAge() {
    confirmAgeVerification();
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
        .pNavLinks{display:flex;align-items:center;gap:25px;font-size:13px;position:relative}.pNavLinks a{color:#a8adba;text-decoration:none;transition:color .2s}.pNavLinks a:hover{color:#fff}.pNavLinks .pNavCta{color:#08090d;background:#f5f5f7;border-radius:10px;padding:11px 17px;font-weight:800}.pMobileMenuButton,.pMobileMenuPanel{display:none}.pMobileMenuButton{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);color:#fff;border-radius:10px;padding:10px 12px;align-items:center;gap:8px;font:inherit;font-weight:750;cursor:pointer}.pMobileMenuPanel a{display:block;padding:13px 14px;color:#e9eaf0;border-radius:9px;text-decoration:none;font-size:13px}.pMobileMenuPanel a:hover{background:rgba(255,255,255,.07);color:#fff}
        .pHero{position:relative;padding:92px 0 86px;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(350px,.88fr);gap:70px;align-items:center}
        .pHero:before{content:"";position:absolute;width:680px;height:680px;right:-250px;top:-300px;border-radius:50%;background:radial-gradient(circle,rgba(170,120,255,.19),transparent 68%);pointer-events:none}
        .pEyebrow{font-size:10px;font-weight:850;letter-spacing:.22em;color:#8e94a5;text-transform:uppercase;margin-bottom:20px}.pHero h1{font-size:clamp(48px,6.5vw,82px);line-height:.96;letter-spacing:-.075em;max-width:800px;margin:0 0 27px}.pHero h1 em{font-style:normal;background:linear-gradient(110deg,#fff 5%,#a7adff 48%,#d8a8ff 90%);-webkit-background-clip:text;background-clip:text;color:transparent}.pLead{max-width:650px;color:#a7adbc;font-size:17px;line-height:1.75;margin:0}.pActions{display:flex;gap:11px;flex-wrap:wrap;margin-top:34px}.pPrimary,.pSecondary{min-height:49px;display:inline-flex;align-items:center;justify-content:center;padding:0 19px;border-radius:11px;text-decoration:none;font-size:13px;font-weight:800;transition:transform .2s,border-color .2s}.pPrimary{background:#f4f4f6;color:#08090d}.pSecondary{border:1px solid rgba(255,255,255,.17);color:#fff;background:rgba(255,255,255,.025)}.pPrimary:hover,.pSecondary:hover{transform:translateY(-2px)}
        .pShowcase{position:relative;border:1px solid rgba(255,255,255,.13);border-radius:25px;padding:22px;background:linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.018));box-shadow:0 30px 100px rgba(0,0,0,.38);overflow:hidden}.pShowcase:after{content:"";position:absolute;inset:auto -100px -170px auto;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(116,126,255,.22),transparent 70%)}.pShowTop{display:flex;justify-content:space-between;align-items:center;color:#858c9c;font-size:10px;letter-spacing:.14em}.pStatus{display:flex;align-items:center;gap:8px}.pDot{width:7px;height:7px;border-radius:50%;background:#a4edbf;box-shadow:0 0 16px rgba(164,237,191,.65)}.pShowcase h2{font-size:31px;line-height:1.05;letter-spacing:-.055em;margin:43px 0 12px;max-width:300px}.pShowcase p{font-size:13px;line-height:1.65;color:#969dad;margin:0;max-width:350px}.pMiniGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:25px}.pMini{border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:15px;background:rgba(0,0,0,.16)}.pMini span{display:block;color:#777f91;font-size:10px;margin-bottom:9px}.pMini strong{font-size:13px;letter-spacing:-.02em}.pShowLinks{display:grid;gap:9px;margin-top:12px}.pShowLinks a{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025);border-radius:12px;padding:14px;color:#e8e9ef;text-decoration:none;font-size:12px}.pShowLinks a span{color:#747c8d}
        .pSection{padding:20px 0 0}.pSectionHead{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:23px}.pSectionHead h2{font-size:35px;letter-spacing:-.06em;line-height:1.05;margin:0}.pSectionHead p{max-width:520px;color:#858d9e;font-size:13px;line-height:1.7;text-align:right;margin:0}.pCategoryGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.pCategory{min-height:215px;border:1px solid rgba(255,255,255,.1);border-radius:17px;padding:21px;background:linear-gradient(150deg,rgba(255,255,255,.045),rgba(255,255,255,.012));transition:transform .2s,border-color .2s}.pCategory:hover{transform:translateY(-4px);border-color:rgba(190,178,255,.45)}.pCategoryNo{font-size:10px;color:#737b8d;letter-spacing:.15em}.pCategory h3{font-size:20px;letter-spacing:-.04em;margin:65px 0 9px}.pCategory p{font-size:12px;line-height:1.6;color:#858d9e;margin:0}
        .pSplit{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:52px}.pSplitCard{position:relative;overflow:hidden;min-height:300px;padding:30px;border:1px solid rgba(231,195,63,.14);border-radius:22px;background:linear-gradient(145deg,rgba(231,195,63,.06),rgba(255,255,255,.015))}.pSplitCard:after{content:"";position:absolute;width:260px;height:260px;border-radius:50%;right:-120px;bottom:-150px;border:1px solid rgba(231,195,63,.12);box-shadow:0 0 0 35px rgba(231,195,63,.025),0 0 0 70px rgba(231,195,63,.018)}.pSplitCard h2{position:relative;z-index:1;font-size:35px;line-height:1.02;letter-spacing:-.06em;margin:38px 0 15px}.pSplitCard h2 em{font-style:normal;color:#e7c33f}.pSplitCard p{position:relative;z-index:1;max-width:500px;color:#9199aa;font-size:13px;line-height:1.75;margin:0}.pSplitActions{position:relative;z-index:1;display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:25px}.pSplitActions span{font-size:10px;color:#6f7787}.pContent{background:linear-gradient(145deg,rgba(124,58,237,.13),rgba(255,255,255,.018));border-color:rgba(167,139,250,.16)}.pContent .pEyebrow{color:#c4b5fd}.pContent .pSplitActions span{color:#88849b}.pExperience{margin-top:100px;padding:65px 0;border-top:1px solid rgba(255,255,255,.09);border-bottom:1px solid rgba(255,255,255,.09)}.pExperienceGrid{display:grid;grid-template-columns:1fr 1fr;gap:65px}.pExperience h2{font-size:46px;line-height:1.02;letter-spacing:-.07em;margin:0 0 20px}.pExperienceIntro{font-size:14px;line-height:1.8;color:#929aaa;max-width:520px;margin:0}.pHighlightGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pHighlight{border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:19px;background:rgba(255,255,255,.025)}.pHighlight strong{font-size:13px}.pHighlight p{font-size:11px;line-height:1.65;color:#7f8798;margin:9px 0 0}
        .pFans{margin:72px 0 35px;border:1px solid rgba(255,255,255,.13);border-radius:24px;padding:36px;display:flex;align-items:center;justify-content:space-between;gap:30px;background:linear-gradient(110deg,rgba(130,112,255,.13),rgba(255,255,255,.035) 60%,rgba(255,255,255,.015));position:relative;overflow:hidden}.pFans:after{content:"";position:absolute;right:-80px;top:-150px;width:360px;height:360px;border-radius:50%;border:1px solid rgba(210,190,255,.15);box-shadow:0 0 0 35px rgba(210,190,255,.035),0 0 0 70px rgba(210,190,255,.025)}.pFans h2{font-size:31px;letter-spacing:-.06em;margin:0 0 11px}.pFans p{font-size:13px;line-height:1.7;color:#949cad;max-width:680px;margin:0}.pFans a{position:relative;z-index:1;flex:0 0 auto}.pFooter{display:flex;justify-content:space-between;gap:20px;padding:25px 0 42px;color:#626b7c;font-size:11px}
        @media(max-width:950px){.pBannerRail{gap:10px}.pLiveBanner{flex-basis:min(100%, 420px)}.pHero{grid-template-columns:1fr;gap:35px}.pShowcase{max-width:650px}.pCategoryGrid{grid-template-columns:1fr 1fr}.pSplit{grid-template-columns:1fr}.pSectionHead{align-items:start;flex-direction:column}.pSectionHead p{text-align:left}.pExperienceGrid{grid-template-columns:1fr;gap:38px}.pFans{align-items:flex-start;flex-direction:column}}
        @media(max-width:560px){.pWrap{padding:0 17px}.pNav{height:72px}.pNavLinks{gap:8px}.pNavLinks>a:not(.pNavCta){display:none}.pMobileMenuButton{display:inline-flex}.pMobileMenuPanel.isOpen{position:absolute;display:grid;gap:2px;top:calc(100% + 12px);right:0;width:min(260px,calc(100vw - 34px));padding:8px;border:1px solid rgba(255,255,255,.14);border-radius:15px;background:rgba(10,11,16,.98);box-shadow:0 18px 55px rgba(0,0,0,.55);z-index:30}.pHero{padding:64px 0 55px}.pHero h1{font-size:49px}.pLead{font-size:16px}.pActions{flex-direction:column}.pPrimary,.pSecondary{width:100%}.pCategoryGrid,.pHighlightGrid{grid-template-columns:1fr}.pCategory{min-height:170px}.pCategory h3{margin-top:42px}.pSplitCard{min-height:280px;padding:25px}.pSplitCard h2{font-size:31px}.pSplitActions{align-items:stretch;flex-direction:column}.pSplitActions .pPrimary{width:100%}.pExperience{margin-top:65px;padding:45px 0}.pExperience h2{font-size:36px}.pFans{padding:26px;margin-top:55px}.pFans h2{font-size:27px}.pFooter{flex-direction:column}}
        .pAgeGate{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.84);backdrop-filter:blur(14px)}.pAgeCard{width:min(570px,100%);border:1px solid rgba(231,195,63,.28);border-radius:25px;padding:34px;background:radial-gradient(circle at 50% 0,rgba(231,195,63,.11),transparent 42%),linear-gradient(145deg,#12110e,#080808);box-shadow:0 40px 120px rgba(0,0,0,.65);text-align:center}.pAgeMark{width:58px;height:58px;border-radius:17px;border:1px solid rgba(231,195,63,.55);display:grid;place-items:center;margin:0 auto 18px;color:#e7c33f;font-size:27px;font-weight:950;background:rgba(231,195,63,.07)}.pAgeKicker{color:#e7c33f;font-size:10px;font-weight:900;letter-spacing:.2em}.pAgeCard h2{font-size:34px;letter-spacing:-.055em;margin:10px 0 12px}.pAgeCard p{font-size:13px;line-height:1.75;color:#a19b91;margin:0 auto;max-width:470px}.pAgeWarning{margin:20px 0;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;background:rgba(255,255,255,.025);color:#d8d2c7;font-size:11px;line-height:1.65}.pAgeActions{display:flex;gap:10px;justify-content:center;margin-top:22px}.pAgeActions button{min-height:48px;border-radius:11px;padding:0 19px;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.pAgeEnter{border:0;background:linear-gradient(135deg,#f3d06a,#dcae31);color:#111}.pAgeLeave{border:1px solid rgba(255,255,255,.12);background:transparent;color:#c2bdb3}.pAgeLegal{margin-top:15px;color:#68645d;font-size:9px;line-height:1.6}@media(max-width:560px){.pAgeCard{padding:28px 20px}.pAgeCard h2{font-size:29px}.pAgeActions{flex-direction:column}.pAgeActions button{width:100%}}\n        .pecathoHome{background:radial-gradient(circle at 70% 0,rgba(231,195,63,.10),transparent 30%),#070707}.pNav{border-bottom-color:rgba(231,195,63,.11)}.pBrand{color:#f1c84b}.pLogo{border-color:rgba(231,195,63,.58);background:linear-gradient(145deg,rgba(231,195,63,.2),rgba(231,195,63,.025));color:#e7c33f}.pNavLinks a:hover{color:#e7c33f}.pNavLinks .pNavCta{background:linear-gradient(135deg,#f3d06a,#dcae31);color:#111}.pHero:before{background:radial-gradient(circle,rgba(231,195,63,.14),transparent 68%)}.pHero h1 em{color:#e7c33f;background:none}.pEyebrow{color:#e7c33f}.pPrimary{background:linear-gradient(135deg,#f3d06a,#dcae31);color:#111;box-shadow:0 12px 30px rgba(231,195,63,.14)}.pSecondary{border-color:rgba(231,195,63,.28);color:#e7c33f;background:rgba(231,195,63,.035)}.pShowcase{border-color:rgba(231,195,63,.18);background:linear-gradient(145deg,rgba(231,195,63,.08),rgba(255,255,255,.018))}.pShowcase:after{background:radial-gradient(circle,rgba(231,195,63,.14),transparent 70%)}.pCategory{border-color:rgba(231,195,63,.13);background:linear-gradient(150deg,rgba(231,195,63,.045),rgba(255,255,255,.012))}.pCategory:hover{border-color:rgba(231,195,63,.38)}.pCategoryNo{color:#e7c33f}.pFans{border-color:rgba(231,195,63,.18);background:linear-gradient(110deg,rgba(231,195,63,.10),rgba(255,255,255,.035) 60%,rgba(255,255,255,.015))}.pFans:after{border-color:rgba(231,195,63,.15)}\n.pHomeShowcase{padding:48px 0 0}.pPromoGrid{display:grid;grid-template-columns:1.15fr .85fr;gap:14px;margin:22px 0 8px}.pPromoCard{position:relative;isolation:isolate;overflow:hidden;display:flex;min-height:190px;flex-direction:column;justify-content:space-between;gap:18px;padding:25px;border:1px solid rgba(231,195,63,.22);border-radius:20px;background:radial-gradient(ellipse at 85% 10%,rgba(231,195,63,.16),transparent 43%),linear-gradient(135deg,#17150f,#0c0c0e 75%)}.pPromoCard:after{content:"";position:absolute;z-index:-1;right:-55px;bottom:-100px;width:220px;height:220px;border:1px solid rgba(231,195,63,.18);border-radius:50%;box-shadow:0 0 0 25px rgba(231,195,63,.025),0 0 0 50px rgba(231,195,63,.018)}.pPromoCard.pPromoOwn{border-color:rgba(167,139,250,.24);background:radial-gradient(ellipse at 85% 10%,rgba(139,92,246,.2),transparent 43%),linear-gradient(135deg,#171321,#0c0c10 75%)}.pPromoLabel{color:#e7c33f;font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.pPromoOwn .pPromoLabel{color:#c4b5fd}.pPromoCard h3{max-width:580px;margin:12px 0 8px;font-size:clamp(23px,3vw,34px);line-height:1.06;letter-spacing:-.055em}.pPromoCard p{max-width:560px;margin:0;color:#a5a7b4;font-size:12px;line-height:1.7}.pPromoLink{align-self:flex-start;display:inline-flex;align-items:center;gap:9px;min-height:40px;padding:0 14px;border:1px solid rgba(231,195,63,.32);border-radius:10px;color:#f2d778;text-decoration:none;font-size:11px;font-weight:850}.pPromoOwn .pPromoLink{border-color:rgba(196,181,253,.35);color:#ddd2ff}.pBannerRail{display:flex;align-items:flex-start;justify-content:center;flex-wrap:wrap;gap:12px;margin:24px 0 8px}.pLiveBanner{position:relative;display:block;flex:1 1 300px;width:100%;min-width:0;min-height:0;overflow:hidden;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:#121219}.pLiveBanner img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#101014}.pLiveBanner-rectangle,.pLiveBanner-square,.pLiveBanner-vertical{flex-grow:0}.pLiveBanner:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.76),rgba(0,0,0,.08))}.pLiveBanner span{position:absolute;z-index:1;left:17px;bottom:14px;max-width:75%;color:#fff;font-size:13px;font-weight:900;text-shadow:0 2px 12px #000}.pCarouselSection{padding:62px 0 0}.pCarouselHead{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:20px}.pCarouselHead h2{margin:0;font-size:clamp(27px,3.6vw,38px);letter-spacing:-.06em;line-height:1.05}.pCarouselHead p{max-width:520px;margin:10px 0 0;color:#959aaa;font-size:12px;line-height:1.65}.pCarouselControls{display:flex;flex:0 0 auto;gap:7px}.pCarouselControls button{display:grid;place-items:center;width:40px;height:40px;border:1px solid rgba(231,195,63,.28);border-radius:12px;background:rgba(231,195,63,.05);color:#f1d36c;font-size:20px;cursor:pointer}.pCarouselControls button:focus-visible,.pPromoLink:focus-visible,.pProfileCard:focus-visible{outline:3px solid #e7c33f;outline-offset:3px}.pProfileGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}.pProfileCard{min-width:0;overflow:hidden;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,.1);border-radius:17px;background:linear-gradient(160deg,#171820,#0e0f13);color:#f8f7f2;text-decoration:none;transition:border-color .2s,transform .2s}.pProfileCard:hover{transform:translateY(-3px);border-color:rgba(231,195,63,.48)}.pProfileImage{position:relative;display:grid;place-items:center;aspect-ratio:4/4.6;overflow:hidden;background:radial-gradient(ellipse at 70% 20%,rgba(231,195,63,.16),transparent 45%),linear-gradient(145deg,#22202b,#0c0d11);color:#e7c33f;font-size:42px;font-weight:950}.pProfileImage img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.pFeaturedTag{position:absolute;z-index:1;top:10px;left:10px;padding:6px 8px;border:1px solid rgba(231,195,63,.35);border-radius:8px;background:rgba(8,8,10,.78);color:#f2d778;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.pProfileBody{display:flex;flex:1;flex-direction:column;padding:13px}.pProfileBody strong{overflow-wrap:anywhere;font-size:14px;line-height:1.3}.pProfileBody small{margin-top:7px;color:#a5a8b4;font-size:10px;line-height:1.5}.pProfileBody span{margin-top:12px;color:#e7c33f;font-size:10px;font-weight:850}.pCarouselEmpty{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px;border:1px dashed rgba(231,195,63,.23);border-radius:16px;background:rgba(231,195,63,.025)}.pCarouselEmpty p{margin:0;color:#a5a8b4;font-size:12px;line-height:1.65}.pCarouselEmpty a{flex:0 0 auto;color:#e7c33f;text-decoration:none;font-size:11px;font-weight:900}.pCarouselKicker{margin-bottom:10px;color:#e7c33f;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.pCreatorImage{background:radial-gradient(ellipse at 70% 20%,rgba(167,139,250,.23),transparent 45%),linear-gradient(145deg,#24202f,#0c0d11);color:#c4b5fd}.pCreatorCard .pProfileBody span{color:#c4b5fd}.pCreatorCard .pFeaturedTag{border-color:rgba(196,181,253,.35);color:#ddd2ff}@media(max-width:950px){.pProfileGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.pPromoGrid{grid-template-columns:1fr 1fr}.pBannerRail{grid-template-columns:1fr 1fr}.pCarouselSection{padding-top:48px}.pProfileCard:nth-child(4){display:none}}@media(max-width:560px){.pHomeShowcase{padding-top:35px}.pPromoGrid,.pBannerRail{grid-template-columns:1fr}.pPromoCard{min-height:180px;padding:21px}.pCarouselSection{padding-top:42px}.pCarouselHead{align-items:flex-start}.pCarouselHead h2{font-size:28px}.pCarouselControls button{width:36px;height:36px}.pProfileGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.pProfileCard:nth-child(4){display:flex}.pProfileImage{aspect-ratio:4/4.8}.pProfileBody{padding:11px}.pProfileBody strong{font-size:12px}.pCarouselEmpty{align-items:flex-start;flex-direction:column;padding:17px}}      `}</style>

      <div className="pWrap">
        <nav className="pNav">
          <Link href="/" className="pBrand"><span className="pLogo">P</span><span>Pecatho</span></Link>
          <div className="pNavLinks">
            <Link href="/anunciantes">Acompanhantes</Link><Link href="/parceiros">Parceiros</Link><Link href="/fans">Fans</Link><Link href="/como-funciona">Como funciona</Link><Link href="/login" className="pNavCta">Entrar</Link>
            <button type="button" className="pMobileMenuButton" aria-label={mobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"} aria-expanded={mobileMenuOpen} aria-controls="pecatho-mobile-menu" onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? "Fechar" : "Menu"} <span aria-hidden="true">{mobileMenuOpen ? "×" : "☰"}</span></button>
            <div id="pecatho-mobile-menu" className={mobileMenuOpen ? "pMobileMenuPanel isOpen" : "pMobileMenuPanel"}>
              <Link href="/anunciantes" onClick={() => setMobileMenuOpen(false)}>Acompanhantes</Link>
              <Link href="/parceiros" onClick={() => setMobileMenuOpen(false)}>Parceiros</Link>
              <Link href="/fans" onClick={() => setMobileMenuOpen(false)}>Pecatho Fans</Link>
              <Link href="/como-funciona" onClick={() => setMobileMenuOpen(false)}>Como funciona</Link>
              <Link href="/cadastro" onClick={() => setMobileMenuOpen(false)}>Criar conta</Link>
            </div>
          </div>
        </nav>

        <section className="pHero">
          <div>
            <div className="pEyebrow">PECATHO · CONEXÕES QUE DESPERTAM</div>
            <h1>Descubra. <em>Conecte.</em><br />Viva Pecatho.</h1>
            <p className="pLead">Uma experiência adulta moderna para descobrir acompanhantes, conhecer criadores, acompanhar conteúdos e estabelecer conexões com mais liberdade, informação e confiança.</p>
            <div className="pActions"><Link className="pPrimary" href="/anunciantes">Explorar acompanhantes ↗</Link><Link className="pSecondary" href="/fans">Conhecer Pecatho Fans</Link><Link className="pSecondary" href="/parceiros">Anunciar minha casa</Link><Link className="pSecondary" href="/cadastro">Criar minha conta</Link></div>
          </div>
          <aside className="pShowcase">
            <div className="pShowTop"><span>EXPERIÊNCIA PECATHO</span><span className="pStatus"><i className="pDot" /> ONLINE</span></div>
            <h2>O seu próximo encontro começa com uma descoberta.</h2>
            <p>Uma plataforma pensada para valorizar perfis, conteúdo, autonomia e relacionamento — em uma experiência elegante e responsiva.</p>
            <div className="pMiniGrid"><div className="pMini"><span>01 · CATÁLOGO</span><strong>Perfis e descobertas</strong></div><div className="pMini"><span>02 · CONTEÚDO</span><strong>Fans e criadores</strong></div></div>
            <div className="pShowLinks"><Link href="/anunciantes"><span>01</span> Explorar acompanhantes <span>→</span></Link><Link href="/cadastro"><span>02</span> Criar perfil <span>→</span></Link><Link href="/fans"><span>03</span> Entrar no universo Fans <span>→</span></Link></div>
          </aside>
        </section>

        <section className="pHomeShowcase" aria-label="Vitrines e campanhas Pecatho">
          <div className="pPromoGrid">
            <article className="pPromoCard pPromoOwn"><div><div className="pPromoLabel">✦ CAMPANHAS PECATHO</div><h3>Descubra o que está acontecendo no universo Pecatho.</h3><p>Novos criadores, conteúdo digital e experiências para continuar conectado.</p></div><Link className="pPromoLink" href="/fans">Explorar campanhas e criadores ↗</Link></article>
            <article className="pPromoCard"><div><div className="pPromoLabel">ESPAÇO PARA SUA MARCA</div><h3>Coloque seu negócio em evidência.</h3><p>Apresente sua marca para quem já está explorando o ecossistema Pecatho.</p></div><Link className="pPromoLink" href="/anunciar">Quero anunciar no Pecatho ↗</Link></article>
          </div>
          {renderHomeBanners(["home_top", "home"])}
        </section>
        <section className="pCarouselSection" aria-labelledby="p-companions-title">
          <div className="pCarouselHead"><div><div className="pCarouselKicker">VITRINE EM DESTAQUE</div><h2 id="p-companions-title">Acompanhantes em evidência</h2><p>Perfis publicados, com prioridade para quem tem destaque ativo e mídia pública selecionada para aparecer nos cards.</p></div><div className="pCarouselControls" aria-label="Controles da vitrine de acompanhantes"><button type="button" aria-label="Acompanhantes anteriores" onClick={() => setCompanionIndex((index) => featuredCompanions.length ? (index - 1 + featuredCompanions.length) % featuredCompanions.length : 0)}>‹</button><button type="button" aria-label="Próximas acompanhantes" onClick={() => setCompanionIndex((index) => featuredCompanions.length ? (index + 1) % featuredCompanions.length : 0)}>›</button></div></div>
          <div className="pProfileGrid">{featuredCompanions.length ? rotateItems(featuredCompanions, companionIndex, 4).map((item) => <Link key={item.id} className="pProfileCard" href={item.slug ? "/anunciantes/" + item.slug : "/anunciantes"}><div className="pProfileImage">{item.imageUrl ? <img src={item.imageUrl} alt={item.display_name || item.title || "Perfil de acompanhante"} loading="lazy" /> : <span aria-hidden="true">P</span>}{item.featured && <span className="pFeaturedTag">Em destaque</span>}</div><div className="pProfileBody"><strong>{item.display_name || item.title || "Perfil Pecatho"}</strong><small>{[item.city_name, item.state_uf].filter(Boolean).join(" · ") || "Confira o perfil para mais informações"}</small><span>Ver perfil completo ↗</span></div></Link>) : <div className="pCarouselEmpty"><p>Os perfis em destaque aparecerão aqui assim que houver anúncios publicados e elegíveis para a vitrine.</p><Link href="/anunciantes">Explorar catálogo ↗</Link></div>}</div>
        </section>
        {renderHomeBanners(["home_mid"])}
        <section className="pCarouselSection" aria-labelledby="p-creators-title">
          <div className="pCarouselHead"><div><div className="pCarouselKicker">PECATHO FANS</div><h2 id="p-creators-title">Criadores para acompanhar</h2><p>Conheça criadores ativos, descubra publicações e encontre novas experiências no Fans.</p></div><div className="pCarouselControls" aria-label="Controles da vitrine de criadores"><button type="button" aria-label="Criadores anteriores" onClick={() => setCreatorIndex((index) => featuredCreators.length ? (index - 1 + featuredCreators.length) % featuredCreators.length : 0)}>‹</button><button type="button" aria-label="Próximos criadores" onClick={() => setCreatorIndex((index) => featuredCreators.length ? (index + 1) % featuredCreators.length : 0)}>›</button></div></div>
          <div className="pProfileGrid">{featuredCreators.length ? rotateItems(featuredCreators, creatorIndex, 4).map((item) => <Link key={item.id} className="pProfileCard pCreatorCard" href={"/fans/" + item.slug}><div className="pProfileImage pCreatorImage">{item.avatar_url ? <img src={item.avatar_url} alt={item.display_name} loading="lazy" /> : <span aria-hidden="true">{(item.display_name || "F").slice(0,1).toUpperCase()}</span>}{(item.premium_featured || item.plan_featured_card) && <span className="pFeaturedTag">Criador em destaque</span>}</div><div className="pProfileBody"><strong>{item.display_name}</strong><small>{item.bio?.replace(/\s+/g," ").slice(0,105) || "Publicações e experiências exclusivas no Pecatho Fans."}</small><span>Conhecer criador ↗</span></div></Link>) : <div className="pCarouselEmpty"><p>Os criadores ativos aparecerão nesta vitrine conforme publicarem seus perfis no Pecatho Fans.</p><Link href="/fans">Explorar Pecatho Fans ↗</Link></div>}</div>
        </section>
        {renderHomeBanners(["home_bottom"])}
        <section className="pSection">
  <div className="pSectionHead"><div><div className="pEyebrow">UM ECOSSISTEMA COMPLETO</div><h2>Mais do que um catálogo.</h2></div><p>O Pecatho une duas jornadas que normalmente ficam separadas: encontrar uma acompanhante e descobrir o conteúdo que ela ou outros criadores publicam.</p></div>
  <div className="pCategoryGrid">{categories.map(([no,title,text])=><article className="pCategory" key={title}><div className="pCategoryNo">{no}</div><h3>{title}</h3><p>{text}</p></article>)}</div>
</section>
<section className="pSplit">
  <div className="pSplitCard pMeet"><div className="pEyebrow">JORNADA 01 · ENCONTROS</div><h2>Encontre alguém.<br/><em>Conheça o perfil.</em></h2><p>Compare informações reais do anúncio antes de entrar em contato: serviços, valores, disponibilidade, avaliações, mídia e localização aproximada.</p><div className="pSplitActions"><Link href="/anunciantes" className="pPrimary">Explorar acompanhantes ↗</Link><span>Filtros avançados · Avaliações · Favoritos</span></div></div>
  <div className="pSplitCard pContent"><div className="pEyebrow">JORNADA 02 · CONTEÚDO</div><h2>Depois da descoberta,<br/><em>continue conectado.</em></h2><p>Fotos, vídeos, pacotes, Fans, presentes e relacionamento transformam o Pecatho em uma experiência que continua mesmo quando não há um encontro.</p><div className="pSplitActions"><Link href="/conteudos" className="pPrimary">Explorar conteúdo ↗</Link><span>Compra segura · Acesso privado · Acervo pessoal</span></div></div>
</section>

        <section className="pExperience"><div className="pExperienceGrid"><div><div className="pEyebrow">EVOLUÇÃO CONTÍNUA</div><h2>Construído para ser melhor, não apenas diferente.</h2><p className="pExperienceIntro">O Pecatho preserva a profundidade funcional já construída e transforma a apresentação em uma experiência mais atraente: navegação clara, perfis valorizados, segurança, moderação, pagamentos, notificações e novas possibilidades comerciais.</p></div><div className="pHighlightGrid">{highlights.map(([title,text])=><article className="pHighlight" key={title}><strong>{title}</strong><p>{text}</p></article>)}</div></div></section>

        <section className="pFans"><div><div className="pEyebrow">PECATHO FANS</div><h2>Seu conteúdo. Seu público. Seu negócio.</h2><p>Uma experiência própria para criadores e assinantes, com publicações, planos, assinaturas, compras, relacionamento e identidade integrada ao ecossistema Pecatho.</p></div><Link className="pPrimary" href="/fans">Explorar Fans →</Link></section>
        <footer className="pFooter"><span>© {new Date().getFullYear()} Pecatho</span><span>Conexões, conteúdo e experiências em evolução.</span></footer>
      </div>
    </main>
  );
}
