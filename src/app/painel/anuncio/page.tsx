"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type StateRow = { id: number; uf: string; name: string };
type CityRow = { id: number; name: string; state_id?: number | null };
type CategoryRow = { id: number; name: string };
type AttributeRow = { id: string; name: string; slug: string; field_type: string; options: unknown; required: boolean; display_public: boolean; sort_order: number };
type ServiceRow = { id: string; name: string; slug: string; description: string | null; required: boolean; display_public: boolean; sort_order: number };

const sections = ["Apresentação", "Localização", "Características", "Serviços", "Preços", "Publicação"];

function optionsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export default function AnuncioPage() {
  const [active, setActive] = useState("Apresentação");
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [servicesText, setServicesText] = useState("");
  const [price, setPrice] = useState("");
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, unknown>>({});
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [a, b, c] = await Promise.all([
        supabase.from("states").select("id,uf,name").order("name"),
        supabase.from("cities").select("id,name,state_id").order("name").limit(5000),
        supabase.from("categories").select("id,name").eq("display", true).order("sort_order"),
      ]);
      setStates((a.data as StateRow[] | null) || []);
      setCities((b.data as CityRow[] | null) || []);
      setCategories((c.data as CategoryRow[] | null) || []);
    })();
  }, []);

  useEffect(() => {
    if (!categoryId) { setAttributes([]); setServices([]); setAttributeValues({}); setSelectedServices({}); return; }
    const supabase = createClient();
    setLoadingCatalog(true);
    (async () => {
      const [a, s] = await Promise.all([
        supabase.from("category_attributes").select("id,name,slug,field_type,options,required,display_public,sort_order").eq("category_id", Number(categoryId)).order("sort_order"),
        supabase.from("category_services").select("id,name,slug,description,required,display_public,sort_order").eq("category_id", Number(categoryId)).order("sort_order"),
      ]);
      setAttributes((a.data as AttributeRow[] | null) || []);
      setServices((s.data as ServiceRow[] | null) || []);
      setAttributeValues({});
      setSelectedServices({});
      if (a.error || s.error) setError("Não foi possível carregar os campos da categoria.");
      setLoadingCatalog(false);
    })();
  }, [categoryId]);

  const visibleCities = useMemo(() => cities.filter((c) => !stateId || String(c.state_id) === stateId), [cities, stateId]);
  const selectedCategory = categories.find((c) => String(c.id) === categoryId);

  function setAttribute(id: string, value: unknown) { setAttributeValues((current) => ({ ...current, [id]: value })); }
  function toggleService(id: string, value: boolean) { setSelectedServices((current) => ({ ...current, [id]: value })); }

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage(""); setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    if (!categoryId) { setError("Selecione uma categoria antes de salvar."); setBusy(false); return; }
    const missing = attributes.filter((a) => a.required && (attributeValues[a.id] === undefined || attributeValues[a.id] === ""));
    if (missing.length) { setError(`Preencha os campos obrigatórios: ${missing.map((a) => a.name).join(", ")}.`); setBusy(false); return; }

    const { data: old } = await supabase.from("advertiser_profiles").select("id").eq("user_id", user.id).maybeSingle();
    const normalizedPrice = price ? Number(price.replace(/\./g, "").replace(",", ".")) : null;
    const payload = {
      title, display_name: name, summary, description,
      state_id: stateId ? Number(stateId) : null, city_id: cityId ? Number(cityId) : null,
      category_id: Number(categoryId), birth_date: null,
      height_cm: height ? Number(height) : null,
      pricing: { price: normalizedPrice }, service_options: { description: servicesText }, social_links: {}, payment_options: {},
    };
    const result = old ? await supabase.from("advertiser_profiles").update(payload).eq("id", old.id) : await supabase.from("advertiser_profiles").insert({ ...payload, user_id: user.id, status: "draft", verification_status: "unverified" }).select("id").single();
    if (result.error) { setError("Não foi possível salvar o anúncio. " + result.error.message); setBusy(false); return; }
    const profileId = old?.id || (result.data as { id: string } | null)?.id;
    if (!profileId) { setError("O perfil foi salvo, mas não foi possível identificar o anúncio."); setBusy(false); return; }

    const attributeRows = attributes.filter((a) => attributeValues[a.id] !== undefined && attributeValues[a.id] !== "").map((a) => ({ profile_id: profileId, attribute_id: a.id, value: attributeValues[a.id] }));
    if (attributeRows.length) {
      const { error: attrError } = await supabase.from("profile_attribute_values").upsert(attributeRows, { onConflict: "profile_id,attribute_id" });
      if (attrError) { setError("O anúncio foi salvo, mas os atributos não puderam ser gravados. " + attrError.message); setBusy(false); return; }
    }
    if (services.length) {
      const serviceRows = services.map((s) => ({ profile_id: profileId, service_id: s.id, selected: selectedServices[s.id] === true }));
      const { error: serviceError } = await supabase.from("profile_services").upsert(serviceRows, { onConflict: "profile_id,service_id" });
      if (serviceError) { setError("O anúncio foi salvo, mas os serviços não puderam ser gravados. " + serviceError.message); setBusy(false); return; }
    }
    setMessage("Anúncio e informações da categoria salvos com sucesso. O perfil continua em rascunho."); setBusy(false);
  }

  return <main className="shell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><Link href="/painel" className="navCta">Voltar ao painel</Link></nav><section className="hero"><div className="eyebrow">EDITOR DE ANÚNCIO</div><h1>Crie um anúncio <em>memorável.</em></h1><p className="heroCopy">Informação clara, apresentação profissional e conteúdo relevante aumentam a confiança de quem visita seu perfil.</p><div className="editorGrid"><div className="editorNav">{sections.map((section) => <button type="button" key={section} className={active === section ? "editorTab active" : "editorTab"} onClick={() => setActive(section)}>{section}</button>)}</div><form className="authCard editorCard" onSubmit={submit}>
    {active === "Apresentação" && <><label>Título do anúncio<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} placeholder="Ex.: Uma experiência para guardar na memória" /></label><label>Nome de exibição<input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></label><label>Resumo<input value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={280} /></label><label>Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={9} maxLength={5000} /></label></>}
    {active === "Localização" && <><label>Estado<select value={stateId} onChange={(e) => { setStateId(e.target.value); setCityId(""); }}><option value="">Selecione o estado</option>{states.map((s) => <option key={s.id} value={s.id}>{s.uf} — {s.name}</option>)}</select></label><label>Cidade<select value={cityId} onChange={(e) => setCityId(e.target.value)} disabled={!stateId}><option value="">Selecione a cidade</option>{visibleCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Categoria<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Selecione a categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{selectedCategory && <p className="fieldNote">Categoria selecionada: <strong>{selectedCategory.name}</strong>. Os atributos e serviços abaixo são carregados automaticamente.</p>}</>}
    {active === "Características" && <>{loadingCatalog ? <p className="fieldNote">Carregando características da categoria...</p> : attributes.length ? attributes.map((a) => { const opts = optionsOf(a.options); const value = attributeValues[a.id]; if (a.field_type === "boolean") return <label key={a.id} className="checkRow"><input type="checkbox" checked={value === true} onChange={(e) => setAttribute(a.id, e.target.checked)} /> {a.name}{a.required ? " *" : ""}</label>; if (a.field_type === "select") return <label key={a.id}>{a.name}{a.required ? " *" : ""}<select value={typeof value === "string" ? value : ""} onChange={(e) => setAttribute(a.id, e.target.value)}><option value="">Selecione</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>; return <label key={a.id}>{a.name}{a.required ? " *" : ""}<input type={a.field_type === "number" ? "number" : "text"} value={value == null ? "" : String(value)} onChange={(e) => setAttribute(a.id, a.field_type === "number" ? Number(e.target.value) : e.target.value)} /></label>; }) : <p className="fieldNote">Selecione uma categoria para carregar as características.</p>}</>}
    {active === "Serviços" && <>{loadingCatalog ? <p className="fieldNote">Carregando serviços da categoria...</p> : services.length ? <div className="serviceList">{services.map((s) => <label key={s.id} className="checkRow"><input type="checkbox" checked={selectedServices[s.id] === true} onChange={(e) => toggleService(s.id, e.target.checked)} /> <span><strong>{s.name}</strong>{s.description && <small>{s.description}</small>}</span></label>)}<label>Observações sobre serviços<textarea value={servicesText} onChange={(e) => setServicesText(e.target.value)} rows={7} maxLength={5000} /></label></div> : <p className="fieldNote">Selecione uma categoria para carregar os serviços.</p>}</>}
    {active === "Preços" && <><label>Valor de referência (R$)<input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex.: 350,00" /></label><p className="fieldNote">Os valores exibidos ao público seguirão o padrão brasileiro.</p></>}
    {active === "Publicação" && <div className="publicationBox"><h2>Prévia do anúncio</h2><article className="adPreview"><div className="adImage">Imagem principal</div><div><span className="previewBadge">RASCUNHO</span><h3>{title || "Seu título aparecerá aqui"}</h3><p className="previewName">{name || "Nome de exibição"}</p><p>{summary || "Apresente em poucas palavras aquilo que torna seu anúncio relevante."}</p><small>Complete os dados, adicione mídia e solicite a publicação quando estiver pronto.</small></div></article></div>}
    {error && <p className="formError">{error}</p>}{message && <p className="formSuccess">{message}</p>}<button className="primaryButton" disabled={busy || loadingCatalog}>{busy ? "Salvando..." : "Salvar anúncio"}</button>
  </form></div></section></main>;
}
