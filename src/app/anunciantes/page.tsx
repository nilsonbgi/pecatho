"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Advertiser = { id: string; slug: string | null; title: string | null; display_name: string | null; summary: string | null; city_id: number | null; state_id: number | null; category_id: number | null; verification_status: string | null };
type Category = { id: number; name: string };
type City = { id: number; name: string; state_id: number };
type State = { id: number; uf: string; name: string };
type Media = { profile_id: string; storage_bucket: string; storage_path: string; kind: string; is_primary: boolean; is_public: boolean };

type CardData = Advertiser & { imageUrl: string | null };

export default function AnunciantesPage() {
  const [advertisers, setAdvertisers] = useState<CardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadMetadata() {
      setMetaLoading(true);
      try {
        const supabase = createClient();
        const [categoriesResult, statesResult] = await Promise.all([
          supabase.from("categories").select("id,name").eq("display", true).order("name"),
          supabase.from("states").select("id,uf,name").order("name"),
        ]);
        if (categoriesResult.error) throw categoriesResult.error;
        if (statesResult.error) throw statesResult.error;
        if (!active) return;
        setCategories(categoriesResult.data ?? []); setStates(statesResult.data ?? []);
      } catch (err) {
        console.error("Erro ao carregar filtros públicos", err);
        if (active) setError("Não foi possível carregar as opções de pesquisa.");
      } finally { if (active) setMetaLoading(false); }
    }
    void loadMetadata();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadCities() {
      setCityId("");
      if (!stateId) { setCities([]); setCitiesLoading(false); return; }
      setCitiesLoading(true);
      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase.from("cities").select("id,name,state_id").eq("state_id", Number(stateId)).order("name").limit(1000);
        if (queryError) throw queryError;
        if (active) setCities(data ?? []);
      } catch (err) { console.error("Erro ao carregar cidades", err); if (active) setCities([]); }
      finally { if (active) setCitiesLoading(false); }
    }
    void loadCities();
    return () => { active = false; };
  }, [stateId]);

  useEffect(() => {
    let active = true;
    async function loadAdvertisers() {
      setLoading(true); setError("");
      try {
        const supabase = createClient();
        let request = supabase.from("advertiser_profiles").select("id,slug,title,display_name,summary,city_id,state_id,category_id,verification_status,created_at").eq("status", "published").order("created_at", { ascending: false }).limit(48);
        if (categoryId) request = request.eq("category_id", Number(categoryId));
        if (stateId) request = request.eq("state_id", Number(stateId));
        if (cityId) request = request.eq("city_id", Number(cityId));
        if (query.trim()) {
          const clean = query.trim().replace(/[%_,]/g, " ");
          request = request.or(`title.ilike.%${clean}%,display_name.ilike.%${clean}%,summary.ilike.%${clean}%`);
        }
        const { data, error: queryError } = await request;
        if (queryError) throw queryError;
        const rows = (data ?? []) as Advertiser[];
        let cards: CardData[] = rows.map((item) => ({ ...item, imageUrl: null }));
        if (rows.length) {
          const ids = rows.map((item) => item.id);
          const { data: mediaRows } = await supabase.from("profile_media").select("profile_id,storage_bucket,storage_path,kind,is_primary,is_public").in("profile_id", ids).eq("is_public", true).eq("moderation_status", "approved").order("is_primary", { ascending: false }).order("sort_order");
          const mediaByProfile = new Map<string, Media>();
          for (const media of (mediaRows ?? []) as Media[]) if (!mediaByProfile.has(media.profile_id) && media.kind === "image") mediaByProfile.set(media.profile_id, media);
          cards = rows.map((item) => { const media = mediaByProfile.get(item.id); if (!media) return { ...item, imageUrl: null }; const { data: publicData } = supabase.storage.from(media.storage_bucket).getPublicUrl(media.storage_path); return { ...item, imageUrl: publicData.publicUrl || null }; });
        }
        if (active) setAdvertisers(cards);
      } catch (err) {
        console.error("Erro ao carregar anunciantes", err);
        if (active) { setAdvertisers([]); setError("Não foi possível carregar os anunciantes publicados."); }
      } finally { if (active) setLoading(false); }
    }
    void loadAdvertisers();
    return () => { active = false; };
  }, [categoryId, stateId, cityId, query]);

  const categoryName = useMemo(() => new Map(categories.map((x) => [x.id, x.name])), [categories]);
  const cityName = useMemo(() => new Map(cities.map((x) => [x.id, x.name])), [cities]);
  const stateName = useMemo(() => new Map(states.map((x) => [x.id, x.uf])), [states]);
  const selectedCityName = cityId ? cityName.get(Number(cityId)) : null;
  const selectedStateName = stateId ? states.find((x) => x.id === Number(stateId))?.name : null;

  return (
    <main className="discoveryShell">
      <nav className="onboardingNav">
        <Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link>
        <div className="onboardingNavRight"><Link href="/login" className="secondaryButton">Entrar</Link><Link href="/cadastro" className="navCta">Criar conta</Link></div>
      </nav>
      <section className="discoveryHero">
        <div className="eyebrow">PECATHO · ANUNCIANTES</div>
        <h1>Descubra perfis que combinam <em>com você.</em></h1>
        <p className="heroCopy discoveryHeroCopy">Encontre anunciantes por nome, categoria, Estado ou cidade. A experiência pública foi pensada para facilitar a descoberta sem transformar a busca em um formulário complicado.</p>
        <div className="discoverySearch">
          <input aria-label="Pesquisar anunciante" placeholder="Pesquisar por nome, título ou palavra-chave" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select aria-label="Filtrar por categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={metaLoading}><option value="">Todas as categorias</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <select aria-label="Filtrar por Estado" value={stateId} onChange={(e) => setStateId(e.target.value)} disabled={metaLoading}><option value="">Todos os Estados</option>{states.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.uf})</option>)}</select>
          <select aria-label="Filtrar por cidade" value={cityId} onChange={(e) => setCityId(e.target.value)} disabled={!stateId || citiesLoading}><option value="">{citiesLoading ? "Carregando cidades..." : stateId ? "Todas as cidades" : "Escolha um Estado"}</option>{cities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        </div>
        {categories.length > 0 && <div className="categoryChips"><button type="button" className={`categoryChip ${!categoryId ? "active" : ""}`} onClick={() => setCategoryId("")}>Todas</button>{categories.map((x) => <button type="button" className={`categoryChip ${categoryId === String(x.id) ? "active" : ""}`} key={x.id} onClick={() => setCategoryId(String(x.id))}>{x.name}</button>)}</div>}
      </section>
      <section className="discoveryResults">
        <div className="resultsHeader"><div><div className="eyebrow">PERFIS PUBLICADOS</div><h2>{loading ? "Encontrando perfis..." : `${advertisers.length} ${advertisers.length === 1 ? "perfil encontrado" : "perfis encontrados"}`}</h2>{(selectedStateName || selectedCityName) && <div className="resultsMeta">{selectedCityName ? `${selectedCityName}, ` : ""}{selectedStateName || ""}</div>}</div>{(categoryId || stateId || cityId || query) && <button type="button" className="secondaryButton" onClick={() => { setCategoryId(""); setStateId(""); setCityId(""); setQuery(""); }}>Limpar filtros</button>}</div>
        {error && <div className="emptyDiscovery"><h2>Não foi possível carregar</h2><p>{error}</p><button type="button" className="primaryButton" onClick={() => window.location.reload()}>Tentar novamente</button></div>}
        {!loading && !error && advertisers.length === 0 && <div className="emptyDiscovery"><h2>Ainda não há perfis publicados.</h2><p>A estrutura de descoberta já está pronta. Quando os primeiros anúncios forem aprovados, eles aparecerão aqui com mídia, localização e informações do perfil.</p><Link href="/cadastro" className="primaryButton">Quero anunciar</Link></div>}
        {!error && advertisers.length > 0 && <div className="advertiserGrid">{advertisers.map((item) => <article className="advertiserCard" key={item.id}>
          <div className="advertiserVisual">{item.imageUrl ? <img src={item.imageUrl} alt={item.display_name || item.title || "Perfil Pecatho"} /> : <div className="visualPlaceholder"><span>✦</span><div>Pecatho</div><small>Mídia de apresentação</small></div>}{item.verification_status === "verified" && <span className="verifiedMark">✓ VERIFICADO</span>}</div>
          <div className="advertiserBody"><div className="advertiserCategory">{item.category_id != null ? categoryName.get(item.category_id) || "ANUNCIANTE" : "ANUNCIANTE"}</div><h3>{item.title || item.display_name || "Perfil Pecatho"}</h3><p className="advertiserName">{item.display_name || "Anunciante"}</p><p className="advertiserLocation">⌖ {item.city_id != null ? cityName.get(item.city_id) || "Cidade não informada" : "Cidade não informada"}{item.state_id != null && stateName.get(item.state_id) ? ` · ${stateName.get(item.state_id)}` : ""}</p><p className="advertiserSummary">{item.summary || "Perfil publicado no Pecatho."}</p>{item.slug && <Link className="primaryButton" href={`/anunciantes/${item.slug}`}>Ver perfil</Link>}</div>
        </article>)}</div>}
      </section>
    </main>
  );
}
