"use client";
import { FormEvent,useEffect,useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

const types=[["nightclub","Casa noturna"],["club","Boate / clube"],["bar","Bar"],["lounge","Lounge"],["event_space","Espaço para eventos"],["other","Outro"]];

function slugify(v:string){return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,130)}
function formatCep(v:string){const d=v.replace(/\D/g,"").slice(0,8);return d.length>5?d.slice(0,5)+"-"+d.slice(5):d}

export default function ParceiroPainel(){
 const [userId,setUserId]=useState(""); const [id,setId]=useState(""); const [name,setName]=useState(""); const [slug,setSlug]=useState(""); const [type,setType]=useState("nightclub"); const [description,setDescription]=useState(""); const [phone,setPhone]=useState(""); const [website,setWebsite]=useState(""); const [instagram,setInstagram]=useState(""); const [zipcode,setZipcode]=useState(""); const [street,setStreet]=useState(""); const [number,setNumber]=useState(""); const [complement,setComplement]=useState(""); const [neighborhood,setNeighborhood]=useState(""); const [cityId,setCityId]=useState(""); const [stateId,setStateId]=useState(""); const [states,setStates]=useState<any[]>([]); const [cities,setCities]=useState<any[]>([]); const [status,setStatus]=useState("draft"); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const [cepBusy,setCepBusy]=useState(false);

 useEffect(()=>{(async()=>{const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){location.href="/login";return}setUserId(user.id);const [{data:v},{data:st}]=await Promise.all([s.from("partner_venues").select("*").eq("owner_user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle(),s.from("states").select("id,name,uf").order("name")]);setStates(st||[]);if(v){setId(v.id);setName(v.name||"");setSlug(v.slug||"");setType(v.venue_type||"nightclub");setDescription(v.description||"");setPhone(v.phone||"");setWebsite(v.website_url||"");setInstagram(v.instagram_url||"");setZipcode(formatCep(v.zipcode||""));setStreet(v.street||"");setNumber(v.number||"");setComplement(v.complement||"");setNeighborhood(v.neighborhood||"");setCityId(v.city_id?String(v.city_id):"");setStateId(v.state_id?String(v.state_id):"");setStatus(v.status)}})()},[]);

 useEffect(()=>{if(!stateId){setCities([]);return}(async()=>{const {data}=await createClient().from("cities").select("id,name").eq("state_id",Number(stateId)).order("name");setCities(data||[])})()},[stateId]);

 async function lookupCep(value:string){
  const cep=value.replace(/\D/g,""); if(cep.length!==8)return;
  setCepBusy(true);setError("");
  try{
   const response=await fetch("https://viacep.com.br/ws/"+cep+"/json/");
   const data=await response.json();
   if(data.erro)throw new Error("CEP não encontrado.");
   setStreet(data.logradouro||"");setNeighborhood(data.bairro||"");
   const uf=String(data.uf||"").toUpperCase();
   const state=states.find(s=>String(s.uf||"").trim().toUpperCase()===uf);
   if(state){setStateId(String(state.id));setCityId("");}
   setMessage("Endereço localizado pelo CEP. Confirme os dados antes de salvar.");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível consultar o CEP.");}
  finally{setCepBusy(false)}
 }

 async function save(e:FormEvent){
  e.preventDefault();setBusy(true);setError("");setMessage("");
  try{
   const s=createClient();if(!userId)throw new Error("Sessão não encontrada.");
   const nextStatus=status==="published"?"pending_review":status;
   const payload={owner_user_id:userId,name:name.trim(),slug:(slug.trim()||slugify(name)),venue_type:type,description:description.trim()||null,phone:phone.trim()||null,website_url:website.trim()||null,instagram_url:instagram.trim()||null,zipcode:zipcode.replace(/\D/g,"")||null,street:street.trim()||null,number:number.trim()||null,complement:complement.trim()||null,neighborhood:neighborhood.trim()||null,city_id:cityId?Number(cityId):null,state_id:stateId?Number(stateId):null,status:nextStatus};
   if(id){const {error:e}=await s.from("partner_venues").update(payload).eq("id",id);if(e)throw e}else{const {data,error:e}=await s.from("partner_venues").insert(payload).select("id").single();if(e)throw e;setId(data.id)}
   setSlug(payload.slug);setStatus(nextStatus);
   setMessage(nextStatus==="pending_review"?"Perfil atualizado e reenviado para análise, pois uma alteração foi feita em um perfil publicado.":"Dados do parceiro salvos.");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar o parceiro.")}finally{setBusy(false)}
 }

 async function submit(){if(!id)return;setBusy(true);setError("");setMessage("");try{const {error:e}=await createClient().rpc("submit_partner_venue_for_review",{p_venue_id:id});if(e)throw e;setStatus("pending_review");setMessage("Perfil enviado para análise.")}catch(e){setError(e instanceof Error?e.message:"Não foi possível solicitar a análise.")}finally{setBusy(false)}}

 const statusLabel=status==="pending_review"?"Em análise":status==="published"?"Publicado":status==="rejected"?"Rejeitado":status==="paused"?"Pausado":"Rascunho";

 return <main className="shell partnerManager"><nav className="topbar"><Link className="brand" href="/"><span className="brandMark">P</span><span>Pecatho</span></Link><div className="navLinks"><Link href="/parceiros">Parceiros</Link><Link href="/painel/parceiro/comercial">Comercial</Link><Link href="/painel/parceiro/midias">Galeria</Link><Link href="/painel">Painel</Link></div></nav><section className="hero"><div className="eyebrow">PARCEIROS · ÁREA COMERCIAL</div><h1>Apresente sua <em>casa.</em></h1><p className="heroCopy">Cadastre sua boate, casa noturna, bar, lounge ou espaço de eventos e solicite a publicação de um perfil comercial no Pecatho.</p><form className="authCard" onSubmit={save}><label>Nome da casa<input value={name} onChange={e=>{setName(e.target.value);if(!id)setSlug(slugify(e.target.value))}} required/></label><label>Tipo<select value={type} onChange={e=>setType(e.target.value)}>{types.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Descrição<textarea rows={6} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Apresente a casa, ambiente, estrutura e experiência oferecida." /></label><label>Telefone<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><label>Site oficial<input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://..." /></label><label>Instagram<input value={instagram} onChange={e=>setInstagram(e.target.value)} placeholder="https://instagram.com/..." /></label><div className="formGrid"><label>CEP<input value={zipcode} onChange={e=>{const v=formatCep(e.target.value);setZipcode(v);void lookupCep(v)}} inputMode="numeric" placeholder="00000-000" />{cepBusy&&<small className="fieldNote">Consultando CEP...</small>}</label><label>Número<input value={number} onChange={e=>setNumber(e.target.value)}/></label><label>Logradouro<input value={street} onChange={e=>setStreet(e.target.value)}/></label><label>Complemento<input value={complement} onChange={e=>setComplement(e.target.value)}/></label><label>Bairro<input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)}/></label><label>Estado<select value={stateId} onChange={e=>{setStateId(e.target.value);setCityId("")}}><option value="">Selecione</option>{states.map(s=><option key={s.id} value={s.id}>{s.name} ({s.uf})</option>)}</select></label><label>Cidade<select value={cityId} disabled={!stateId} onChange={e=>setCityId(e.target.value)}><option value="">Selecione</option>{cities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>{error&&<p className="formError">{error}</p>}{message&&<p className="formSuccess">{message}</p>}<div className="partnerStatus">Status: <strong>{statusLabel}</strong>{status==="published"&&<span className="fieldNote"> Alterações em perfil publicado retornam para análise antes de voltarem à vitrine.</span>}</div><button className="primaryButton" type="submit" disabled={busy}>{busy?"Salvando...":"Salvar cadastro"}</button>{id&&["draft","rejected","paused"].includes(status)&&<button className="secondaryButton" type="button" onClick={submit} disabled={busy}>Solicitar análise e publicação</button>}</form></section></main>
}