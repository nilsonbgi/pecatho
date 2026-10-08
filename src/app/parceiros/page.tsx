import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";
type PublicPartnerVenue={id:string;name:string;slug:string;venue_type:string;description:string|null;phone:string|null;website_url:string|null;instagram_url:string|null;state_id:number|null;city_id:number|null;tagline:string|null;highlights:string|null;recruitment_enabled:boolean;recruitment_title:string|null;recruitment_description:string|null;recruitment_contact_phone:string|null;recruitment_contact_email:string|null;recruitment_contact_whatsapp:string|null};

const types:Record<string,string>={nightclub:"Casa noturna",cabaret:"Cabaré",club:"Boate / clube",bar:"Bar",lounge:"Lounge",event_space:"Espaço para eventos",other:"Outro"};

export default async function ParceirosPage(){
 const supabase=await createClient();
 const {data:venuesData}=await supabase.rpc("get_public_partner_venues",{p_slug:null});
 const venues=(venuesData||[]) as PublicPartnerVenue[];
 const ids=[...(venues||[]).map(v=>v.city_id).filter(Boolean)];
 const {data:cities}=ids.length?await supabase.from("cities").select("id,name").in("id",ids):{data:[]};
 const cityMap=new Map((cities||[]).map(c=>[c.id,c.name]));
 const venueIds=(venues||[]).map(v=>v.id);
 const [{data:amenities},{data:rates}]=venueIds.length?await Promise.all([
  supabase.from("partner_venue_amenities").select("venue_id,name").in("venue_id",venueIds).eq("active",true).order("sort_order"),
  supabase.from("partner_venue_rates").select("venue_id,price,period_type").in("venue_id",venueIds).eq("active",true).order("price",{ascending:true})
 ]):[{data:[]},{data:[]}];
 const amenitiesMap=new Map<string,string[]>();
 (amenities||[]).forEach(a=>{const list=amenitiesMap.get(a.venue_id)||[];if(list.length<3)list.push(a.name);amenitiesMap.set(a.venue_id,list)});
 const rateMap=new Map<string,{price:number;period_type:string}>();
 (rates||[]).forEach(r=>{if(!rateMap.has(r.venue_id))rateMap.set(r.venue_id,{price:Number(r.price),period_type:r.period_type})});
 return <main className="shell partnerDirectory"><nav className="topbar"><Link className="brand" href="/"><span className="brandMark">P</span><span>Pecatho</span></Link><div className="navLinks"><Link href="/anunciantes">Anunciantes</Link><Link href="/fans">Fans</Link><Link href="/login" className="navCta">Entrar</Link></div></nav>
 <section className="hero"><div className="eyebrow">PECATHO · PARCEIROS</div><h1>Casas e espaços que fazem parte da <em>experiência Pecatho.</em></h1><p className="heroCopy">Um espaço próprio para casas noturnas, boates, bares, lounges e produtores apresentarem sua estrutura, localização e experiências ao público.</p><div className="heroActions"><Link className="primaryButton" href="/painel/parceiro">Quero anunciar minha casa</Link><Link className="secondaryButton" href="/anunciantes">Explorar anunciantes</Link></div></section>
 <section className="partnerGrid">{(venues||[]).map(v=><Link key={v.id} href={"/parceiros/"+v.slug} className="partnerCard"><span>{types[v.venue_type]||"Parceiro"}</span><h2>{v.name}</h2><p>{v.description||"Perfil oficial do parceiro Pecatho."}</p><small>{cityMap.get(v.city_id)||"Localização não informada"}</small>{(amenitiesMap.get(v.id)||[]).length>0&&<div className="partnerCardTags">{(amenitiesMap.get(v.id)||[]).map((a,i)=><span key={i}>{a}</span>)}</div>}{rateMap.has(v.id)&&<div className="partnerCardCommercial"><strong>A partir de {new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(rateMap.get(v.id)!.price)}</strong><small> · {rateMap.get(v.id)!.period_type}</small></div>}<div className="partnerCardArrow">Ver perfil →</div></Link>)}{!(venues||[]).length&&<div className="card"><h2>Primeiros parceiros em breve</h2><p>O espaço comercial já está preparado para receber casas e estabelecimentos parceiros após análise e publicação.</p></div>}</section></main>
}