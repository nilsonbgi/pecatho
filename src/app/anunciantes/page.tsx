"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ClientAdvertisingPlacement from "@/components/ClientAdvertisingPlacement";
import { createClient } from "@/lib/supabase/browser";

type PricingPeriod = { minutes: number; price: number; period: string; starting_from?: boolean };
type Advertiser = { id: string; slug: string | null; title: string | null; display_name: string | null; summary: string | null; city_id: number | null; state_id: number | null; category_id: number | null; verification_status: string | null; pricing: Record<string, unknown> | null; city_name: string | null; state_uf: string | null; total_count: number | null; premium_featured?: boolean; premium_search_priority?: boolean; premium_profile?: boolean; premium_profile_badge?: boolean; premium_card_style?: string | null; premium_badge_label?: string | null };
type Category = { id: number; name: string };
type State = { id: number; uf: string; name: string };
type City = { id: number; name: string; state_id: number };
type CatalogAttribute = { id: string; name: string; slug: string; field_type: string; options: unknown; display_public: boolean; sort_order: number };
type CatalogService = { id: string; name: string; slug: string; display_public: boolean; sort_order: number };
type Media = { profile_id: string; preview_storage_bucket: string | null; preview_storage_path: string | null; storage_bucket: string; storage_path: string; kind: string; access_type?: string; price?: number | null; is_primary: boolean; is_featured: boolean; is_public: boolean; show_in_cards: boolean; };
type PublicPremiumFeature = { entity_id: string; featured_card: boolean; search_priority: boolean; premium_profile: boolean; profile_badge: boolean; card_style: string; badge_label: string | null };
type ProfessionalFeature = { entity_id: string; featured_card: boolean; search_priority: boolean; premium_profile: boolean; profile_badge: boolean; card_style: string; badge_label: string | null };

type Option = { label: string; value: string };
function options(value: unknown): Option[] { if (!Array.isArray(value)) return []; return value.flatMap((x) => typeof x === "string" ? [{ label: x, value: x }] : x && typeof x === "object" && typeof (x as { value?: unknown }).value === "string" ? [{ label: typeof (x as { label?: unknown }).label === "string" ? String((x as { label?: unknown }).label) : String((x as { value: string }).value), value: String((x as { value: string }).value) }] : []); }

function AcompanhantesCatalog() {
  const searchParams = useSearchParams();
  const [advertisers, setAdvertisers] = useState<(Advertiser & { imageUrl: string | null; mediaCount: number; videoCount: number; paidMediaCount: number; availability: string | null })[]>([]); const [totalCount, setTotalCount] = useState(0);
  const [planPresentation, setPlanPresentation] = useState<Record<string, { featured: boolean; badge: boolean; theme: "standard" | "highlighted" | "premium"; premiumFeatured?: boolean; premiumPriority?: boolean; premiumProfile?: boolean; premiumBadge?: boolean; premiumStyle?: string; premiumBadgeLabel?: string | null }>>({});
  const [categories, setCategories] = useState<Category[]>([]); const [states, setStates] = useState<State[]>([]); const [cities, setCities] = useState<City[]>([]);
  const [attributes, setAttributes] = useState<CatalogAttribute[]>([]); const [services, setServices] = useState<CatalogService[]>([]);
  const [catalogCategoryId, setCatalogCategoryId] = useState("");
  const [categoryId, setCategoryId] = useState(() => searchParams.get("categoria") || ""); const [stateId, setStateId] = useState(() => searchParams.get("estado") || ""); const [cityId, setCityId] = useState(() => searchParams.get("cidade") || ""); const [query, setQuery] = useState(() => searchParams.get("q") || ""); const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [attributeFilters, setAttributeFilters] = useState<Record<string, string | boolean | string[]>>(() => { try { const parsed: unknown = JSON.parse(searchParams.get("atributos") || "{}"); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, string | boolean | string[]> : {}; } catch { return {}; } }); const [serviceFilters, setServiceFilters] = useState<string[]>(() => (searchParams.get("servicos") || "").split(",").map((x) => x.trim()).filter(Boolean));
  const [ageMin, setAgeMin] = useState(() => searchParams.get("idadeMin") || ""); const [ageMax, setAgeMax] = useState(() => searchParams.get("idadeMax") || ""); const [priceMin, setPriceMin] = useState(() => searchParams.get("precoMin") || ""); const [priceMax, setPriceMax] = useState(() => searchParams.get("precoMax") || ""); const [durationMinutes, setDurationMinutes] = useState(() => searchParams.get("duracao") || ""); const [sort, setSort] = useState(() => searchParams.get("ordem") || "recent");
  const [advancedOpen, setAdvancedOpen] = useState(() => Boolean(searchParams.get("servicos") || searchParams.get("atributos") || searchParams.get("idadeMin") || searchParams.get("idadeMax") || searchParams.get("precoMin") || searchParams.get("precoMax") || searchParams.get("duracao"))); const [loading, setLoading] = useState(true); const [loadingMore, setLoadingMore] = useState(false); const [hasMore, setHasMore] = useState(false); const [metaLoading, setMetaLoading] = useState(true); const [citiesForState, setCitiesForState] = useState(""); const [error, setError] = useState("");
  const citiesLoading = Boolean(stateId && citiesForState !== stateId);
  const catalogLoading = Boolean(categoryId && catalogCategoryId !== categoryId);

  useEffect(() => { let active = true; (async () => { try { const s = createClient(); const [c, st] = await Promise.all([s.from("categories").select("id,name").eq("display", true).order("name"), s.from("states").select("id,uf,name").order("name")]); if (c.error) throw c.error; if (st.error) throw st.error; if (active) { setCategories(c.data ?? []); setStates(st.data ?? []); } } catch (e) { console.error(e); if (active) setError("Não foi possível carregar as opções de pesquisa."); } finally { if (active) setMetaLoading(false); } })(); return () => { active = false; }; }, []);

  useEffect(() => { let active = true; if (!stateId) return; (async () => { const { data, error: e } = await createClient().from("cities").select("id,name,state_id").eq("state_id", Number(stateId)).order("name").limit(1000); if (active) { if (e) console.error(e); setCities(data ?? []); setCitiesForState(stateId); } })(); return () => { active = false; }; }, [stateId]);

  useEffect(() => { let active = true; if (!categoryId) return; (async () => { const s = createClient(); const [a, sv] = await Promise.all([s.from("category_attributes").select("id,name,slug,field_type,options,display_public,sort_order").eq("category_id", Number(categoryId)).eq("display_public", true).order("sort_order"), s.from("category_services").select("id,name,slug,display_public,sort_order").eq("category_id", Number(categoryId)).eq("display_public", true).order("sort_order")]); if (!active) return; if (a.error || sv.error) { setError("Não foi possível carregar os filtros desta categoria."); setAttributes([]); setServices([]); } else { setAttributes((a.data ?? []) as CatalogAttribute[]); setServices((sv.data ?? []) as CatalogService[]); } setCatalogCategoryId(categoryId); })(); return () => { active = false; }; }, [categoryId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(query), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (categoryId) params.set("categoria", categoryId);
    if (stateId) params.set("estado", stateId);
    if (cityId) params.set("cidade", cityId);
    if (ageMin) params.set("idadeMin", ageMin);
    if (ageMax) params.set("idadeMax", ageMax);
    if (priceMin) params.set("precoMin", priceMin);
    if (priceMax) params.set("precoMax", priceMax);
    if (durationMinutes) params.set("duracao", durationMinutes);
    if (sort !== "recent") params.set("ordem", sort);
    if (serviceFilters.length) params.set("servicos", serviceFilters.join(","));
    if (Object.keys(attributeFilters).length) params.set("atributos", JSON.stringify(attributeFilters));
    const nextUrl = params.toString() ? `/anunciantes?${params.toString()}` : "/anunciantes";
    window.history.replaceState(null, "", nextUrl);
  }, [query, categoryId, stateId, cityId, ageMin, ageMax, priceMin, priceMax, serviceFilters, attributeFilters, durationMinutes, sort]);

  useEffect(() => { let active = true; (async () => { setLoading(true); setError(""); setLoadingMore(false); setHasMore(false); try { const s = createClient(); const { data, error: e } = await s.rpc("search_public_advertisers", { p_category_id: categoryId ? Number(categoryId) : null, p_state_id: stateId ? Number(stateId) : null, p_city_id: cityId ? Number(cityId) : null, p_query: searchQuery.trim() || null, p_attribute_filters: attributeFilters, p_service_slugs: serviceFilters, p_age_min: ageMin ? Number(ageMin) : null, p_age_max: ageMax ? Number(ageMax) : null, p_price_min: priceMin ? Number(priceMin) : null, p_price_max: priceMax ? Number(priceMax) : null, p_duration_minutes: durationMinutes ? Number(durationMinutes) : null, p_sort: sort, p_limit: 48, p_offset: 0 }); if (e) throw e; const rows = (data ?? []) as Advertiser[]; const matchingCount = Number(rows[0]?.total_count ?? 0); setTotalCount(matchingCount); setHasMore(rows.length < matchingCount); let cards = rows.map((x) => ({ ...x, imageUrl: null as string | null, mediaCount: 0, videoCount: 0, paidMediaCount: 0, availability: null as string | null })); if (rows.length) { const ids = rows.map((x) => x.id); const [{ data: mr }, { data: pm }, { data: premiumRows }] = await Promise.all([s.rpc("get_public_profile_media", { p_profile_ids: ids }), s.from("advertiser_profiles").select("id,availability").in("id", ids), s.rpc("get_public_professional_plan_features", { p_entity_ids: ids, p_audience: "companion" })]); const premiumById = new Map(((premiumRows ?? []) as PublicPremiumFeature[]).map((feature) => [feature.entity_id, { premium_featured: feature.featured_card, premium_search_priority: feature.search_priority, premium_profile: feature.premium_profile, premium_profile_badge: feature.profile_badge, premium_card_style: feature.card_style, premium_badge_label: feature.badge_label }])); const byProfile = new Map<string, Media>(); const mediaCounts = new Map<string, number>(); const videoCounts = new Map<string, number>(); const paidMediaCounts = new Map<string, number>(); for (const m of (mr ?? []) as Media[]) { if (!m.is_public || !m.show_in_cards) continue; mediaCounts.set(m.profile_id, (mediaCounts.get(m.profile_id) || 0) + 1); if (m.kind === "video") videoCounts.set(m.profile_id, (videoCounts.get(m.profile_id) || 0) + 1); if (m.access_type === "paid" && Number(m.price || 0) > 0) paidMediaCounts.set(m.profile_id, (paidMediaCounts.get(m.profile_id) || 0) + 1); if (!byProfile.has(m.profile_id) && m.kind === "image") byProfile.set(m.profile_id, m); } const availabilityMap = new Map((pm ?? []).map((p) => [p.id, p.availability])); cards = rows.map((x) => { const m = byProfile.get(x.id); return { ...x, ...(premiumById.get(x.id) ?? {}), imageUrl: m?.preview_storage_bucket && m?.preview_storage_path ? s.storage.from(m.preview_storage_bucket).getPublicUrl(m.preview_storage_path).data.publicUrl || null : null, mediaCount: mediaCounts.get(x.id) || 0, videoCount: videoCounts.get(x.id) || 0, paidMediaCount: paidMediaCounts.get(x.id) || 0, availability: availabilityMap.get(x.id) || null }; }); } if (active) setAdvertisers(cards); } catch (e) { console.error(e); if (active) { setAdvertisers([]); setError("Não foi possível carregar os acompanhantes publicados."); } } finally { if (active) setLoading(false); } })(); return () => { active = false; }; }, [categoryId, stateId, cityId, searchQuery, attributeFilters, serviceFilters, ageMin, ageMax, priceMin, priceMax, durationMinutes, sort]);

  async function loadMore() {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const s = createClient();
      const { data, error: e } = await s.rpc("search_public_advertisers", {
        p_category_id: categoryId ? Number(categoryId) : null,
        p_state_id: stateId ? Number(stateId) : null,
        p_city_id: cityId ? Number(cityId) : null,
        p_query: query.trim() || null,
        p_attribute_filters: attributeFilters,
        p_service_slugs: serviceFilters,
        p_age_min: ageMin ? Number(ageMin) : null,
        p_age_max: ageMax ? Number(ageMax) : null,
        p_price_min: priceMin ? Number(priceMin) : null,
        p_price_max: priceMax ? Number(priceMax) : null,
        p_duration_minutes: durationMinutes ? Number(durationMinutes) : null,
        p_sort: sort,
        p_limit: 48,
        p_offset: advertisers.length
      });
      if (e) throw e;
      const rows = (data ?? []) as Advertiser[];
      if (!rows.length) {
        setHasMore(false);
        return;
      }

      const ids = rows.map((x) => x.id);
      const [{ data: mr, error: mediaError }, { data: pm, error: profileError }] = await Promise.all([
        s.rpc("get_public_profile_media", { p_profile_ids: ids }),
        s.from("advertiser_profiles").select("id,availability").in("id", ids)
      ]);
      if (mediaError) throw mediaError;
      if (profileError) throw profileError;
      const byProfile = new Map<string, Media>();
      const mediaCounts = new Map<string, number>();
      const videoCounts = new Map<string, number>();
      const paidMediaCounts = new Map<string, number>();
      for (const m of (mr ?? []) as Media[]) {
        if (!m.is_public || !m.show_in_cards) continue;
        mediaCounts.set(m.profile_id, (mediaCounts.get(m.profile_id) || 0) + 1);
        if (m.kind === "video") videoCounts.set(m.profile_id, (videoCounts.get(m.profile_id) || 0) + 1);
        if (m.access_type === "paid" && Number(m.price || 0) > 0) paidMediaCounts.set(m.profile_id, (paidMediaCounts.get(m.profile_id) || 0) + 1);
        if (!byProfile.has(m.profile_id) && m.kind === "image") byProfile.set(m.profile_id, m);
      }
      const availabilityMap = new Map((pm ?? []).map((p) => [p.id, p.availability]));
      const moreCards = rows.map((x) => {
        const m = byProfile.get(x.id);
        return {
          ...x,
          imageUrl: m?.preview_storage_bucket && m?.preview_storage_path ? s.storage.from(m.preview_storage_bucket).getPublicUrl(m.preview_storage_path).data.publicUrl || null : null,
          mediaCount: mediaCounts.get(x.id) || 0,
          videoCount: videoCounts.get(x.id) || 0,
          paidMediaCount: paidMediaCounts.get(x.id) || 0,
          availability: availabilityMap.get(x.id) || null
        };
      });
      setAdvertisers((current) => [...current, ...moreCards.filter((item) => !current.some((existing) => existing.id === item.id))]);
      const matchingCount = Number(rows[0]?.total_count ?? 0);
      setTotalCount(matchingCount);
      setHasMore(advertisers.length + rows.length < matchingCount);
    } catch (e) {
      console.error(e);
      setError("Não foi possível carregar mais acompanhantes.");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    let active = true;
    const ids = advertisers.map((item) => item.id);
    if (!ids.length) return;
    (async () => {
      try {
        const s = createClient();
        const [{ data, error: planError }, { data: professionalRows }] = await Promise.all([
          s.rpc("get_public_profile_plan_features", { p_profile_ids: ids }),
          s.rpc("get_public_professional_plan_features", { p_entity_ids: ids, p_audience: "companion" }),
        ]);
        if (planError) throw planError;
        const next: Record<string, { featured: boolean; badge: boolean; theme: "standard" | "highlighted" | "premium"; premiumFeatured?: boolean; premiumPriority?: boolean; premiumProfile?: boolean; premiumBadge?: boolean; premiumStyle?: string; premiumBadgeLabel?: string | null }> = {};
        for (const item of (data ?? []) as Array<{ profile_id: string; featured_card: boolean; show_premium_badge: boolean; profile_theme: "standard" | "highlighted" | "premium" }>) {
          next[item.profile_id] = { featured: item.featured_card, badge: item.show_premium_badge, theme: item.profile_theme };
        }
        for (const item of (professionalRows ?? []) as ProfessionalFeature[]) {
          next[item.entity_id] = { ...(next[item.entity_id] ?? { featured: false, badge: false, theme: "standard" as const }), premiumFeatured: item.featured_card, premiumPriority: item.search_priority, premiumProfile: item.premium_profile, premiumBadge: item.profile_badge, premiumStyle: item.card_style, premiumBadgeLabel: item.badge_label };
        }
        if (active) setPlanPresentation(next);
      } catch (error) {
        console.error("Falha ao carregar diferenciais de publicação", error);
        if (active) setPlanPresentation({});
      }
    })();
    return () => { active = false; };
  }, [advertisers]);

  const categoryName = useMemo(() => new Map(categories.map((x) => [x.id, x.name])), [categories]); const stateName = useMemo(() => new Map(states.map((x) => [x.id, x.uf])), [states]); const cityName = useMemo(() => new Map(cities.map((x) => [x.id, x.name])), [cities]);
  const activeFilterCount = Object.keys(attributeFilters).length + serviceFilters.length + [ageMin, ageMax, priceMin, priceMax, durationMinutes].filter(Boolean).length;
  function clearAll() { setCategoryId(""); setStateId(""); setCityId(""); setCities([]); setCitiesForState(""); setQuery(""); setAttributeFilters({}); setServiceFilters([]); setAgeMin(""); setAgeMax(""); setPriceMin(""); setPriceMax(""); setDurationMinutes(""); setSort("recent"); }
  function selectCategory(value: string) { setCategoryId(value); setAttributeFilters({}); setServiceFilters([]); }
  function selectState(value: string) { setStateId(value); setCityId(""); setCities([]); setCitiesForState(""); }
  function setAttr(slug: string, value: string | boolean | string[]) { setAttributeFilters((current) => { const next = { ...current }; if (value === "" || (Array.isArray(value) && value.length === 0)) delete next[slug]; else next[slug] = value; return next; }); }
  function toggleService(slug: string) { setServiceFilters((current) => current.includes(slug) ? current.filter((x) => x !== slug) : [...current, slug]); }

  return <main className="discoveryShell">
    <nav className="onboardingNav"><Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link><div className="onboardingNavRight"><Link href="/login" className="secondaryButton">Entrar</Link><Link href="/cadastro" className="navCta">Criar conta</Link></div></nav>
    <section className="discoveryHero"><div className="eyebrow">PECATHO · ACOMPANHANTES</div><h1>Descubra perfis que combinam <em>com você.</em></h1><p className="heroCopy discoveryHeroCopy">Explore acompanhantes, serviços, localização, características, disponibilidade e faixas de preço em uma experiência visual premium.</p><div className="advertiserHeroIntro"><div><span className="advertiserHeroKicker">EXPERIÊNCIAS ADULTAS · DESCOBERTA</span><strong>Encontre. Conheça. Escolha.</strong><p>Perfis publicados com informações organizadas para você descobrir novas possibilidades com mais clareza.</p></div><div className="advertiserHeroStats"><span><b>{totalCount}</b><small>perfis nesta busca</small></span><span><b>{categories.length}</b><small>categorias</small></span><span><b>{states.length}</b><small>estados</small></span></div></div>
      <div className="discoverySearch" id="discovery-filters"><input aria-label="Pesquisar acompanhante" placeholder="Pesquisar por nome, título ou palavra-chave" value={query} onChange={(e) => setQuery(e.target.value)} /><select aria-label="Filtrar por categoria" value={categoryId} onChange={(e) => selectCategory(e.target.value)} disabled={metaLoading}><option value="">Todas as categorias</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><select aria-label="Filtrar por Estado" value={stateId} onChange={(e) => selectState(e.target.value)} disabled={metaLoading}><option value="">Todos os Estados</option>{states.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.uf})</option>)}</select><select aria-label="Filtrar por cidade" value={cityId} onChange={(e) => setCityId(e.target.value)} disabled={!stateId || citiesLoading}><option value="">{citiesLoading ? "Carregando cidades..." : stateId ? "Todas as cidades" : "Escolha um Estado"}</option>{cities.filter((x) => x.state_id === Number(stateId)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><button type="button" className="secondaryButton" onClick={() => setAdvancedOpen((x) => !x)}>Filtros avançados{activeFilterCount ? ` (${activeFilterCount})` : ""}</button></div>
      {advancedOpen && <div className="card" style={{ marginTop: 16 }}><div className="eyebrow">FILTROS DO CATÁLOGO</div>{catalogLoading ? <p className="fieldNote">Carregando características e serviços...</p> : !categoryId ? <p className="fieldNote">Selecione uma categoria para carregar as características e serviços específicos dela.</p> : <>
        <div className="formGrid"><label>Idade mínima<input type="number" min="18" max="100" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} placeholder="18" /></label><label>Idade máxima<input type="number" min="18" max="100" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} placeholder="100" /></label><label>Duração<select value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)}><option value="">Qualquer duração</option><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="60">1 hora</option><option value="120">2 horas</option><option value="180">3 horas</option><option value="240">4 horas</option><option value="480">8 horas</option><option value="720">12 horas / pernoite</option><option value="1440">Diária</option><option value="2880">2 diárias</option><option value="10080">Diária de viagem</option></select></label><label>Preço mínimo<input type="number" min="0" step="0.01" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="R$" /></label><label>Preço máximo<input type="number" min="0" step="0.01" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="R$" /></label></div>
        {attributes.filter((a) => !["idade","altura","tamanho-do-pe"].includes(a.slug)).map((a) => <label key={a.id}>{a.name}{a.field_type === "boolean" ? <select value={attributeFilters[a.slug] === true ? "true" : attributeFilters[a.slug] === false ? "false" : ""} onChange={(e) => setAttr(a.slug, e.target.value === "" ? "" : e.target.value === "true")}><option value="">Qualquer</option><option value="true">Sim</option><option value="false">Não</option></select> : <select value={typeof attributeFilters[a.slug] === "string" ? String(attributeFilters[a.slug]) : ""} onChange={(e) => setAttr(a.slug, e.target.value)}><option value="">Qualquer</option>{options(a.options).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>}</label>)}
        {services.length > 0 && <div style={{ marginTop: 16 }}><strong>Serviços</strong><div className="categoryChips">{services.map((sv) => <button type="button" className={`categoryChip ${serviceFilters.includes(sv.slug) ? "active" : ""}`} key={sv.id} onClick={() => toggleService(sv.slug)}>{sv.name}</button>)}</div></div>}
      </>}</div>}
      {categories.length > 0 && <div className="categoryChips"><button type="button" className={`categoryChip ${!categoryId ? "active" : ""}`} onClick={() => selectCategory("")}>Todas</button>{categories.map((x) => <button type="button" className={`categoryChip ${categoryId === String(x.id) ? "active" : ""}`} key={x.id} onClick={() => selectCategory(String(x.id))}>{x.name}</button>)}</div>}
    </section>
    <ClientAdvertisingPlacement placement="catalog" />
    <section className="discoveryResults" id="resultados"><div className="resultsHeader"><div><div className="eyebrow">PERFIS PUBLICADOS</div><h2>{loading ? "Encontrando perfis..." : `${advertisers.length}${advertisers.length < totalCount ? ` de ${totalCount}` : ""} ${totalCount === 1 ? "perfil encontrado" : "perfis encontrados"}`}</h2>{(stateId || cityId) && <div className="resultsMeta">{cityId ? `${cityName.get(Number(cityId)) || ""}, ` : ""}{stateId ? stateName.get(Number(stateId)) || "" : ""}</div>}<select className="discoverySort" aria-label="Ordenar resultados" value={sort} onChange={(e) => setSort(e.target.value)}><option value="recent">Mais recentes</option><option value="price_asc">Menor preço</option><option value="price_desc">Maior preço</option><option value="name">Nome A–Z</option></select></div>{(categoryId || stateId || cityId || query || activeFilterCount) && <button type="button" className="secondaryButton" onClick={clearAll}>Limpar filtros</button>}</div>
      {error && <div className="emptyDiscovery"><h2>Não foi possível carregar</h2><p>{error}</p><button type="button" className="primaryButton" onClick={() => window.location.reload()}>Tentar novamente</button></div>}
      {!loading && !error && advertisers.length === 0 && <div className="emptyDiscovery"><h2>Nenhum perfil encontrado.</h2><p>Ajuste os filtros ou aguarde novos anúncios publicados.</p><Link href="/cadastro" className="primaryButton">Quero anunciar</Link></div>}
      {!error && advertisers.length > 0 && <><div className="advertiserGrid">{advertisers.map((item) => {
  const periods = Array.isArray(item.pricing?.periods) ? (item.pricing.periods as PricingPeriod[]) : [];
  const valid = periods.filter((row) => Number.isFinite(Number(row.price)) && Number(row.price) > 0 && Number.isFinite(Number(row.minutes)));
  const oneHour = valid.find((row) => Number(row.minutes) === 60);
  const display = oneHour || valid[0];
  const presentation = planPresentation[item.id];
  return <article className={`advertiserCard commercialAdvertiserCard ${presentation?.featured ? "planFeaturedCard" : ""} ${presentation?.theme === "highlighted" ? "planThemeHighlighted" : presentation?.theme === "premium" ? "planThemePremium" : ""} ${presentation?.premiumFeatured ? "premiumFeaturedCard premiumStyle-" + (presentation.premiumStyle || "gold") : ""} ${presentation?.premiumProfile ? "premiumProfileEnabled" : ""}`} key={item.id}>
    <div className="advertiserVisual commercialAdvertiserVisual">
      {item.imageUrl ? <img src={item.imageUrl} alt={item.display_name || item.title || "Perfil Pecatho"} /> : <div className="visualPlaceholder"><span>✦</span><div>Pecatho</div><small>Mídia de apresentação</small></div>}
      <div className="commercialVisualTop"><span className="commercialCategory">{item.category_id != null ? categoryName.get(item.category_id) || "ACOMPANHANTE" : "ACOMPANHANTE"}</span><span className="commercialTrustBadges">{presentation?.premiumBadge && <span className="premiumPlanBadge">✦ {presentation.premiumBadgeLabel || "Perfil Premium"}</span>}{presentation?.badge && <span className="publicationPremiumBadge">✦ PREMIUM</span>}{item.verification_status === "verified" && <span className="verifiedMark">✓ VERIFICADO</span>}</span></div>
      <div className="commercialVisualBottom"><span>▣ {item.mediaCount} mídia(s)</span>{item.videoCount > 0 && <span>▶ {item.videoCount} vídeo(s)</span>}{item.paidMediaCount > 0 && <span className="paidContentBadge">✦ Conteúdo exclusivo</span>}</div>
    </div>
    <div className="advertiserBody commercialAdvertiserBody">
      <div className="commercialTitleRow"><div><h3>{item.title || item.display_name || "Perfil Pecatho"}</h3><p className="advertiserName">{item.display_name || "Acompanhante"}</p></div>{item.verification_status === "verified" && <span className="commercialTrust">✓ Confiável</span>}</div>
      <p className="advertiserLocation">⌖ {item.city_name || (item.city_id != null ? cityName.get(item.city_id) : null) || "Cidade não informada"}{item.state_uf || (item.state_id != null ? stateName.get(item.state_id as number) : null) ? ` · ${item.state_uf || stateName.get(item.state_id as number)}` : ""}</p>
      <p className="advertiserSummary">{item.summary || "Perfil publicado no Pecatho."}</p>
      <div className="commercialSignalRow">{item.availability ? <span className="signalAvailable">◷ {item.availability}</span> : <span>◷ Consulte disponibilidade</span>}{item.mediaCount > 0 && <span>▣ Galeria</span>}</div>
      {display && <div className="advertiserCardPrice commercialPrice"><div><span>{display.starting_from === true ? "A partir de " : ""}{display.period || (Number(display.minutes) === 60 ? "1 Hora" : `${display.minutes} min`)}</span><small>serviço</small></div><strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(display.price))}</strong></div>}
      <div className="commercialActions">{item.slug && <Link className="primaryButton commercialPrimary" href={`/anunciantes/${item.slug}`}>Ver perfil <span>↗</span></Link>}{item.paidMediaCount > 0 && item.slug && <Link className="secondaryButton commercialContentCta" href={`/anunciantes/${item.slug}#conteudo-exclusivo`}>Conteúdo exclusivo</Link>}</div>
    </div>
  </article>;
})}</div>{hasMore && <div className="discoveryLoadMore"><button type="button" className="secondaryButton" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Carregando mais perfis..." : "Carregar mais perfis"}</button></div>}</>}
    </section>
    <nav className="discoveryMobileBar" aria-label="Ações rápidas"><a href="#resultados">Ver resultados</a><button type="button" onClick={() => { const next = !advancedOpen; setAdvancedOpen(next); if (next) document.getElementById("discovery-filters")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""}</button></nav>
  </main>;
}

export default function AcompanhantesPage() {
  return <Suspense fallback={<main className="discoveryShell"><p className="fieldNote">Carregando filtros…</p></main>}><AcompanhantesCatalog /></Suspense>;
}
