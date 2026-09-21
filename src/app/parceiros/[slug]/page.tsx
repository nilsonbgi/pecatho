import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LeadForm from "./LeadForm";

const types:Record<string,string>={nightclub:"Casa noturna",club:"Boate / clube",bar:"Bar",lounge:"Lounge",event_space:"Espaço para eventos",other:"Outro"};
const dayNames=["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
export const dynamic="force-dynamic";
function brl(value:number|null){if(value===null||value===undefined)return "";return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value);}
function dateTime(value:string){return new Intl.DateTimeFormat("pt-BR",{dateStyle:"full",timeStyle:"short"}).format(new Date(value));}

export default async function ParceiroDetalhe({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const supabase=await createClient();
 const {data:v}=await supabase.from("partner_venues").select("*").eq("slug",slug).eq("status","published").maybeSingle();
 if(!v)notFound();
 let city="",state="";
 if(v.city_id){const {data}=await supabase.from("cities").select("name,state_id").eq("id",v.city_id).maybeSingle();city=data?.name||"";if(data?.state_id){const {data:s}=await supabase.from("states").select("name,uf").eq("id",data.state_id).maybeSingle();state=s?.uf||s?.name||"";}}
 const [{data:media},{data:hours},{data:services},{data:events}]=await Promise.all([
  supabase.from("partner_venue_media").select("id,kind,storage_bucket,storage_path,original_filename,is_primary,sort_order").eq("venue_id",v.id).eq("moderation_status","approved").order("is_primary",{ascending:false}).order("sort_order"),
  supabase.from("partner_venue_hours").select("weekday,open_time,close_time,is_closed").eq("venue_id",v.id).order("weekday"),
  supabase.from("partner_venue_services").select("id,name,description,price_from").eq("venue_id",v.id).eq("active",true).order("sort_order"),
  supabase.from("partner_venue_events").select("id,title,description,starts_at,ends_at,price_from").eq("venue_id",v.id).eq("status","published").gte("starts_at",new Date().toISOString()).order("starts_at").limit(12)
 ]);
 const gallery=(media||[]).map(m=>({...m,url:supabase.storage.from(m.storage_bucket).getPublicUrl(m.storage_path).data.publicUrl}));
 const location=city+(state?" · "+state:"");
 return <main className="shell partnerDetail">
  <nav className="topbar"><Link className="brand" href="/"><span className="brandMark">P</span><span>Pecatho</span></Link><div className="navLinks"><Link href="/parceiros">Parceiros</Link><Link href="/anunciantes">Anunciantes</Link><Link href="/fans">Fans</Link></div></nav>
  <section className="hero"><div className="eyebrow">{types[v.venue_type]||"PARCEIRO PECATHO"}</div><h1>{v.name}</h1><p className="heroCopy">{v.description||"Perfil oficial do parceiro Pecatho."}</p><div className="partnerFacts"><span>{location||"Localização não informada"}</span>{v.phone&&<span>{v.phone}</span>}</div><div className="heroActions">{v.website_url&&<a className="primaryButton" href={v.website_url} target="_blank" rel="noreferrer">Site oficial</a>}{v.instagram_url&&<a className="secondaryButton" href={v.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}{v.phone&&<><a className="secondaryButton" href={"tel:"+v.phone}>Ligar</a><a className="secondaryButton" href={"https://wa.me/"+String(v.phone).replace(/\D/g,"")} target="_blank" rel="noreferrer">WhatsApp</a></>}<Link className="secondaryButton" href="/parceiros">Voltar aos parceiros</Link></div></section>
  {gallery.length>0&&<section className="authCard"><div className="eyebrow">GALERIA OFICIAL</div><h2>A casa por dentro e por fora.</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14,marginTop:18}}>{gallery.map(m=>m.kind==="image"?<img key={m.id} src={m.url} alt={m.original_filename||v.name} style={{width:"100%",aspectRatio:"16/10",objectFit:"cover",borderRadius:14}}/>:<video key={m.id} src={m.url} controls style={{width:"100%",aspectRatio:"16/10",objectFit:"cover",borderRadius:14}}/>)}</div></section>}
  {(hours||[]).length>0&&<section className="authCard"><div className="eyebrow">HORÁRIOS</div><h2>Funcionamento</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10,marginTop:18}}>{(hours||[]).map(h=><div key={h.weekday} style={{padding:14,border:"1px solid rgba(255,255,255,.08)",borderRadius:12}}><strong>{dayNames[h.weekday]||"Dia"}</strong><div style={{marginTop:6,opacity:.75}}>{h.is_closed?"Fechado":(h.open_time&&h.close_time?h.open_time.slice(0,5)+" às "+h.close_time.slice(0,5):"Horário não informado")}</div></div>)}</div></section>}
  {(services||[]).length>0&&<section className="authCard"><div className="eyebrow">SERVIÇOS</div><h2>O que a casa oferece</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14,marginTop:18}}>{(services||[]).map(s=><article key={s.id} style={{padding:18,border:"1px solid rgba(255,255,255,.08)",borderRadius:14}}><h3 style={{margin:0}}>{s.name}</h3>{s.description&&<p style={{opacity:.75,lineHeight:1.6}}>{s.description}</p>}{s.price_from!==null&&<strong>A partir de {brl(Number(s.price_from))}</strong>}</article>)}</div></section>}
  {(events||[]).length>0&&<section className="authCard"><div className="eyebrow">AGENDA</div><h2>Próximos eventos</h2><div style={{display:"grid",gap:14,marginTop:18}}>{(events||[]).map(e=>{const message=encodeURIComponent("Olá! Vi o evento "+e.title+" no Pecatho e gostaria de obter mais informações.");const whatsapp=v.phone?"https://wa.me/"+String(v.phone).replace(/\D/g,"")+"?text="+message:null;return <article key={e.id} style={{padding:18,border:"1px solid rgba(255,255,255,.08)",borderRadius:14}}><h3 style={{margin:"0 0 8px"}}>{e.title}</h3><div style={{opacity:.8}}>{dateTime(e.starts_at)}{e.ends_at?" · até "+new Intl.DateTimeFormat("pt-BR",{timeStyle:"short"}).format(new Date(e.ends_at)):""}</div>{e.description&&<p style={{opacity:.75,lineHeight:1.6}}>{e.description}</p>}{e.price_from!==null&&<strong>A partir de {brl(Number(e.price_from))}</strong>}{whatsapp&&<div style={{marginTop:14}}><a className="secondaryButton" href={whatsapp} target="_blank" rel="noreferrer">Quero informações</a></div>}</article>})}</div></section>}
  <LeadForm venueId={v.id}/>
  <section className="authCard" style={{textAlign:"center"}}><div className="eyebrow">PECATHO</div><h2>Quer falar com a casa?</h2><p style={{opacity:.75}}>Use os canais oficiais acima para consultar reservas, serviços, eventos e outras informações.</p></section>
 </main>;
}