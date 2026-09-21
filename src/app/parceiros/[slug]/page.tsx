import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
const types:Record<string,string>={nightclub:"Casa noturna",club:"Boate / clube",bar:"Bar",lounge:"Lounge",event_space:"Espaço para eventos",other:"Outro"};
export const dynamic="force-dynamic";
export default async function ParceiroDetalhe({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const supabase=await createClient();
 const {data:v}=await supabase.from("partner_venues").select("*").eq("slug",slug).eq("status","published").maybeSingle();
 if(!v) notFound();
 let city=""; let state="";
 if(v.city_id){const {data}=await supabase.from("cities").select("name,state_id").eq("id",v.city_id).maybeSingle(); city=data?.name||""; if(data?.state_id){const {data:s}=await supabase.from("states").select("name,uf").eq("id",data.state_id).maybeSingle();state=s?.uf||s?.name||"";}}
 const location=city+(state ? " · "+state : "");
 return <main className="shell partnerDetail"><nav className="topbar"><Link className="brand" href="/"><span className="brandMark">P</span><span>Pecatho</span></Link><div className="navLinks"><Link href="/parceiros">Parceiros</Link><Link href="/anunciantes">Anunciantes</Link><Link href="/fans">Fans</Link></div></nav><section className="hero"><div className="eyebrow">{types[v.venue_type]||"PARCEIRO PECATHO"}</div><h1>{v.name}</h1><p className="heroCopy">{v.description||"Perfil oficial do parceiro Pecatho."}</p><div className="partnerFacts"><span>{location||"Localização não informada"}</span>{v.phone&&<span>{v.phone}</span>}</div><div className="heroActions">{v.website_url&&<a className="primaryButton" href={v.website_url} target="_blank" rel="noreferrer">Site oficial</a>}{v.instagram_url&&<a className="secondaryButton" href={v.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}<Link className="secondaryButton" href="/parceiros">Voltar aos parceiros</Link></div></section></main>
}