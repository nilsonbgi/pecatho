import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const types:Record<string,string>={nightclub:"Casa noturna",club:"Boate / clube",bar:"Bar",lounge:"Lounge",event_space:"Espaço para eventos",other:"Outro"};
export const dynamic="force-dynamic";

export default async function ParceiroDetalhe({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const supabase=await createClient();
 const {data:v}=await supabase.from("partner_venues").select("*").eq("slug",slug).eq("status","published").maybeSingle();
 if(!v)notFound();
 let city="";let state="";
 if(v.city_id){const {data}=await supabase.from("cities").select("name,state_id").eq("id",v.city_id).maybeSingle();city=data?.name||"";if(data?.state_id){const {data:s}=await supabase.from("states").select("name,uf").eq("id",data.state_id).maybeSingle();state=s?.uf||s?.name||"";}}
 const {data:media}=await supabase.from("partner_venue_media").select("id,kind,storage_bucket,storage_path,original_filename,is_primary,sort_order").eq("venue_id",v.id).eq("moderation_status","approved").order("is_primary",{ascending:false}).order("sort_order");
 const gallery=(media||[]).map(m=>({...m,url:supabase.storage.from(m.storage_bucket).getPublicUrl(m.storage_path).data.publicUrl}));
 const location=city+(state?" · "+state:"");
 return <main className="shell partnerDetail"><nav className="topbar"><Link className="brand" href="/"><span className="brandMark">P</span><span>Pecatho</span></Link><div className="navLinks"><Link href="/parceiros">Parceiros</Link><Link href="/anunciantes">Anunciantes</Link><Link href="/fans">Fans</Link></div></nav><section className="hero"><div className="eyebrow">{types[v.venue_type]||"PARCEIRO PECATHO"}</div><h1>{v.name}</h1><p className="heroCopy">{v.description||"Perfil oficial do parceiro Pecatho."}</p><div className="partnerFacts"><span>{location||"Localização não informada"}</span>{v.phone&&<span>{v.phone}</span>}</div><div className="heroActions">{v.website_url&&<a className="primaryButton" href={v.website_url} target="_blank" rel="noreferrer">Site oficial</a>}{v.instagram_url&&<a className="secondaryButton" href={v.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}{v.phone&&<a className="secondaryButton" href={"tel:"+v.phone}>Ligar</a>}<Link className="secondaryButton" href="/parceiros">Voltar aos parceiros</Link></div></section>{gallery.length>0&&<section className="authCard"><div className="eyebrow">GALERIA OFICIAL</div><h2>A casa por dentro e por fora.</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14,marginTop:18}}>{gallery.map(m=>m.kind==="image"?<img key={m.id} src={m.url} alt={m.original_filename||v.name} style={{width:"100%",aspectRatio:"16/10",objectFit:"cover",borderRadius:14}}/>:<video key={m.id} src={m.url} controls style={{width:"100%",aspectRatio:"16/10",objectFit:"cover",borderRadius:14}}/>)}</div></section>}</main>
}