"use client";

import "./admin-redesign.css";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Tab = "visao" | "anunciantes" | "categorias" | "localidades" | "planos" | "verificacoes";
type Category = { id: number; name: string; zone: string | null; display: boolean; featured: boolean; sort_order: number };
type State = { id: number; uf: string; name: string };
type City = { id: number; state_id: number | null; name: string; ibge_code: string | null };
type Advertiser = { id: string; user_id: string; title: string; display_name: string | null; status: string; verification_status: string; category_id: number | null; state_id: number | null; city_id: number | null };
type Profile = { id: string; email: string | null; display_name: string | null; username: string | null };
type Plan = { id: string; name: string; description: string | null; duration_days: number | null; price: number; active: boolean; free: boolean; audience: "companion" | "content_seller" | "both"; has_video: boolean; featured_card: boolean; search_priority: number; show_premium_badge: boolean; profile_theme: "standard" | "highlighted" | "premium"; max_gallery_items: number | null; features: Record<string, unknown> | null };

const statusLabel: Record<string, string> = { draft: "Rascunho", pending_review: "Em análise", published: "Publicado", paused: "Pausado", suspended: "Suspenso", archived: "Arquivado", unverified: "Não verificada", pending: "Pendente", verified: "Verificada", rejected: "Rejeitada", expired: "Expirada" };

export default function AdminConsole({ role }: { role: string }) {
  const supabase = useMemo(() => createClient(), []);
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

  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", zone: "group", sort_order: "0", display: true, featured: false });
  const [stateForm, setStateForm] = useState({ id: "", uf: "", name: "" });
  const [cityForm, setCityForm] = useState({ id: "", state_id: "", name: "", ibge_code: "" });
  const [planForm, setPlanForm] = useState({ id: "", name: "", description: "", duration_days: "30", price: "0", free: false, active: true, audience: "companion" as "companion" | "content_seller" | "both", has_video: false, featured_card: false, search_priority: "0", show_premium_badge: false, profile_theme: "standard" as "standard" | "highlighted" | "premium", max_gallery_items: "", photo_gallery: true, video_gallery: false, featured_photo: false, featured_video: false, highlight_card_photo: false, advertiser_gallery: true, profile_audio: false, allow_reviews: true, allow_gifts: false, max_photos: "", max_videos: "" });
  const [planFeaturesExtras, setPlanFeaturesExtras] = useState<Record<string, unknown>>({});
  const [advertiserForm, setAdvertiserForm] = useState({ user_id: "", title: "", display_name: "", category_id: "", state_id: "", city_id: "" });

  async function loadAll() {
    const [cat, st, ci, adv, prof, pl] = await Promise.all([
      supabase.from("categories").select("id,name,zone,display,featured,sort_order").order("sort_order").order("name"),
      supabase.from("states").select("id,uf,name").order("name"),
      supabase.from("cities").select("id,state_id,name,ibge_code").order("name").limit(10000),
      supabase.from("advertiser_profiles").select("id,user_id,title,display_name,status,verification_status,category_id,state_id,city_id").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,email,display_name,username").order("display_name").limit(1000),
      supabase.from("publication_plans").select("id,name,description,duration_days,price,active,free,audience,has_video,featured_card,search_priority,show_premium_badge,profile_theme,max_gallery_items,features").order("price"),
    ]);
    const firstError = [cat, st, ci, adv, prof, pl].find((r) => r.error)?.error;
    if (firstError) setError(firstError.message);
    setCategories((cat.data || []) as Category[]); setStates((st.data || []) as State[]); setCities((ci.data || []) as City[]); setAdvertisers((adv.data || []) as Advertiser[]); setProfiles((prof.data || []) as Profile[]); setPlans((pl.data || []) as Plan[]); setLoading(false);
  }

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase.from("categories").select("id,name,zone,display,featured,sort_order").order("sort_order").order("name"),
      supabase.from("states").select("id,uf,name").order("name"),
      supabase.from("cities").select("id,state_id,name,ibge_code").order("name").limit(10000),
      supabase.from("advertiser_profiles").select("id,user_id,title,display_name,status,verification_status,category_id,state_id,city_id").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,email,display_name,username").order("display_name").limit(1000),
      supabase.from("publication_plans").select("id,name,description,duration_days,price,active,free,audience,has_video,featured_card,search_priority,show_premium_badge,profile_theme,max_gallery_items,features").order("price"),
    ]).then(([cat, st, ci, adv, prof, pl]) => {
      if (!active) return;
      const firstError = [cat, st, ci, adv, prof, pl].find((result) => result.error)?.error;
      if (firstError) setError(firstError.message);
      setCategories((cat.data || []) as Category[]); setStates((st.data || []) as State[]); setCities((ci.data || []) as City[]); setAdvertisers((adv.data || []) as Advertiser[]); setProfiles((prof.data || []) as Profile[]); setPlans((pl.data || []) as Plan[]); setLoading(false);
    });
    return () => { active = false; };
  }, [supabase]);

  function clearFeedback() { setMessage(""); setError(""); }
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
    const rawPrice = planForm.price.trim();
    const normalizedPrice = rawPrice.includes(",") ? rawPrice.replace(/\\./g, "").replace(",", ".") : rawPrice;
    const parsedPrice = planForm.free ? 0 : Number(normalizedPrice);
    const duration = Number(planForm.duration_days);
    const priority = Number(planForm.search_priority);
    const maxGallery = planForm.max_gallery_items.trim() === "" ? null : Number(planForm.max_gallery_items);
    const maxPhotos = planForm.max_photos.trim() === "" ? null : Number(planForm.max_photos);
    const maxVideos = planForm.max_videos.trim() === "" ? null : Number(planForm.max_videos);
    if (!planForm.name.trim()) { setError("Informe o nome do plano."); return; }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0 || (!planForm.free && parsedPrice <= 0)) { setError("Planos gratuitos devem custar R$ 0,00 e planos pagos precisam ter valor maior que zero."); return; }
    if (!Number.isInteger(duration) || duration < 1 || duration > 365) { setError("A duração deve ficar entre 1 e 365 dias."); return; }
    if (!Number.isInteger(priority) || priority < 0 || priority > 100) { setError("A prioridade nas pesquisas deve ficar entre 0 e 100."); return; }
    if (maxGallery !== null && (!Number.isInteger(maxGallery) || maxGallery < 1 || maxGallery > 500)) { setError("O limite total da galeria deve ficar entre 1 e 500 itens."); return; }
    if (maxPhotos !== null && (!Number.isInteger(maxPhotos) || maxPhotos < 1 || maxPhotos > 500)) { setError("O limite de fotos deve ficar entre 1 e 500."); return; }
    if (maxVideos !== null && (!Number.isInteger(maxVideos) || maxVideos < 1 || maxVideos > 200)) { setError("O limite de vídeos deve ficar entre 1 e 200."); return; }
    const features: Record<string, unknown> = {
      ...planFeaturesExtras,
      photo_gallery: planForm.photo_gallery,
      video_gallery: planForm.video_gallery,
      featured_photo: planForm.featured_photo,
      featured_video: planForm.featured_video,
      highlight_card_photo: planForm.highlight_card_photo,
      advertiser_gallery: planForm.advertiser_gallery,
      profile_audio: planForm.profile_audio,
      allow_reviews: planForm.allow_reviews,
      allow_gifts: planForm.allow_gifts,
    };
    if (maxPhotos === null) delete features.max_photos; else features.max_photos = maxPhotos;
    if (maxVideos === null) delete features.max_videos; else features.max_videos = maxVideos;
    const result = await supabase.rpc("admin_save_pecatho_publication_plan", {
      p_plan_id: planForm.id || null, p_name: planForm.name.trim(),
      p_description: planForm.description.trim() || null, p_duration_days: duration,
      p_price: parsedPrice, p_active: planForm.active, p_free: planForm.free,
      p_audience: planForm.audience, p_has_video: planForm.has_video || planForm.video_gallery,
      p_featured_card: planForm.featured_card, p_search_priority: priority,
      p_show_premium_badge: planForm.show_premium_badge, p_profile_theme: planForm.profile_theme,
      p_max_gallery_items: maxGallery, p_features: features,
    });
    if (result.error) setError(result.error.message);
    else {
      setMessage(planForm.id ? "Plano e diferenciais atualizados com sucesso." : "Plano criado com diferenciais configurados.");
      setPlanForm({ id: "", name: "", description: "", duration_days: "30", price: "0", free: false, active: true, audience: "companion", has_video: false, featured_card: false, search_priority: "0", show_premium_badge: false, profile_theme: "standard", max_gallery_items: "", photo_gallery: true, video_gallery: false, featured_photo: false, featured_video: false, highlight_card_photo: false, advertiser_gallery: true, profile_audio: false, allow_reviews: true, allow_gifts: false, max_photos: "", max_videos: "" });
      setPlanFeaturesExtras({});
      await loadAll();
    }
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

  return <main className="shell adminConsoleShell">
    <nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><div className="navLinks"><Link href="/anunciantes">Anunciantes</Link><Link href="/admin/premium">Planos Premium</Link><Link href="/admin/publicidade">Publicidade e banners</Link><Link href="/painel" className="navCta">Painel</Link></div></nav>
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
        {tab === "anunciantes" && <section className="authCard"><h2>Gestão de anunciantes</h2><form onSubmit={saveAdvertiser}><div className="formRow"><label>Usuário<select required value={advertiserForm.user_id} onChange={e => setAdvertiserForm({ ...advertiserForm, user_id: e.target.value })}><option value="">Selecione o usuário</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.display_name || p.username || "Sem nome"} — {p.email || p.id}</option>)}</select></label><label>Título do anúncio<input required value={advertiserForm.title} onChange={e => setAdvertiserForm({ ...advertiserForm, title: e.target.value })} /></label><label>Nome público<input value={advertiserForm.display_name} onChange={e => setAdvertiserForm({ ...advertiserForm, display_name: e.target.value })} /></label></div><div className="formRow"><label>Categoria<select value={advertiserForm.category_id} onChange={e => setAdvertiserForm({ ...advertiserForm, category_id: e.target.value })}><option value="">Selecione</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Estado<select value={advertiserForm.state_id} onChange={e => setAdvertiserForm({ ...advertiserForm, state_id: e.target.value, city_id: "" })}><option value="">Selecione</option>{states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Cidade<select value={advertiserForm.city_id} onChange={e => setAdvertiserForm({ ...advertiserForm, city_id: e.target.value })}><option value="">Selecione</option>{cities.filter(c => !advertiserForm.state_id || String(c.state_id) === advertiserForm.state_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><button className="primaryButton">Criar anúncio em rascunho</button></form><hr /><label>Pesquisar<input value={advertiserSearch} onChange={e => setAdvertiserSearch(e.target.value)} placeholder="Nome ou título" /></label><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th>Anúncio</th><th>Status</th><th>Verificação</th><th>Ações</th></tr></thead><tbody>{filteredAdvertisers.map(a => <tr key={a.id}><td><strong>{a.display_name || a.title}</strong><br /><small>{a.title}</small></td><td>{statusLabel[a.status] || a.status}</td><td>{statusLabel[a.verification_status] || a.verification_status}</td><td><button className="secondaryButton" type="button" onClick={() => updateAdvertiser(a.id, "status", a.status === "published" ? "paused" : "published")}>{a.status === "published" ? "Pausar" : "Publicar"}</button><button className="secondaryButton" type="button" onClick={() => updateAdvertiser(a.id, "verification_status", "verified")}>Validar</button></td></tr>)}</tbody></table></div></section>}
        {tab === "planos" && <section className="authCard"><h2>Planos de publicação e diferenciais</h2><p>Configure os recursos de cada plano. Os valores e as assinaturas existentes só são alterados quando você salva explicitamente um plano.</p><form onSubmit={savePlan}><div className="formRow"><label>Nome<input required value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} /></label><label>Público do plano<select value={planForm.audience} onChange={e => setPlanForm({ ...planForm, audience: e.target.value as "companion" | "content_seller" | "both" })}><option value="companion">Acompanhantes</option><option value="content_seller">Vendedores de conteúdo</option><option value="both">Ambos os públicos</option></select></label><label>Duração (dias)<input type="number" min="1" max="365" required value={planForm.duration_days} onChange={e => setPlanForm({ ...planForm, duration_days: e.target.value })} /></label><label>Valor (R$)<input inputMode="decimal" disabled={planForm.free} value={planForm.free ? "0,00" : planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })} /></label></div><label>Descrição<textarea rows={3} value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} /></label><div className="formRow"><label>Prioridade nas pesquisas (0–100)<input type="number" min="0" max="100" required value={planForm.search_priority} onChange={e => setPlanForm({ ...planForm, search_priority: e.target.value })} /><small>Maior prioridade coloca o perfil acima dos planos de menor prioridade, respeitando os filtros.</small></label><label>Tema do perfil<select value={planForm.profile_theme} onChange={e => setPlanForm({ ...planForm, profile_theme: e.target.value as "standard" | "highlighted" | "premium" })}><option value="standard">Padrão</option><option value="highlighted">Em destaque</option><option value="premium">Premium</option></select></label><label>Limite total da galeria<input type="number" min="1" max="500" placeholder="Sem limite total" value={planForm.max_gallery_items} onChange={e => setPlanForm({ ...planForm, max_gallery_items: e.target.value })} /></label></div><h3>Destaque e visibilidade</h3><div className="formRow"><label><input type="checkbox" checked={planForm.featured_card} onChange={e => setPlanForm({ ...planForm, featured_card: e.target.checked })} /> Card especial com destaque</label><label><input type="checkbox" checked={planForm.show_premium_badge} onChange={e => setPlanForm({ ...planForm, show_premium_badge: e.target.checked })} /> Selo Premium no card e perfil</label><label><input type="checkbox" checked={planForm.has_video} onChange={e => setPlanForm({ ...planForm, has_video: e.target.checked, video_gallery: e.target.checked || planForm.video_gallery })} /> Permitir vídeos no plano</label></div><h3>Galeria e recursos do perfil</h3><div className="formRow"><label><input type="checkbox" checked={planForm.photo_gallery} onChange={e => setPlanForm({ ...planForm, photo_gallery: e.target.checked })} /> Galeria de fotos</label><label><input type="checkbox" checked={planForm.video_gallery} onChange={e => setPlanForm({ ...planForm, video_gallery: e.target.checked, has_video: e.target.checked || planForm.has_video })} /> Galeria de vídeos</label><label><input type="checkbox" checked={planForm.advertiser_gallery} onChange={e => setPlanForm({ ...planForm, advertiser_gallery: e.target.checked })} /> Galeria pública do anúncio</label><label><input type="checkbox" checked={planForm.featured_photo} onChange={e => setPlanForm({ ...planForm, featured_photo: e.target.checked })} /> Foto em destaque</label><label><input type="checkbox" checked={planForm.featured_video} onChange={e => setPlanForm({ ...planForm, featured_video: e.target.checked })} /> Vídeo em destaque</label><label><input type="checkbox" checked={planForm.highlight_card_photo} onChange={e => setPlanForm({ ...planForm, highlight_card_photo: e.target.checked })} /> Foto diferenciada no card</label><label><input type="checkbox" checked={planForm.profile_audio} onChange={e => setPlanForm({ ...planForm, profile_audio: e.target.checked })} /> Áudio no perfil</label><label><input type="checkbox" checked={planForm.allow_reviews} onChange={e => setPlanForm({ ...planForm, allow_reviews: e.target.checked })} /> Receber avaliações</label><label><input type="checkbox" checked={planForm.allow_gifts} onChange={e => setPlanForm({ ...planForm, allow_gifts: e.target.checked })} /> Receber presentes virtuais</label></div><div className="formRow"><label>Limite de fotos<input type="number" min="1" max="500" placeholder="Sem limite específico" value={planForm.max_photos} onChange={e => setPlanForm({ ...planForm, max_photos: e.target.value })} /></label><label>Limite de vídeos<input type="number" min="1" max="200" placeholder="Sem limite específico" value={planForm.max_videos} onChange={e => setPlanForm({ ...planForm, max_videos: e.target.value })} /></label></div><div className="formRow"><label><input type="checkbox" checked={planForm.free} onChange={e => setPlanForm({ ...planForm, free: e.target.checked, price: e.target.checked ? "0" : (Number(planForm.price.replace(",", ".")) > 0 ? planForm.price : "") })} /> Plano gratuito (R$ 0,00)</label><label><input type="checkbox" checked={planForm.active} onChange={e => setPlanForm({ ...planForm, active: e.target.checked })} /> Disponível para contratação</label></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="primaryButton">{planForm.id ? "Salvar plano e diferenciais" : "Criar plano"}</button>{planForm.id && <button className="secondaryButton" type="button" onClick={() => { setPlanForm({ id: "", name: "", description: "", duration_days: "30", price: "0", free: false, active: true, audience: "companion", has_video: false, featured_card: false, search_priority: "0", show_premium_badge: false, profile_theme: "standard", max_gallery_items: "", photo_gallery: true, video_gallery: false, featured_photo: false, featured_video: false, highlight_card_photo: false, advertiser_gallery: true, profile_audio: false, allow_reviews: true, allow_gifts: false, max_photos: "", max_videos: "" }); setPlanFeaturesExtras({}); clearFeedback(); }}>Cancelar edição</button>}</div></form><hr /><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th>Plano</th><th>Público</th><th>Duração</th><th>Valor</th><th>Destaques</th><th>Status</th><th>Ações</th></tr></thead><tbody>{plans.map(p => <tr key={p.id}><td>{p.name}<br /><small>{p.description || "Sem descrição"}</small></td><td>{p.audience === "both" ? "Ambos" : p.audience === "content_seller" ? "Vendedores de conteúdo" : "Acompanhantes"}</td><td>{p.duration_days ? p.duration_days + " dias" : "—"}</td><td>{p.free ? "Grátis" : "R$ " + Number(p.price).toFixed(2).replace(".", ",")}</td><td>{[p.featured_card && "Card destacado", p.search_priority > 0 && "Prioridade " + p.search_priority, p.show_premium_badge && "Selo Premium", p.profile_theme !== "standard" && "Perfil " + p.profile_theme, p.max_gallery_items && p.max_gallery_items + " itens de galeria"].filter(Boolean).join(" · ") || "Básico"}</td><td>{p.active ? "Ativo" : "Inativo"}</td><td><button className="secondaryButton" type="button" onClick={() => { setPlanForm({ id: p.id, name: p.name, description: p.description || "", duration_days: String(p.duration_days || "30"), price: Number(p.price).toFixed(2).replace(".", ","), free: p.free, active: p.active, audience: p.audience || "companion", has_video: p.has_video, featured_card: p.featured_card, search_priority: String(p.search_priority ?? 0), show_premium_badge: p.show_premium_badge, profile_theme: p.profile_theme || "standard", max_gallery_items: p.max_gallery_items == null ? "" : String(p.max_gallery_items), photo_gallery: typeof p.features?.photo_gallery === "boolean" ? p.features.photo_gallery : true, video_gallery: typeof p.features?.video_gallery === "boolean" ? p.features.video_gallery : p.has_video, featured_photo: p.features?.featured_photo === true, featured_video: p.features?.featured_video === true, highlight_card_photo: p.features?.highlight_card_photo === true, advertiser_gallery: typeof p.features?.advertiser_gallery === "boolean" ? p.features.advertiser_gallery : true, profile_audio: p.features?.profile_audio === true, allow_reviews: typeof p.features?.allow_reviews === "boolean" ? p.features.allow_reviews : true, allow_gifts: p.features?.allow_gifts === true, max_photos: typeof p.features?.max_photos === "number" ? String(p.features.max_photos) : "", max_videos: typeof p.features?.max_videos === "number" ? String(p.features.max_videos) : "" }); setPlanFeaturesExtras(p.features || {}); clearFeedback(); }}>Editar plano e diferenciais</button></td></tr>)}</tbody></table></div></section>}{tab === "verificacoes" && <section className="authCard"><h2>Fila de verificação</h2><p>O administrador pode validar ou rejeitar a situação do anúncio sem alterar o conteúdo Fans.</p><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th>Anúncio</th><th>Publicação</th><th>Verificação</th><th>Ações</th></tr></thead><tbody>{advertisers.map(a => <tr key={a.id}><td>{a.display_name || a.title}</td><td>{statusLabel[a.status] || a.status}</td><td>{statusLabel[a.verification_status] || a.verification_status}</td><td><button className="secondaryButton" type="button" onClick={() => updateAdvertiser(a.id, "verification_status", "verified")}>Aprovar</button><button className="secondaryButton" type="button" onClick={() => updateAdvertiser(a.id, "verification_status", "rejected")}>Rejeitar</button></td></tr>)}</tbody></table></div></section>}
      </>}
      <p style={{ marginTop: 24, opacity: .7 }}>Perfil administrativo atual: {role === "super_admin" ? "Superadministrador" : role === "admin" ? "Administrador" : role}.</p>
    </section>
  </main>;
}
