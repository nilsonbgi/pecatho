"use client";
import { FormEvent,useEffect,useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Row={id:number;name:string;state_id?:number|null};

export default function AnuncioPage(){
 const supabase=createClient();
 const [title,setTitle]=useState(""); const [name,setName]=useState(""); const [summary,setSummary]=useState(""); const [description,setDescription]=useState("");
 const [stateId,setStateId]=useState(""); const [cityId,setCityId]=useState(""); const [categoryId,setCategoryId]=useState("");
 const [states,setStates]=useState<Row[]>([]); const [cities,setCities]=useState<Row[]>([]); const [categories,setCategories]=useState<Row[]>([]);
 const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 useEffect(()=>{(async()=>{const a=await supabase.from("states").select("id,uf,name").order("name");const b=await supabase.from("cities").select("id,name,state_id").order("name").limit(5000);const c=await supabase.from("categories").select("id,name").eq("display",true).order("sort_order");setStates(a.data||[]);setCities(b.data||[]);setCategories(c.data||[])})()},[]);
 const visibleCities=cities.filter(c=>!stateId||String(c.state_id)===stateId);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");setError("");const {data:{user}}=await supabase.auth.getUser();if(!user){window.location.href="/login";return}
 const {data:old}=await supabase.from("advertiser_profiles").select("id").eq("user_id",user.id).maybeSingle();
 const payload={title,display_name:name,summary,description,state_id:stateId?Number(stateId):null,city_id:cityId?Number(cityId):null,category_id:categoryId?Number(categoryId):null};
 const result=old?await supabase.from("advertiser_profiles").update(payload).eq("id",old.id):await supabase.from("advertiser_profiles").insert({...payload,user_id:user.id,status:"draft",verification_status:"unverified",pricing:{},service_options:{},payment_options:{},social_links:{},views:0});
 if(result.error)setError("Não foi possível salvar o anúncio. "+result.error.message);else setMessage("Anúncio salvo como rascunho.");setBusy(false);
 }
 return <main className="shell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><Link href="/painel" className="navCta">Voltar ao painel</Link></nav><section className="hero authHero"><div className="eyebrow">MEU ANÚNCIO</div><h1>Construa sua <em>presença.</em></h1><p className="heroCopy">Comece pelos dados essenciais. O anúncio permanecerá em rascunho até atender aos requisitos de publicação.</p><form className="authCard" onSubmit={submit}>
 <label>Título do anúncio<input value={title} onChange={e=>setTitle(e.target.value)} required maxLength={120}/></label>
 <label>Nome de exibição<input value={name} onChange={e=>setName(e.target.value)} maxLength={100}/></label>
 <label>Resumo<input value={summary} onChange={e=>setSummary(e.target.value)} maxLength={280}/></label>
 <label>Descrição<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={7} maxLength={5000}/></label>
 <label>Estado<select value={stateId} onChange={e=>{setStateId(e.target.value);setCityId("")}}><option value="">Selecione o estado</option>{states.map(s=><option key={s.id} value={s.id}>{s.uf} — {s.name}</option>)}</select></label>
 <label>Cidade<select value={cityId} onChange={e=>setCityId(e.target.value)} disabled={!stateId}><option value="">Selecione a cidade</option>{visibleCities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label>Categoria<select value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Selecione a categoria</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 {error&&<p className="formError">{error}</p>}{message&&<p className="formSuccess">{message}</p>}<button className="primaryButton" disabled={busy}>{busy?"Salvando...":"Salvar rascunho"}</button>
 </form></section></main>
}