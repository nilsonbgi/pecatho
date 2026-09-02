"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

type Tab = "visao" | "anunciantes" | "categorias" | "localidades" | "planos" | "verificacoes";
type Category = { id: number; name: string; zone: string | null; display: boolean; featured: boolean; sort_order: number };
type State = { id: number; uf: string; name: string };
type City = { id: number; state_id: number | null; name: string; ibge_code: string | null };
type Advertiser = { id: string; user_id: string; title: string; display_name: string | null; status: string; verification_status: string; category_id: number | null; state_id: number | null; city_id: number | null };
type Profile = { id: string; email: string | null; display_name: string | null; username: string | null };
type Plan = { id: string; name: string; description: string | null; duration_days: number | null; price: number; active: boolean; free: boolean };

function formatCpf(value: string | null) { if (!value) return "Não informado"; const d=value.replace(/\D/g,""); return d.length===11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4") : value; }
function formatPhone(value: string | null) { return value || "Não informado"; }
const statusLabel: Record<string, string> = { draft: "Rascunho", pending_review: "Em análise", published: "Publicado", paused: "Pausado", suspended: "Suspenso", archived: "Arquivado", unverified: "Não verificada", pending: "Pendente", verified: "Verificada", rejected: "Rejeitada", expired: "Expirada" };
const emptyPlan = () => ({ id: "", name: "", description: "", duration_days: "30", price: "0,00", free: false, active: true });

export default function AdminConsole({ role }: { role: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("visao");
  const [loading, setLoading] = useState(true), [message, setMessage] = useState(""), [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]), [states, setStates] = useState<State[]>([]), [cities, setCities] = useState<City[]>([]), [advertisers, setAdvertisers] = useState<Advertiser[]>([]), [profiles, setProfiles] = useState<Profile[]>([]), [plans, setPlans] = useState<Plan[]>([]);
  const [categorySearch, setCategorySearch] = useState(""), [advertiserSearch, setAdvertiserSearch] = useState(""), [stateFilter, setStateFilter] = useState("");
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<Advertiser | null>(null), [selectedProfile, setSelectedProfile] = useState<Profile | null>(null), [selectedAddress, setSelectedAddress] = useState<any>(null), [selectedMedia, setSelectedMedia] = useState<any[]>([]), [selectedVerification, setSelectedVerification] = useState<any>(null), [detailBusy, setDetailBusy] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", zone: "group", sort_order: "0", display: true, featured: false });
  const [stateForm, setStateForm] = useState({ id: "", uf: "", name: "" });
  const [cityForm, setCityForm] = useState({ id: "", state_id: "", name: "", ibge_code: "" });
  const [planForm, setPlanForm] = useState(emptyPlan());
  const [advertiserForm, setAdvertiserForm] = useState({ user_id: "", title: "", display_name: "", category_id: "", state_id: "", city_id: "" });

  async function loadAll() { setLoading(true); setError(""); const [cat,st,ci,adv,prof,pl]=await Promise.all([supabase.from("categories").select("id,name,zone,display,featured,sort_order").order("sort_order").order("name"),supabase.from("states").select("id,uf,name").order("name"),supabase.from("cities").select("id,state_id,name,ibge_code").order("name").limit(10000),supabase.from("advertiser_profiles").select("id,user_id,title,display_name,status,verification_status,category_id,state_id,city_id").order("created_at",{ascending:false}),supabase.from("profiles").select("id,email,display_name,username").order("display_name").limit(1000),supabase.from("publication_plans").select("id,name,description,duration_days,price,active,free").order("price")]); setCategories((cat.data||[]) as Category[]);setStates((st.data||[]) as State[]);setCities((ci.data||[]) as City[]);setAdvertisers((adv.data||[]) as Advertiser[]);setProfiles((prof.data||[]) as Profile[]);setPlans((pl.data||[]) as Plan[]);setLoading(false); }
  function clearFeedback(){setMessage("");setError("");}
  async function savePlan(e: FormEvent) { e.preventDefault(); clearFeedback(); const normalized=planForm.price.trim().replace(/\s/g,"").replace(/\./g,"").replace(",","."); const price=planForm.free?0:Number(normalized); if(!planForm.name.trim()){setError("Informe o nome do plano.");return;} if(!planForm.free&&(!Number.isFinite(price)||price<0)){setError("Informe um valor válido para o plano.");return;} const payload={name:planForm.name.trim(),description:planForm.description.trim()||null,duration_days:Number(planForm.duration_days)||null,price,free:planForm.free,active:planForm.active}; const result=planForm.id?await supabase.from("publication_plans").update(payload).eq("id",planForm.id):await supabase.from("publication_plans").insert(payload); if(result.error)setError(result.error.message);else{setMessage(planForm.id?"Plano atualizado com sucesso.":"Plano criado com sucesso.");setPlanForm(emptyPlan());await loadAll();} }

  useEffect(()=>{loadAll()},[]);
  if(loading)return <main className="pageShell"><section className="panel"><h1>Administração Pecatho</h1><p>Carregando dados...</p></section></main>;
  return <main className="pageShell"><section className="panel"><h1>Administração Pecatho</h1><nav>{(["visao","anunciantes","categorias","localidades","planos","verificacoes"] as Tab[]).map(t=><button key={t} type="button" onClick={()=>setTab(t)}>{t==="visao"?"Visão geral":t==="anunciantes"?"Anunciantes":t==="categorias"?"Categorias":t==="localidades"?"Localidades":t==="planos"?"Planos de publicação":"Verificações"}</button>)}</nav>{message&&<p>{message}</p>}{error&&<p role="alert">{error}</p>}
  {tab==="planos"&&<section><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><h2>Planos de publicação</h2><p>{planForm.id?"Editando plano existente. As alterações serão gravadas no mesmo plano.":"Cadastre e gerencie os planos disponíveis para os anunciantes."}</p></div>{planForm.id&&<button type="button" onClick={()=>setPlanForm(emptyPlan())}>Cancelar edição</button>}</div><form onSubmit={savePlan}><label>Nome<input value={planForm.name} onChange={e=>setPlanForm({...planForm,name:e.target.value})}/></label><label>Descrição<textarea value={planForm.description} onChange={e=>setPlanForm({...planForm,description:e.target.value})}/></label><label>Duração (dias)<input inputMode="numeric" value={planForm.duration_days} onChange={e=>setPlanForm({...planForm,duration_days:e.target.value.replace(/\D/g,"")})}/></label><label>Valor (R$)<input inputMode="decimal" placeholder="0,00" disabled={planForm.free} value={planForm.price} onChange={e=>setPlanForm({...planForm,price:e.target.value.replace(/[^0-9,.]/g,"")})}/></label><label><input type="checkbox" checked={planForm.free} onChange={e=>setPlanForm({...planForm,free:e.target.checked,price:e.target.checked?"0,00":planForm.price})}/> Plano gratuito</label><label><input type="checkbox" checked={planForm.active} onChange={e=>setPlanForm({...planForm,active:e.target.checked})}/> Ativo</label><button type="submit">{planForm.id?"Atualizar plano":"Criar plano"}</button></form><table><thead><tr><th>Plano</th><th>Duração</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>{plans.map(p=><tr key={p.id}><td>{p.name}</td><td>{p.duration_days?`${p.duration_days} dias`:"—"}</td><td>{p.free?"Grátis":`R$ ${Number(p.price).toFixed(2).replace(".",",")}`}</td><td>{p.active?"Ativo":"Inativo"}</td><td><button type="button" onClick={()=>setPlanForm({id:p.id,name:p.name,description:p.description||"",duration_days:String(p.duration_days||30),price:Number(p.price).toFixed(2).replace(".",","),free:p.free,active:p.active})}>Editar</button></td></tr>)}</tbody></table></section>}
  {tab!=="planos"&&<section><h2>{tab==="visao"?"Visão geral":tab==="anunciantes"?"Anunciantes":tab==="categorias"?"Categorias":tab==="localidades"?"Localidades":"Verificações"}</h2><p>Seção administrativa disponível.</p></section>}</section></main>;
}