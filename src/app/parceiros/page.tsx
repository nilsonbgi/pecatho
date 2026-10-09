import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";
type PublicPartnerVenue={id:string;name:string;slug:string;venue_type:string;description:string|null;phone:string|null;website_url:string|null;instagram_url:string|null;state_id:number|null;city_id:number|null;tagline:string|null;highlights:string|null;recruitment_enabled:boolean;recruitment_title:string|null;recruitment_description:string|null;recruitment_contact_phone:string|null;recruitment_contact_email:string|null;recruitment_contact_whatsapp:string|null};

const types:Record<string,string>={nightclub:"Casa noturna",cabaret:"Cabaré",club:"Boate / clube",bar:"Bar",lounge:"Lounge",event_space:"Espaço para eventos",other:"Outro"};

type Props={searchParams:Promise<{q?:string;type?:string;city?:string;vagas?:string}>};

export default async function ParceirosPage({searchParams}:Props){
 const params=await searchParams;
 const q=(params.q||"").trim().toLocaleLowerCase("pt-BR");
 const typeFilter=params.type||"";
 const cityFilter=params.city||"";
 const vacanciesOnly=params.vagas==="1";
 const supabase=await createClient();
 const {data:venuesData}=await supabase.rpc("get_public_partner_venues",{p_slug:null});
 const venues=(venuesData||[]) as PublicPartnerVenue[];
 const ids=[...(venues||[]).map(v=>v.city_id).filter(Boolean)];
 const {data:cities}=ids.length?await supabase.from("cities").select("id,name").in("id",ids):{data:[]};
 const cityMap=new Map((cities||[]).map(c=>[c.id,c.name]));
 const venueIds=(venues||[]).map(v=>v.id);
 const [{data:amenities},{data:rates},{data:roomRows}]=venueIds.length?await Promise.all([
  supabase.from("partner_venue_amenities").select("venue_id,name").in("venue_id",venueIds).eq("active",true).order("sort_order"),
  supabase.from("partner_venue_rates").select("venue_id,price,period_type").in("venue_id",venueIds).eq("active",true).order("price",{ascending:true}),
  supabase.from("partner_venue_rooms").select("venue_id,available_slots").in("venue_id",venueIds).eq("active",true).eq("status","published")
 ]):[{data:[]},{data:[]},{data:[]}];
 const amenitiesMap=new Map<string,string[]>();
 (amenities||[]).forEach(a=>{const list=amenitiesMap.get(a.venue_id)||[];if(list.length<3)list.push(a.name);amenitiesMap.set(a.venue_id,list)});
 const rateMap=new Map<string,{price:number;period_type:string}>();
 (rates||[]).forEach(r=>{if(!rateMap.has(r.venue_id))rateMap.set(r.venue_id,{price:Number(r.price),period_type:r.period_type})});
 const roomMap=new Map<string,number>();
 (roomRows||[]).forEach(r=>{const slots=Math.max(0,Number(r.available_slots||0));if(slots>0)roomMap.set(r.venue_id,(roomMap.get(r.venue_id)||0)+slots)});
 const filteredVenues=venues.filter(v=>{
  const matchesType=!typeFilter||v.venue_type===typeFilter;
  const matchesCity=!cityFilter||String(v.city_id||"")===cityFilter;
  const haystack=[v.name,v.description,v.tagline,v.highlights,cityMap.get(v.city_id)||"",types[v.venue_type]||""].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
  return matchesType&&matchesCity&&(!q||haystack.includes(q))&&(!vacanciesOnly||(roomMap.get(v.id)||0)>0);
 });
 const cityOptions=[...new Map(venues.filter(v=>v.city_id&&cityMap.has(v.city_id)).map(v=>[String(v.city_id),cityMap.get(v.city_id)!])).entries()].sort((a,b)=>a[1].localeCompare(b[1],"pt-BR"));
 return <main className="shell partnerDirectory"><nav className="topbar"><Link className="brand" href="/"><span className="brandMark">P</span><span>Pecatho</span></Link><div className="navLinks"><Link href="/anunciantes">Anunciantes</Link><Link href="/fans">Fans</Link><Link href="/login" className="navCta">Entrar</Link></div></nav>
 <section className="hero"><div className="eyebrow">PECATHO · PARCEIROS</div><h1>Casas e espaços que fazem parte da <em>experiência Pecatho.</em></h1><p className="heroCopy">Um espaço próprio para casas noturnas, boates, bares, lounges e produtores apresentarem sua estrutura, localização e experiências ao público.</p><div className="heroActions"><Link className="primaryButton" href="/painel/parceiro">Quero anunciar minha casa</Link><Link className="secondaryButton" href="/anunciantes">Explorar anunciantes</Link></div></section>
 <section className="authCard" aria-label="Filtros de parceiros"><form method="get" className="formGrid"><label>Buscar casa ou característica<input name="q" defaultValue={params.q||""} placeholder="Nome, estrutura, localização..." /></label><label>Categoria<select name="type" defaultValue={typeFilter}><option value="">Todas as categorias</option>{Object.entries(types).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Cidade<select name="city" defaultValue={cityFilter}><option value="">Todas as cidades</option>{cityOptions.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>Oportunidades<select name="vagas" defaultValue={params.vagas||""}><option value="">Todas as casas</option><option value="1">Somente casas com vagas disponíveis</option></select></label><div style={{display:"flex",gap:10,alignItems:"end",flexWrap:"wrap"}}><button className="primaryButton" type="submit">Filtrar parceiros</button><Link className="secondaryButton" href="/parceiros">Limpar filtros</Link></div></form><p className="fieldNote" style={{marginBottom:0}}>{filteredVenues.length} {filteredVenues.length===1?"parceiro encontrado":"parceiros encontrados"}</p></section>
 <section className="partnerGrid">{filteredVenues.map(v=><Link key={v.id} href={"/parceiros/"+v.slug} className="partnerCard"><span>{types[v.venue_type]||"Parceiro"}</span><h2>{v.name}</h2><p>{v.description||"Perfil oficial do parceiro Pecatho."}</p><small>{cityMap.get(v.city_id)||"Localização não informada"}</small>{(roomMap.get(v.id)||0)>0&&<div className="partnerCardCommercial"><strong>{roomMap.get(v.id)} vaga(s) para profissionais</strong><small> · consulte condições</small></div>}{v.recruitment_enabled&&<div className="partnerCardCommercial"><strong>Recebendo contatos de profissionais</strong></div>}{(amenitiesMap.get(v.id)||[]).length>0&&<div className="partnerCardTags">{(amenitiesMap.get(v.id)||[]).map((a,i)=><span key={i}>{a}</span>)}</div>}{rateMap.has(v.id)&&<div className="partnerCardCommercial"><strong>A partir de {new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(rateMap.get(v.id)!.price)}</strong><small> · {rateMap.get(v.id)!.period_type}</small></div>}<div className="partnerCardArrow">Ver perfil →</div></Link>)}{!filteredVenues.length&&<div className="card"><h2>Primeiros parceiros em breve</h2><p>O espaço comercial já está preparado para receber casas e estabelecimentos parceiros após análise e publicação.</p></div>}</section></main>
}