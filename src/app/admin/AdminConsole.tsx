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

export default function AdminConsole({ role }: { role: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("visao");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [advertiserSearch, setAdvertiserSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<Advertiser | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", zone: "group", sort_order: "0", display: true, featured: false });
  const [stateForm, setStateForm] = useState({ id: "", uf: "", name: "" });
  const [cityForm, setCityForm] = useState({ id: "", state_id: "", name: "", ibge_code: "" });
  const [planForm, setPlanForm] = useState({ name: "", description: "", duration_days: "30", price: "0", free: false, active: true });
  const [advertiserForm, setAdvertiserForm] = useState({ user_id: "", title: "", display_name: "", category_id: "", state_id: "", city_id: "" });

  async function loadAll() {
    setLoading(true); setError("");
    const [cat, st, ci, adv, prof, pl] = await Promise.all([
      supabase.from("categories").select("id,name,zone,display,featured,sort_order").order("sort_order").order("name"),
      supabase.from("states").select("id,uf,name").order("name"),
      supabase.from("cities").select("id,state_id,name,ibge_code").order("name").limit(10000),
      supabase.from("advertiser_profiles").select("id,user_id,title,display_name,status,verification_status,category_id,state_id,city_id").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,email,display_name,username").order("display_name").limit(1000),
      supabase.from("publication_plans").select("id,name,description,duration_days,price,active,free").order("price"),
    ]);
    const firstError = [cat, st, ci, adv, prof, pl].find((r) => r.error)?.error;
    if (firstError) setError(firstError.message);
    setCategories((cat.data || []) as Category[]); setStates((st.data || []) as State[]); setCities((ci.data || []) as City[]); setAdvertisers((adv.data || []) as Advertiser[]); setProfiles((prof.data || []) as Profile[]); setPlans((pl.data || []) as Plan[]); setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function clearFeedback() { setMessage(""); setError(""); }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  function nextId(rows: { id: number }[]) { return rows.length ? Math.max(...rows.map((r) => Number(r.id))) + 1 : 1; }

  async function saveCategory(e: FormEvent) {
    e.preventDefault(); clearFeedback();
    const id = categoryForm.id ? Number(categoryForm.id) : nextId(categories);
    const { error: dbError } = await supabase.from("categories").upsert({ id, name: categoryForm.name.trim(), zone: categoryForm.zone || null, sort_order: Number(categoryForm.sort_order) || 0, display: categoryForm.display, featured: categoryForm.featured }, { onConflict: "id" });
    if (dbError) setError(dbError.message); else { setMessage("Categoria salva com sucesso."); setCategoryForm({ id: "", name: "", zone: "group", sort_order: "0", display: true, featured: false }); await loadAll(); }
  }

  async function saveState(e: FormEvent) {
    e.preventDefault(); clearFeedback();
    const id = stateForm.id ? Number(stateForm.id) : nextId(states);
    const uf = stateForm.uf.trim().toUpperCase();
    if (uf.length !== 2) { setError("A UF deve possuir exatamente 2 letras."); return; }
    const { error: dbError } = await supabase.from("states").upsert({ id, uf, name: stateForm.name.trim() }, { onConflict: "id" });
    if (dbError) setError(dbError.message); else { setMessage("Estado salvo com sucesso."); setStateForm({ id: "", uf: "", name: "" }); await loadAll(); }
  }

  async function saveCity(e: FormEvent) {
    e.preventDefault(); clearFeedback();
    const id = cityForm.id ? Number(cityForm.id) : nextId(cities);
    if (!cityForm.state_id) { setError("Selecione o Estado da cidade."); return; }
    const { error: dbError } = await supabase.from("cities").upsert({ id, state_id: Number(cityForm.state_id), name: cityForm.name.trim(), ibge_code: cityForm.ibge_code.trim() || null }, { onConflict: "id" });
    if (dbError) setError(dbError.message); else { setMessage("Cidade salva com sucesso."); setCityForm({ id: "", state_id: "", name: "", ibge_code: "" }); await loadAll(); }
  }

  async function savePlan(e: FormEvent) {
    e.preventDefault(); clearFeedback();
    const payload = { name: planForm.name.trim(), description: planForm.description.trim() || null, duration_days: Number(planForm.duration_days) || null, price: Number(planForm.price.replace(".", "").replace(",", ".")) || 0, free: planForm.free, active: planForm.active };
    const { error: dbError } = await supabase.from("publication_plans").insert(payload);
    if (dbError) setError(dbError.message); else { setMessage("Plano criado com sucesso."); setPlanForm({ name: "", description: "", duration_days: "30", price: "0", free: false, active: true }); await loadAll(); }
  }

  async function saveAdvertiser(e: FormEvent) {
    e.preventDefault(); clearFeedback();
    if (!advertiserForm.user_id || !advertiserForm.title) { setError("Selecione o usuário e informe o título do anúncio."); return; }
    const { error: dbError } = await supabase.from("advertiser_profiles").insert({ user_id: advertiserForm.user_id, title: advertiserForm.title.trim(), display_name: advertiserForm.display_name.trim() || null, category_id: advertiserForm.category_id ? Number(advertiserForm.category_id) : null, state_id: advertiserForm.state_id ? Number(advertiserForm.state_id) : null, city_id: advertiserForm.city_id ? Number(advertiserForm.city_id) : null, status: "draft", verification_status: "unverified", pricing: {}, service_options: {}, payment_options: {}, social_links: {} });
    if (dbError) setError(dbError.message); else { setMessage("Anúncio criado como rascunho."); setAdvertiserForm({ user_id: "", title: "", display_name: "", category_id: "", state_id: "", city_id: "" }); await loadAll(); }
  }

  async function updateAdvertiser(id: string, field: "status" | "verification_status", value: string) {
    clearFeedback(); const { error: dbError } = await supabase.from("advertiser_profiles").update({ [field]: value, ...(field === "status" && value === "published" ? { published_at: new Date().toISOString() } : {}) }).eq("id", id);
    if (dbError) setError(dbError.message); else { setMessage("Anúncio atualizado."); await loadAll(); }
  }

  async function removeRow(table: "categories" | "states" | "cities", id: number) {
    clearFeedback(); const { error: dbError } = await supabase.from(table).delete().eq("id", id);
    if (dbError) setError(dbError.message); else { setMessage("Registro removido."); await loadAll(); }
  }

  const filteredCategories = categories.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
  const filteredAdvertisers = advertisers.filter((a) => `${a.title} ${a.display_name || ""}`.toLowerCase().includes(advertiserSearch.toLowerCase()));
  const filteredCities = cities.filter((c) => !stateFilter || String(c.state_id) === stateFilter);
  const published = advertisers.filter((a) => a.status === "published").length;
  const pending = advertisers.filter((a) => a.verification_status === "pending" || a.status === "pending_review").length;

  const nav: [Tab, string][] = [["visao", "Visão geral"], ["anunciantes", "Anunciantes"], ["categorias", "Categorias"], ["localidades", "Localidades"], ["planos", "Planos de publicação"], ["verificacoes", "Verificações"]];

  return <main className="shell">
    <nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><div className="navLinks"><Link href="/anunciantes">Anunciantes</Link><Link href="/painel">Painel</Link><button type="button" className="navCta" onClick={signOut}>Sair</button></div></nav>
    <section className="hero" style={{ maxWidth: 1400 }}>
      <div className="eyebrow">ADMINISTRAÇÃO PECATHO</div>
      <h1>Centro de <em>gestão.</em></h1>
      <p className="heroCopy">Cadastros, anunciantes, publicação, localidades e verificações da plataforma principal. O serviço Fans permanece separado desta administração.</p>
      <div className="pillars" style={{ marginBottom: 28 }}>
        <article className="card"><div className="cardIcon">A</div><h2>Anunciantes</h2><p>{advertisers.length} cadastrados · {published} publicados</p></article>
        <article className="card"><div className="cardIcon">C</div><h2>Categorias</h2><p>{categories.length} categorias cadastradas</p></article>
        <article className="card"><div className="cardIcon">L</div><h2>Localidades</h2><p>{states.length} estados · {cities.length} cidades</p></article>
        <article className="card"><div className="cardIcon">V</div><h2>Validações</h2><p>{pending} item(ns) aguardando tratamento</p></article>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>{nav.map(([key, label]) => <button key={key} type="button" onClick={() => { setTab(key); clearFeedback(); }} className={tab === key ? "primaryButton" : "secondaryButton"}>{label}</button>)}</div>
      {message && <p className="formSuccess">{message}</p>}{error && <p className="formError">{error}</p>}
      {loading ? <div className="authCard"><p>Carregando dados administrativos...</p></div> : <>
        {tab === "visao" && <section className="pillars"><article className="card"><h2>Fluxo operacional</h2><p>1. Cadastrar usuário · 2. Criar anúncio · 3. Revisar dados · 4. Verificar · 5. Publicar.</p></article><article className="card"><h2>Atalhos</h2><p><Link href="/cadastro">Cadastro público</Link> · <Link href="/anunciantes">Busca pública</Link> · <Link href="/painel">Painel do anunciante</Link></p></article><article className="card"><h2>Perfil do anunciante</h2><p>O editor existente em /painel/anuncio é a área operacional para completar características, serviços, preços e localização.</p></article><article className="card"><h2>Fans</h2><p>O módulo de venda de conteúdo continua funcionalmente separado, apesar de compartilhar a identidade do ecossistema.</p></article></section>}
        {tab === "categorias" && <section className="authCard"><h2>Cadastro de categorias</h2><form onSubmit={saveCategory}><div className="formRow"><label>ID<input value={categoryForm.id} onChange={e => setCategoryForm({ ...categoryForm, id: e.target.value.replace(/\D/g, "") })} placeholder={`Automático: ${nextId(categories)}`} /></label><label>Nome<input required value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} /></label><label>Zona<input value={categoryForm.zone} onChange={e => setCategoryForm({ ...categoryForm, zone: e.target.value })} /></label><label>Ordem<input type="number" value={categoryForm.sort_order} onChange={e => setCategoryForm({ ...categoryForm, sort_order: e.target.value })} /></label></div><label><input type="checkbox" checked={categoryForm.display} onChange={e => setCategoryForm({ ...categoryForm, display: e.target.checked })} /> Exibir publicamente</label><label><input type="checkbox" checked={categoryForm.featured} onChange={e => setCategoryForm({ ...categoryForm, featured: e.target.checked })} /> Destaque</label><button className="primaryButton">Salvar categoria</button></form><hr /><label>Pesquisar<input value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder="Nome da categoria" /></label><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th>ID</th><th>Categoria</th><th>Zona</th><th>Exibição</th><th>Ações</th></tr></thead><tbody>{filteredCategories.map(c => <tr key={c.id}><td>{c.id}</td><td>{c.name}</td><td>{c.zone || "—"}</td><td>{c.display ? "Sim" : "Não"}</td><td><button className="secondaryButton" type="button" onClick={() => setCategoryForm({ id: String(c.id), name: c.name, zone: c.zone || "", sort_order: String(c.sort_order), display: c.display, featured: c.featured })}>Editar</button> <button className="secondaryButton" type="button" onClick={() => removeRow("categories", c.id)}>Excluir</button></td></tr>)}</tbody></table></div></section>}
        {tab === "localidades" && <section className="pillars"><article className="authCard"><h2>Estado</h2><form onSubmit={saveState}><label>ID<input value={stateForm.id} onChange={e => setStateForm({ ...stateForm, id: e.target.value.replace(/\D/g, "") })} placeholder={`Automático: ${nextId(states)}`} /></label><label>UF<input required maxLength={2} value={stateForm.uf} onChange={e => setStateForm({ ...stateForm, uf: e.target.value.toUpperCase() })} /></label><label>Nome<input required value={stateForm.name} onChange={e => setStateForm({ ...stateForm, name: e.target.value })} /></label><button className="primaryButton">Salvar Estado</button></form></article><article className="authCard"><h2>Cidade</h2><form onSubmit={saveCity}><label>ID<input value={cityForm.id} onChange={e => setCityForm({ ...cityForm, id: e.target.value.replace(/\D/g, "") })} placeholder={`Automático: ${nextId(cities)}`} /></label><label>Estado<select required value={cityForm.state_id} onChange={e => setCityForm({ ...cityForm, state_id: e.target.value })}><option value="">Selecione o Estado</option>{states.map(s => <option key={s.id} value={s.id}>{s.name} ({s.uf})</option>)}</select></label><label>Nome<input required value={cityForm.name} onChange={e => setCityForm({ ...cityForm, name: e.target.value })} /></label><label>Código IBGE<input value={cityForm.ibge_code} onChange={e => setCityForm({ ...cityForm, ibge_code: e.target.value.replace(/\D/g, "") })} /></label><button className="primaryButton">Salvar Cidade</button></form></article><article className="authCard" style={{ gridColumn: "1 / -1" }}><h2>Base territorial</h2><label>Filtrar por Estado<select value={stateFilter} onChange={e => setStateFilter(e.target.value)}><option value="">Todos os Estados</option>{states.map(s => <option key={s.id} value={s.id}>{s.name} ({s.uf})</option>)}</select></label><div style={{ maxHeight: 420, overflow: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th>ID</th><th>Cidade</th><th>Estado</th><th>IBGE</th><th>Ações</th></tr></thead><tbody>{filteredCities.map(c => { const s = states.find(x => x.id === c.state_id); return <tr key={c.id}><td>{c.id}</td><td>{c.name}</td><td>{s?.name || "—"}</td><td>{c.ibge_code || "—"}</td><td><button className="secondaryButton" type="button" onClick={() => setCityForm({ id: String(c.id), state_id: String(c.state_id || ""), name: c.name, ibge_code: c.ibge_code || "" })}>Editar</button></td></tr>})}</tbody></table></div></article></section>}
        {tab === "anunciantes" && <section className="authCard"><h2>Gestão de anunciantes</h2><form onSubmit={saveAdvertiser}><div className="formRow"><label>Usuário<select required value={advertiserForm.user_id} onChange={e => setAdvertiserForm({ ...advertiserForm, user_id: e.target.value })}><option value="">Selecione o usuário</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.display_name || p.username || "Sem nome"} — {p.email || p.id}</option>)}</select></label><label>Título do anúncio<input required value={advertiserForm.title} onChange={e => setAdvertiserForm({ ...advertiserForm, title: e.target.value })} /></label><label>Nome público<input value={advertiserForm.display_name} onChange={e => setAdvertiserForm({ ...advertiserForm, display_name: e.target.value })} /></label></div><div className="formRow"><label>Categoria<select value={advertiserForm.category_id} onChange={e => setAdvertiserForm({ ...advertiserForm, category_id: e.target.value })}><option value="">Selecione</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Estado<select value={advertiserForm.state_id} onChange={e => setAdvertiserForm({ ...advertiserForm, state_id: e.target.value, city_id: "" })}><option value="">Selecione</option>{states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Cidade<select value={advertiserForm.city_id} onChange={e => setAdvertiserForm({ ...advertiserForm, city_id: e.target.value })}><option value="">Selecione</option>{cities.filter(c => !advertiserForm.state_id || String(c.state_id) === advertiserForm.state_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><button className="primaryButton">Criar anúncio em rascunho</button></form><hr /><label>Pesquisar<input value={advertiserSearch} onChange={e => setAdvertiserSearch(e.target.value)} placeholder="Nome ou título" /></label><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th>Anúncio</th><th>Status</th><th>Verificação</th><th>Ações</th></tr></thead><tbody>{filteredAdvertisers.map(a => <tr key={a.id}><td><strong>{a.display_name || a.title}</strong><br /><small>{a.title}</small></td><td>{statusLabel[a.status] || a.status}</td><td>{statusLabel[a.verification_status] || a.verification_status}</td><td><button className="secondaryButton" type="button" onClick={async () => { setDetailBusy(true); setSelectedAdvertiser(a); const p=profiles.find(x=>x.id===a.user_id)||null; setSelectedProfile(p); const [ad,med,vc]=await Promise.all([supabase.from("user_addresses").select("*").eq("user_id",a.user_id).eq("is_primary",true).maybeSingle(),supabase.from("profile_media").select("*").eq("profile_id",a.id).order("sort_order"),supabase.from("verification_cases").select("*").eq("user_id",a.user_id).order("created_at",{ascending:false}).limit(1).maybeSingle()]); setSelectedAddress(ad.data); setSelectedMedia(med.data||[]); setSelectedVerification(vc.data); setDetailBusy(false); }}>Ver dados</button><button className="secondaryButton" type="button" onClick={() => updateAdvertiser(a.id, "status", a.status === "published" ? "paused" : "published")}>{a.status === "published" ? "Pausar" : "Publicar"}</button></td></tr>)}</tbody></table></div></section>}
        {tab === "planos" && <section className="authCard"><h2>Planos de publicação</h2><form onSubmit={savePlan}><div className="formRow"><label>Nome<input required value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} /></label><label>Duração (dias)<input type="number" min="1" value={planForm.duration_days} onChange={e => setPlanForm({ ...planForm, duration_days: e.target.value })} /></label><label>Valor (R$)<input value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })} /></label></div><label>Descrição<textarea rows={3} value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} /></label><label><input type="checkbox" checked={planForm.free} onChange={e => setPlanForm({ ...planForm, free: e.target.checked })} /> Plano gratuito</label><label><input type="checkbox" checked={planForm.active} onChange={e => setPlanForm({ ...planForm, active: e.target.checked })} /> Ativo</label><button className="primaryButton">Criar plano</button></form><hr /><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th>Plano</th><th>Duração</th><th>Valor</th><th>Status</th></tr></thead><tbody>{plans.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.duration_days ? `${p.duration_days} dias` : "—"}</td><td>{p.free ? "Grátis" : `R$ ${Number(p.price).toFixed(2).replace(".", ",")}`}</td><td>{p.active ? "Ativo" : "Inativo"}</td></tr>)}</tbody></table></section>}
        {tab === "verificacoes" && <section className="authCard"><h2>Fila de verificação</h2><p>O administrador pode validar ou rejeitar a situação do anúncio sem alterar o conteúdo Fans.</p><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th>Anúncio</th><th>Publicação</th><th>Verificação</th><th>Ações</th></tr></thead><tbody>{advertisers.map(a => <tr key={a.id}><td>{a.display_name || a.title}</td><td>{statusLabel[a.status] || a.status}</td><td>{statusLabel[a.verification_status] || a.verification_status}</td><td><button className="secondaryButton" type="button" onClick={async()=>{setDetailBusy(true);setSelectedAdvertiser(a);setSelectedProfile(profiles.find(x=>x.id===a.user_id)||null);const [ad,med,vc]=await Promise.all([supabase.from("user_addresses").select("*").eq("user_id",a.user_id).eq("is_primary",true).maybeSingle(),supabase.from("profile_media").select("*").eq("profile_id",a.id).order("sort_order"),supabase.from("verification_cases").select("*").eq("user_id",a.user_id).order("created_at",{ascending:false}).limit(1).maybeSingle()]);setSelectedAddress(ad.data);setSelectedMedia(med.data||[]);setSelectedVerification(vc.data);setDetailBusy(false);}}>Ver dados</button><button className="secondaryButton" type="button" onClick={() => updateAdvertiser(a.id, "verification_status", "verified")}>Aprovar</button><button className="secondaryButton" type="button" onClick={() => updateAdvertiser(a.id, "verification_status", "rejected")}>Rejeitar</button></td></tr>)}</tbody></table></div></section>}
      </>}
      {selectedAdvertiser && <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.72)",padding:"24px",overflow:"auto"}}><div className="authCard" style={{maxWidth:1100,margin:"20px auto",background:"#10131a"}}><div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center"}}><div><div className="eyebrow">ANÁLISE ADMINISTRATIVA</div><h2>{selectedAdvertiser.display_name || selectedAdvertiser.title}</h2></div><button className="secondaryButton" type="button" onClick={()=>setSelectedAdvertiser(null)}>Fechar</button></div><div className="pillars"><article className="card"><h2>Usuário</h2><p><strong>Nome:</strong> {selectedProfile?.display_name || "Não informado"}<br/><strong>E-mail:</strong> {selectedProfile?.email || "Não informado"}<br/><strong>CPF:</strong> {formatCpf((selectedProfile as any)?.cpf || null)}<br/><strong>Telefone:</strong> {formatPhone((selectedProfile as any)?.phone || null)}<br/><strong>Nascimento:</strong> {(selectedProfile as any)?.birth_date || "Não informado"}</p></article><article className="card"><h2>Anúncio</h2><p><strong>Título:</strong> {selectedAdvertiser.title}<br/><strong>Status:</strong> {statusLabel[selectedAdvertiser.status] || selectedAdvertiser.status}<br/><strong>Verificação:</strong> {statusLabel[selectedAdvertiser.verification_status] || selectedAdvertiser.verification_status}</p></article><article className="card"><h2>Endereço</h2><p>{selectedAddress ? <>{selectedAddress.zipcode}<br/>{selectedAddress.street}, {selectedAddress.number}<br/>{selectedAddress.complement || ""}<br/>Estado ID: {selectedAddress.state_id} · Cidade ID: {selectedAddress.city_id}<br/><strong>Coordenadas:</strong> {selectedAddress.latitude ?? "—"}, {selectedAddress.longitude ?? "—"}</> : "Endereço não informado."}</p></article><article className="card"><h2>Verificação</h2><p>{selectedVerification ? <>Status: {selectedVerification.status}<br/>Enviada em: {selectedVerification.submitted_at || "—"}<br/>Revisada em: {selectedVerification.reviewed_at || "—"}<br/>Motivo: {selectedVerification.rejection_reason || "—"}</> : "Nenhum caso de verificação registrado."}</p></article></div><h2 style={{marginTop:24}}>Mídias do anúncio</h2>{selectedMedia.length ? <div className="pillars">{selectedMedia.map(m=>{ const url=supabase.storage.from(m.storage_bucket||"pecatho-media").getPublicUrl(m.storage_path).data.publicUrl; return <article className="card" key={m.id}><p><strong>{m.original_filename || m.storage_path}</strong></p><p>Tipo: {m.mime_type || "—"} · Moderação: {m.moderation_status}</p>{m.kind==="image" ? <img src={url} alt={m.original_filename || "Mídia do anúncio"} style={{width:"100%",maxHeight:360,objectFit:"contain",borderRadius:10}}/> : m.kind==="video" ? <video src={url} controls style={{width:"100%",maxHeight:420,borderRadius:10}}/> : <a href={url} target="_blank" rel="noreferrer">Abrir arquivo</a>}</article>})}</div> : <p className="fieldNote">Nenhuma mídia cadastrada.</p>}<div style={{display:"flex",gap:10,marginTop:24}}><button className="primaryButton" type="button" onClick={async()=>{await updateAdvertiser(selectedAdvertiser.id,"verification_status","verified");setSelectedAdvertiser(null);}}>Aprovar anúncio</button><button className="secondaryButton" type="button" onClick={async()=>{await updateAdvertiser(selectedAdvertiser.id,"verification_status","rejected");setSelectedAdvertiser(null);}}>Rejeitar anúncio</button></div></div></div>}
      <p style={{ marginTop: 24, opacity: .7 }}>Perfil administrativo atual: {role === "super_admin" ? "Superadministrador" : role === "admin" ? "Administrador" : role}.</p>
    </section>
  </main>;
}
