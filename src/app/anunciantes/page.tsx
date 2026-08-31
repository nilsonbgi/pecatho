"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Advertiser = { id: string; slug: string | null; title: string | null; display_name: string | null; summary: string | null; city_id: number | null; state_id: number | null; category_id: number | null; verification_status: string | null };
type Category = { id: number; name: string };
type City = { id: number; name: string; state_id: number };
type State = { id: number; uf: string; name: string };

export default function AnunciantesPage() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
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
    const loadMetadata = async () => {
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
        setCategories(categoriesResult.data ?? []);
        setStates(statesResult.data ?? []);
      } catch (err: unknown) {
        console.error("Erro ao carregar filtros públicos", err);
        if (active) setError("Não foi possível carregar as categorias e os Estados.");
      } finally {
        if (active) setMetaLoading(false);
      }
    };
    void loadMetadata();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadCities = async () => {
      setCityId("");
      if (!stateId) { setCities([]); setCitiesLoading(false); return; }
      setCitiesLoading(true);
      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from("cities")
          .select("id,name,state_id")
          .eq("state_id", Number(stateId))
          .order("name")
          .limit(1000);
        if (queryError) throw queryError;
        if (active) setCities(data ?? []);
      } catch (err: unknown) {
        console.error("Erro ao carregar cidades", err);
        if (active) setCities([]);
      } finally {
        if (active) setCitiesLoading(false);
      }
    };
    void loadCities();
    return () => { active = false; };
  }, [stateId]);

  useEffect(() => {
    let active = true;
    const loadAdvertisers = async () => {
      setLoading(true); setError("");
      try {
        const supabase = createClient();
        let request = supabase
          .from("advertiser_profiles")
          .select("id,slug,title,display_name,summary,city_id,state_id,category_id,verification_status,created_at")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(48);
        if (categoryId) request = request.eq("category_id", Number(categoryId));
        if (stateId) request = request.eq("state_id", Number(stateId));
        if (cityId) request = request.eq("city_id", Number(cityId));
        if (query.trim()) {
          const clean = query.trim().replace(/[%_,]/g, " ");
          request = request.or(`title.ilike.%${clean}%,display_name.ilike.%${clean}%,summary.ilike.%${clean}%`);
        }
        const { data, error: queryError } = await request;
        if (queryError) throw queryError;
        if (active) setAdvertisers(data ?? []);
      } catch (err: unknown) {
        console.error("Erro ao carregar anunciantes", err);
        if (active) { setAdvertisers([]); setError("Não foi possível carregar os anunciantes publicados."); }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadAdvertisers();
    return () => { active = false; };
  }, [categoryId, stateId, cityId, query]);

  const categoryName = useMemo(() => new Map(categories.map((x) => [x.id, x.name])), [categories]);
  const cityName = useMemo(() => new Map(cities.map((x) => [x.id, x.name])), [cities]);
  const stateName = useMemo(() => new Map(states.map((x) => [x.id, x.uf])), [states]);
  const selectedCityName = cityId ? cityName.get(Number(cityId)) : null;
  const selectedStateName = stateId ? states.find((x) => x.id === Number(stateId))?.name : null;

  return (
    <main className="shell">
      <nav className="topbar">
        <Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link>
        <div style={{ display: "flex", gap: 10 }}><Link href="/login" className="secondaryButton">Entrar</Link><Link href="/cadastro" className="navCta">Anunciar</Link></div>
      </nav>
      <section className="hero" style={{ paddingBottom: 28 }}>
        <div className="eyebrow">PECATHO • ANUNCIANTES</div>
        <h1>Encontre quem <em>você procura.</em></h1>
        <p className="heroCopy">Pesquise por nome, categoria, Estado ou cidade e encontre perfis publicados no Pecatho.</p>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 2fr) repeat(3, minmax(160px, 1fr))", gap: 12, marginTop: 24 }}>
          <input aria-label="Pesquisar anunciante" placeholder="Nome, título ou palavra-chave" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select aria-label="Filtrar por categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={metaLoading}><option value="">{metaLoading ? "Carregando categorias..." : "Todas as categorias"}</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <select aria-label="Filtrar por Estado" value={stateId} onChange={(e) => setStateId(e.target.value)} disabled={metaLoading}><option value="">{metaLoading ? "Carregando Estados..." : "Todos os Estados"}</option>{states.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.uf})</option>)}</select>
          <select aria-label="Filtrar por cidade" value={cityId} onChange={(e) => setCityId(e.target.value)} disabled={!stateId || citiesLoading}><option value="">{citiesLoading ? "Carregando cidades..." : stateId ? "Todas as cidades" : "Selecione o Estado"}</option>{cities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        </div>
        {categories.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}><button type="button" className={!categoryId ? "previewBadge" : "secondaryButton"} onClick={() => setCategoryId("")}>Todas</button>{categories.map((x) => <button type="button" key={x.id} className={categoryId === String(x.id) ? "previewBadge" : "secondaryButton"} onClick={() => setCategoryId(String(x.id))}>{x.name}</button>)}</div>}
      </section>
      <section style={{ padding: "0 0 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <div><div className="eyebrow">RESULTADOS</div><h2 style={{ margin: "6px 0 0" }}>{loading ? "Buscando..." : `${advertisers.length} ${advertisers.length === 1 ? "perfil encontrado" : "perfis encontrados"}`}</h2>{(selectedStateName || selectedCityName) && <p style={{ margin: "6px 0 0", opacity: 0.7 }}>{selectedCityName ? `${selectedCityName}, ` : ""}{selectedStateName || ""}</p>}</div>
          {(categoryId || stateId || cityId || query) && <button type="button" className="secondaryButton" onClick={() => { setCategoryId(""); setStateId(""); setCityId(""); setQuery(""); }}>Limpar filtros</button>}
        </div>
        {error && <article className="card"><h2>Não foi possível carregar</h2><p>{error}</p><button type="button" className="primaryButton" onClick={() => window.location.reload()}>Tentar novamente</button></article>}
        {!loading && !error && advertisers.length === 0 && <article className="card"><h2>Nenhum anúncio publicado ainda.</h2><p>Os filtros de categoria, Estado e cidade estão disponíveis. Assim que houver anúncios publicados, eles aparecerão aqui.</p><Link href="/cadastro" className="primaryButton">Quero anunciar</Link></article>}
        {!error && advertisers.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {advertisers.map((item) => <article className="card" key={item.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}><span className="previewBadge">{item.verification_status === "verified" ? "VERIFICADO" : "PUBLICADO"}</span><span className="eyebrow" style={{ margin: 0 }}>{item.category_id != null ? categoryName.get(item.category_id) || "ANUNCIANTE" : "ANUNCIANTE"}</span></div>
            <h2 style={{ marginTop: 14 }}>{item.title || item.display_name || "Perfil Pecatho"}</h2>
            <p><strong>{item.display_name || "Anunciante"}</strong></p>
            <p>📍 {item.city_id != null ? cityName.get(item.city_id) || "Cidade não informada" : "Cidade não informada"}{item.state_id != null && stateName.get(item.state_id) ? ` — ${stateName.get(item.state_id)}` : ""}</p>
            <p>{item.summary || "Perfil publicado no Pecatho."}</p>
            {item.slug && <Link className="primaryButton" href={`/anunciantes/${item.slug}`}>Ver anúncio</Link>}
          </article>)}
        </div>}
      </section>
    </main>
  );
}
