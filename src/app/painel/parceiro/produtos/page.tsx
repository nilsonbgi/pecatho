"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type StoreProduct = { id:string; venue_id:string; owner_user_id:string; title:string; description:string|null; category:string; external_url:string; image_url:string|null; price_label:string|null; is_published:boolean; sort_order:number };
const emptyForm = { title:"", description:"", category:"Sex shop", external_url:"", image_url:"", price_label:"", is_published:true };
function safeUrl(value:string, image=false):string|null { const raw=value.trim(); if(!raw)return null; try { const parsed=new URL(raw); if(image ? !["https:","http:"].includes(parsed.protocol) : parsed.protocol!=="https:")return null; return parsed.toString(); } catch { return null; } }

export default function ParceiroProdutos(){
 const supabase=useMemo(()=>createClient(),[]);
 const [userId,setUserId]=useState(""); const [venueId,setVenueId]=useState(""); const [items,setItems]=useState<StoreProduct[]>([]);
 const [form,setForm]=useState(emptyForm); const [editing,setEditing]=useState<string|null>(null); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState("");
 async function load(){
  setError(""); const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user){setError("Entre novamente para gerenciar sua vitrine.");return;}
  setUserId(user.id);
  const {data:venue,error:venueError}=await supabase.from("partner_venues").select("id").eq("owner_user_id",user.id).maybeSingle();
  if(venueError||!venue){setError("Cadastre primeiro o perfil de parceiro.");return;}
  setVenueId(venue.id);
  const {data,error:listError}=await supabase.from("partner_store_products").select("*").eq("venue_id",venue.id).order("category").order("sort_order").order("created_at",{ascending:false});
  if(listError){setError("Não foi possível carregar a vitrine. Confirme se a migration de produtos externos foi aplicada.");return;}
  setItems((data||[]) as StoreProduct[]);
 }
 useEffect(()=>{void load();},[]);
 function edit(item:StoreProduct){setEditing(item.id);setForm({title:item.title,description:item.description||"",category:item.category,external_url:item.external_url,image_url:item.image_url||"",price_label:item.price_label||"",is_published:item.is_published});setMessage("");setError("");}
 function reset(){setEditing(null);setForm(emptyForm);}
 async function save(event:FormEvent){
  event.preventDefault();setError("");setMessage(""); const external=safeUrl(form.external_url); const image=safeUrl(form.image_url,true);
  if(!form.title.trim()||form.title.trim().length<2){setError("Informe o nome do produto.");return;}
  if(!external){setError("O link do produto deve ser uma URL HTTPS válida.");return;}
  if(form.image_url.trim()&&!image){setError("A imagem deve usar um endereço HTTP ou HTTPS válido.");return;}
  setBusy(true);
  try{
   const payload={venue_id:venueId,owner_user_id:userId,title:form.title.trim(),description:form.description.trim()||null,category:form.category.trim()||"Geral",external_url:external,image_url:image,price_label:form.price_label.trim()||null,is_published:form.is_published,updated_at:new Date().toISOString()};
   const result=editing?await supabase.from("partner_store_products").update(payload).eq("id",editing).eq("owner_user_id",userId):await supabase.from("partner_store_products").insert(payload);
   if(result.error)throw result.error;
   setMessage(editing?"Produto atualizado.":"Produto adicionado à vitrine.");reset();await load();
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar o produto.");}finally{setBusy(false);}
 }
 async function remove(id:string){if(!window.confirm("Excluir este produto da vitrine?"))return;setError("");const {error:e}=await supabase.from("partner_store_products").delete().eq("id",id).eq("owner_user_id",userId);if(e){setError("Não foi possível excluir o produto.");return;}setMessage("Produto removido.");await load();}
 return <main className="shell" style={{maxWidth:1120,paddingBottom:80}}>
  <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap",margin:"28px 0"}}><div><p style={{color:"#E7C33F",fontSize:11,fontWeight:900,letterSpacing:".15em"}}>VITRINE DO PARCEIRO</p><h1 style={{fontSize:"clamp(28px,4vw,42px)",fontWeight:900}}>Produtos e recomendações</h1><p style={{opacity:.7,maxWidth:720}}>Organize produtos do seu sex shop, marketplace ou loja própria em uma vitrine visual no seu perfil Pecatho. A compra acontece no site de origem; o Pecatho não processa esses pagamentos.</p></div><Link href="/painel/parceiro" className="secondaryButton">Voltar ao painel</Link></header>
  {error&&<p role="alert" style={{padding:14,borderRadius:12,border:"1px solid #ef444466",color:"#fecaca"}}>{error}</p>}{message&&<p role="status" style={{padding:14,borderRadius:12,border:"1px solid #E7C33F55",color:"#E7C33F"}}>{message}</p>}
  <section style={{padding:22,borderRadius:20,border:"1px solid #ffffff1a",background:"#11131a",marginBottom:24}}><h2 style={{fontSize:21,fontWeight:850,marginBottom:16}}>{editing?"Editar produto":"Adicionar produto externo"}</h2>
   <form onSubmit={save} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
    <label style={{display:"grid",gap:6,fontSize:13}}>Nome do produto<input required maxLength={140} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ex.: Kit de produtos para casal"/></label>
    <label style={{display:"grid",gap:6,fontSize:13}}>Categoria<input required maxLength={60} value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Ex.: Vibradores, lingerie, acessórios"/></label>
    <label style={{display:"grid",gap:6,fontSize:13,gridColumn:"1 / -1"}}>Link do produto (HTTPS)<input required type="url" value={form.external_url} onChange={e=>setForm({...form,external_url:e.target.value})} placeholder="https://..."/></label>
    <label style={{display:"grid",gap:6,fontSize:13,gridColumn:"1 / -1"}}>Link da imagem (opcional)<input type="url" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://.../imagem.jpg"/></label>
    <label style={{display:"grid",gap:6,fontSize:13}}>Preço exibido (opcional)<input maxLength={80} value={form.price_label} onChange={e=>setForm({...form,price_label:e.target.value})} placeholder="Ex.: R$ 149,90 ou Consulte"/></label>
    <label style={{display:"grid",gap:6,fontSize:13}}>Descrição curta<textarea maxLength={1200} rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Detalhes que ajudam o visitante a escolher"/></label>
    <label style={{display:"flex",alignItems:"center",gap:9,fontSize:13}}><input type="checkbox" checked={form.is_published} onChange={e=>setForm({...form,is_published:e.target.checked})}/> Publicar na vitrine</label>
    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",gridColumn:"1 / -1"}}><button className="primaryButton" disabled={busy} type="submit">{busy?"Salvando…":editing?"Salvar alterações":"Adicionar à vitrine"}</button>{editing&&<button className="secondaryButton" type="button" onClick={reset}>Cancelar edição</button>}</div>
   </form>
  </section>
  <section><h2 style={{fontSize:22,fontWeight:850,marginBottom:14}}>Seus produtos ({items.length})</h2>{items.length===0?<p style={{opacity:.65}}>Sua vitrine está vazia. Adicione o primeiro produto acima.</p>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:16}}>{items.map(item=><article key={item.id} style={{overflow:"hidden",borderRadius:18,border:"1px solid #ffffff18",background:"#11131a"}}>{item.image_url?<img src={item.image_url} alt="" loading="lazy" style={{width:"100%",aspectRatio:"4 / 3",objectFit:"contain",background:"#08090d"}}/>:<div style={{aspectRatio:"4 / 3",display:"grid",placeItems:"center",background:"#08090d",color:"#E7C33F",fontWeight:900}}>PECATHO</div>}<div style={{padding:16}}><div style={{fontSize:11,color:"#E7C33F",fontWeight:800,textTransform:"uppercase"}}>{item.category} · {item.is_published?"Publicado":"Rascunho"}</div><h3 style={{fontSize:17,fontWeight:850,margin:"8px 0"}}>{item.title}</h3>{item.price_label&&<p style={{color:"#E7C33F",fontWeight:850}}>{item.price_label}</p>}{item.description&&<p style={{fontSize:13,opacity:.7,lineHeight:1.5}}>{item.description}</p>}<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}><button className="secondaryButton" onClick={()=>edit(item)}>Editar</button><button className="secondaryButton" onClick={()=>void remove(item.id)}>Excluir</button><a className="primaryButton" href={item.external_url} target="_blank" rel="noopener noreferrer sponsored">Ver produto</a></div></div></article>)}</div>}</section>
 </main>;
}
