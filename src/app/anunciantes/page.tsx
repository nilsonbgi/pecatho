"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Advertiser = { id: string; slug: string | null; title: string | null; display_name: string | null; summary: string | null; city_id: number | null; state_id: number | null; category_id: number | null; verification_status: string | null };
type Category = { id: number; name: string };
type City = { id: number; name: string };
type State = { id: number; uf: string; name: string };

export default function AnunciantesPage() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const [profiles, cats, cityRows, stateRows] = await Promise.all([
        supabase.from("advertiser_profiles").select("id,slug,title,display_name,summary,city_id,state_id,category_id,verification_status").eq("status", "published").order("created_at", { ascending: false }),
        supabase.from("categories").select("id,name").order("name"),
        supabase.from("cities").select("id,name").order("name"),
        supabase.from("states").select("id,uf,name").order("name"),
      ]);
      if (profiles.error) setError("Não foi possível carregar os anunciantes publicados.");
      setAdvertisers((profiles.data || []) as Advertiser[]);
      setCategories((cats.data || []) as Category[]);
      setCities((cityRows.data || []) as City[]);
      setStates((stateRows.data || []) as State[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return advertisers.filter((item) => {
      const categoryOk = !categoryId || String(item.category_id) === categoryId;
      const cityOk = !cityId || String(item.city_id) === cityId;
      const text = `${item.title || ""} ${item.display_name || ""} ${item.summary || ""}`.toLocaleLowerCase("pt-BR");
      return categoryOk && cityOk && (!normalized || text.includes(normalized));
    });
  }, [advertisers, categoryId, cityId, query]);

  const categoryName = (id: number | null) => categories.find((x) => x.id === id)?.name || "Anunciante";
  const locationName = (item: Advertiser) => {
    const city = cities.find((x) => x.id === item.city_id)?.name;
    const state = states.find((x) => x.id === item.state_id)?.uf;
    return city ? `${city}${state ? ` — ${state}` : ""}` : "Localização não informada";
  };

  return (
    <main className="shell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div>
        <div style={{ display: "flex", gap: 10 }}><Link href="/login" className="secondaryButton">Entrar</Link><Link href="/cadastro" className="navCta">Anunciar</Link></div>
      </nav>

      <section className="hero" style={{ paddingBottom: 24 }}>
        <div className="eyebrow">PECATHO • ANUNCIANTES</div>
        <h1>Encontre quem <em>você procura.</em></h1>
        <p className="heroCopy">Explore perfis publicados no Pecatho por nome, categoria e localização.</p>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 2fr) minmax(180px, 1fr) minmax(180px, 1fr)", gap: 12, marginTop: 24 }}>
          <input aria-label="Pesquisar anunciante" placeholder="Pesquisar por nome ou título" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select aria-label="Filtrar por categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Todas as categorias</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <select aria-label="Filtrar por cidade" value={cityId} onChange={(e) => setCityId(e.target.value)}><option value="">Todas as cidades</option>{cities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        </div>
      </section>

      <section className="pillars" style={{ paddingTop: 0 }}>
        {loading && <article className="card"><h2>Carregando anunciantes...</h2><p>Buscando perfis publicados.</p></article>}
        {!loading && error && <article className="card"><h2>Não foi possível carregar</h2><p>{error}</p></article>}
        {!loading && !error && filtered.length === 0 && <article className="card"><h2>Nenhum anúncio encontrado</h2><p>Tente remover algum filtro ou pesquisar por outro termo.</p></article>}
        {!loading && !error && filtered.map((item) => (
          <article className="card" key={item.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <span className="previewBadge">{item.verification_status === "verified" ? "VERIFICADO" : "PUBLICADO"}</span>
              <span className="eyebrow" style={{ margin: 0 }}>{categoryName(item.category_id)}</span>
            </div>
            <h2 style={{ marginTop: 14 }}>{item.title || item.display_name || "Perfil Pecatho"}</h2>
            <p><strong>{item.display_name || "Anunciante"}</strong></p>
            <p>{locationName(item)}</p>
            <p>{item.summary || "Perfil publicado no Pecatho."}</p>
            {item.slug ? <Link className="primaryButton" href={`/anunciantes/${item.slug}`}>Ver anúncio</Link> : <span className="secondaryButton">Perfil em preparação</span>}
          </article>
        ))}
      </section>
    </main>
  );
}
