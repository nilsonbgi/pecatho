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

function parseAttributeValue(value: unknown): string | string[] | boolean | number | null {
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number" || value === null) return value;
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return null;
}

export default function AnuncioPage() {
  const [active, setActive] = useState("Apresentação");
  const [title, setTitle] = useState(""); const [name, setName] = useState(""); const [summary, setSummary] = useState(""); const [description, setDescription] = useState("");
  const [stateId, setStateId] = useState(""); const [cityId, setCityId] = useState(""); const [categoryId, setCategoryId] = useState(""); const [price, setPrice] = useState(""); const [servicesText, setServicesText] = useState("");
  const [states, setStates] = useState<StateRow[]>([]); const [cities, setCities] = useState<CityRow[]>([]); const [categories, setCategories] = useState<CategoryRow[]>([]); const [attributes, setAttributes] = useState<AttributeRow[]>([]); const [services, setServices] = useState<ServiceRow[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string | string[] | boolean | number | null>>({}); const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => { (async () => {
    const { data: s } = await supabase.from("states").select("id,uf,name").order("name"); setStates((s || []) as StateRow[]);
    const { data: c } = await supabase.from("categories").select("id,name").order("name"); setCategories((c || []) as CategoryRow[]);
    const { data: profile } = await supabase.from("advertiser_profiles").select("id,title,display_name,summary,description,state_id,city_id,category_id,pricing,service_options").maybeSingle();
    if (profile) { setTitle(profile.title || ""); setName(profile.display_name || ""); setSummary(profile.summary || ""); setDescription(profile.description || ""); setStateId(profile.state_id ? String(profile.state_id) : ""); setCityId(profile.city_id ? String(profile.city_id) : ""); setCategoryId(profile.category_id ? String(profile.category_id) : ""); setPrice(profile.pricing?.price ? String(profile.pricing.price) : ""); setServicesText(profile.service_options?.description || ""); }
    setLoading(false);
  })(); }, [supabase]);

  useEffect(() => { if (!stateId) { setCities([]); return; } (async () => { const { data } = await supabase.from("cities").select("id,name,state_id").eq("state_id", Number(stateId)).order("name"); setCities((data || []) as CityRow[]); })(); }, [stateId, supabase]);

  useEffect(() => { if (!categoryId) { setAttributes([]); setServices([]); setAttributeValues({}); setSelectedServices({}); return; } (async () => {
    const [a, s] = await Promise.all([
      supabase.from("category_attributes").select("id,name,slug,field_type,options,required,display_public,sort_order").eq("category_id", Number(categoryId)).order("sort_order"),
      supabase.from("category_services").select("id,name,slug,description,required,display_public,sort_order").eq("category_id", Number(categoryId)).order("sort_order"),
    ]);
    setAttributes((a.data || []) as AttributeRow[]); setServices((s.data || []) as ServiceRow[]); setAttributeValues({}); setSelectedServices({});
  })(); }, [categoryId, supabase]);

  function setAttribute(id: string, value: string | string[] | boolean | number | null) { setAttributeValues((current) => ({ ...current, [id]: value })); }
  function toggleService(id: string, value: boolean) { setSelectedServices((current) => ({ ...current, [id]: value })); }

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage(""); setError("");
    const { data: { user } } = await supabase.auth.getUser(); if (!user) { window.location.href = "/login"; return; }
    if (!categoryId) { setError("Selecione uma categoria antes de salvar."); setBusy(false); return; }
    const missing = attributes.filter((a) => a.required && (attributeValues[a.id] === undefined || attributeValues[a.id] === "" || (Array.isArray(attributeValues[a.id]) && attributeValues[a.id].length === 0)));
    if (missing.length) { setError(`Preencha os campos obrigatórios: ${missing.map((a) => a.name).join(", ")}.`); setBusy(false); return; }
    const requiredServices = services.filter((s) => s.required && selectedServices[s.id] !== true); if (requiredServices.length) { setError(`Selecione os serviços obrigatórios: ${requiredServices.map((s) => s.name).join(", ")}.`); setBusy(false); return; }
    const { data: old } = await supabase.from("advertiser_profiles").select("id").eq("user_id", user.id).maybeSingle();
    const normalizedPrice = price ? Number(price.replace(/\./g, "").replace(",", ".")) : null;
    const payload = { title, display_name: name, summary, description, state_id: stateId ? Number(stateId) : null, city_id: cityId ? Number(cityId) : null, category_id: Number(categoryId), pricing: { price: normalizedPrice }, service_options: { description: servicesText }, social_links: {}, payment_options: {} };
    const result = old ? await supabase.from("advertiser_profiles").update(payload).eq("id", old.id) : await supabase.from("advertiser_profiles").insert({ ...payload, user_id: user.id, status: "draft", verification_status: "unverified" }).select("id").single();
    if (result.error) { setError("Não foi possível salvar o anúncio. " + result.error.message); setBusy(false); return; }
    const profileId = old?.id || (result.data as { id: string } | null)?.id; if (!profileId) { setError("O perfil foi salvo, mas não foi possível identificar o anúncio."); setBusy(false); return; }
    const { error: clearAttrError } = await supabase.from("profile_attribute_values").delete().eq("profile_id", profileId); if (clearAttrError) { setError("Não foi possível atualizar as características do anúncio. " + clearAttrError.message); setBusy(false); return; }
    const attrs = attributes.filter((a) => attributeValues[a.id] !== undefined && attributeValues[a.id] !== "").map((a) => ({ profile_id: profileId, attribute_id: a.id, value: attributeValues[a.id] }));
    if (attrs.length) { const { error: attrError } = await supabase.from("profile_attribute_values").insert(attrs); if (attrError) { setError("Não foi possível salvar as características. " + attrError.message); setBusy(false); return; } }
    const { error: clearServiceError } = await supabase.from("profile_services").delete().eq("profile_id", profileId); if (clearServiceError) { setError("Não foi possível atualizar os serviços. " + clearServiceError.message); setBusy(false); return; }
    const selected = services.filter((s) => selectedServices[s.id] === true).map((s) => ({ profile_id: profileId, service_id: s.id, selected: true }));
    if (selected.length) { const { error: serviceError } = await supabase.from("profile_services").insert(selected); if (serviceError) { setError("Não foi possível salvar os serviços. " + serviceError.message); setBusy(false); return; } }
    setMessage("Rascunho salvo com sucesso."); setBusy(false);
  }

  if (loading) return <main className="shell"><section className="hero"><p>Carregando editor...</p></section></main>;
  return <main className="shell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><Link href="/painel" className="navCta">Painel</Link></nav><section className="hero"><div className="eyebrow">EDITOR DO ANÚNCIO</div><h1>Construa seu <em>perfil.</em></h1><p className="heroCopy">Preencha as informações com atenção. O anúncio permanece em rascunho até passar pelo processo de revisão e publicação.</p><div className="editorGrid"><aside className="editorNav">{sections.map((section) => <button key={section} type="button" className={`editorTab ${active === section ? "active" : ""}`} onClick={() => setActive(section)}>{section}</button>)}</aside><form className="authCard editorCard" onSubmit={submit}>
    {active === "Apresentação" && <><h2>Apresentação</h2><label>Categoria<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required><option value="">Selecione uma categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label><label>Nome público<input value={name} onChange={(e) => setName(e.target.value)} required /></label><label>Resumo<textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} /></label><label>Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={7} /></label></>}
    {active === "Localização" && <><h2>Localização</h2><p className="fieldNote">A localização pública será tratada separadamente do endereço privado.</p><label>Estado<select value={stateId} onChange={(e) => { setStateId(e.target.value); setCityId(""); }}><option value="">Selecione</option>{states.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.uf}</option>)}</select></label><label>Cidade<select value={cityId} onChange={(e) => setCityId(e.target.value)} disabled={!stateId}><option value="">Selecione</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></>}
    {active === "Características" && <><h2>Características</h2>{!categoryId ? <p className="fieldNote">Escolha uma categoria na apresentação.</p> : attributes.length === 0 ? <p className="fieldNote">Esta categoria ainda não possui atributos configurados.</p> : attributes.map((a) => <label key={a.id}>{a.name}{a.field_type === "select" ? <select value={typeof attributeValues[a.id] === "string" ? attributeValues[a.id] as string : ""} onChange={(e) => setAttribute(a.id, e.target.value)} required={a.required}><option value="">Selecione</option>{optionsOf(a.options).map((o) => <option key={o} value={o}>{o}</option>)}</select> : a.field_type === "multiselect" ? <select multiple value={Array.isArray(attributeValues[a.id]) ? attributeValues[a.id] as string[] : []} onChange={(e) => setAttribute(a.id, Array.from(e.target.selectedOptions, (o) => o.value))}>{optionsOf(a.options).map((o) => <option key={o} value={o}>{o}</option>)}</select> : a.field_type === "boolean" ? <select value={typeof attributeValues[a.id] === "boolean" ? String(attributeValues[a.id]) : ""} onChange={(e) => setAttribute(a.id, e.target.value === "true")}><option value="">Selecione</option><option value="true">Sim</option><option value="false">Não</option></select> : a.field_type === "number" ? <input type="number" value={typeof attributeValues[a.id] === "number" || typeof attributeValues[a.id] === "string" ? String(attributeValues[a.id]) : ""} onChange={(e) => setAttribute(a.id, e.target.value === "" ? null : Number(e.target.value))} required={a.required} /> : a.field_type === "date" ? <input type="date" value={typeof attributeValues[a.id] === "string" ? attributeValues[a.id] as string : ""} onChange={(e) => setAttribute(a.id, e.target.value)} required={a.required} /> : <input value={typeof attributeValues[a.id] === "string" || typeof attributeValues[a.id] === "number" ? String(attributeValues[a.id]) : ""} onChange={(e) => setAttribute(a.id, e.target.value)} required={a.required} />}</label>)}</>}
    {active === "Serviços" && <><h2>Serviços</h2>{!categoryId ? <p className="fieldNote">Escolha uma categoria na apresentação.</p> : services.length === 0 ? <p className="fieldNote">Esta categoria ainda não possui serviços configurados.</p> : services.map((s) => <label key={s.id} className="serviceCheck"><span><input type="checkbox" checked={selectedServices[s.id] === true} onChange={(e) => toggleService(s.id, e.target.checked)} /> {s.name}{s.required ? " *" : ""}</span>{s.description && <small>{s.description}</small>}</label>)}<label>Observações sobre serviços<textarea value={servicesText} onChange={(e) => setServicesText(e.target.value)} rows={5} /></label></>}
    {active === "Preços" && <><h2>Preços</h2><label>Valor de referência<input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0,00" /></label></>}
    {active === "Publicação" && <><h2>Publicação</h2><div className="publicationBox"><p>O anúncio será salvo como <strong>rascunho</strong>. A publicação deverá ocorrer somente após revisão e validação.</p></div></>}
    {error && <p className="formError">{error}</p>}{message && <p className="formSuccess">{message}</p>}<button className="primaryButton" disabled={busy}>{busy ? "Salvando..." : "Salvar rascunho"}</button></form></div></section></main>;
}
