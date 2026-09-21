import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";
const types:Record<string,string>={nightclub:"Casa noturna",club:"Boate / clube",bar:"Bar",lounge:"Lounge",event_space:"Espaço para eventos",other:"Outro"};

export default async function ParceirosPage(){
 const supabase=await createClient();
 const {data:venues}=await supabase.from("partner_venues").select("id,name,slug,venue_type,description,city_id,state_id").eq("status","published").order("name");
 const ids=[...(venues||[]).map(v=>v.city_id).filter(Boolean)];
 const {data:cities}=ids.length?await supabase.from("cities").select("id,name").in("id",ids):{data:[]};
 const cityMap=new Map((cities||[]).map(c=>[c.id,c.name]));
 return <main className="shell partnerDirectory"><nav className="topbar"><Link className="brand" href="/"><span className="brandMark">P</span><span>Pecatho</span></Link><div className="navLinks"><Link href="/anunciantes">Anunciantes</Link><Link href="/fans">Fans</Link><Link href="/login" className="navCta">Entrar</Link></div></nav>
 <section className="hero"><div className="eyebrow">PECATHO · PARCEIROS</div><h1>Casas e espaços que fazem parte da <em>experiência Pecatho.</em></h1><p className="heroCopy">Um espaço próprio para casas noturnas, boates, bares, lounges e produtores apresentarem sua estrutura, localização e experiências ao público.</p><div className="heroActions"><Link className="primaryButton" href="/painel/parceiro">Quero anunciar minha casa</Link><Link className="secondaryButton" href="/anunciantes">Explorar anunciantes</Link></div></section>
 <section className="partnerGrid">{(venues||[]).map(v=><Link key={v.id} href={"/parceiros/"+v.slug} className="partnerCard"><span>{types[v.venue_type]||"Parceiro"}</span><h2>{v.name}</h2><p>{v.description||"Perfil oficial do parceiro Pecatho."}</p><small>{cityMap.get(v.city_id)||"Localização não informada"}</small></Link>)}{!(venues||[]).length&&<div className="card"><h2>Primeiros parceiros em breve</h2><p>O espaço comercial já está preparado para receber casas e estabelecimentos parceiros após análise e publicação.</p></div>}</section></main>
}