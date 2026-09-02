"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type StateRow = { id: number; uf: string; name: string };
type CityRow = { id: number; name: string; state_id?: number | null };
type CategoryRow = { id: number; name: string };
type AttributeRow = { id: string; name: string; slug: string; field_type: string; options: unknown; required: boolean; display_public: boolean; sort_order: number };
type ServiceRow = { id: string; name: string; slug: string; description: string | null; required: boolean; display_public: boolean; sort_order: number };

const sections = ["Apresentação", "Mídias", "Localização", "Características", "Serviços", "Preços", "Publicação"];

function optionsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export default function AnuncioPage() {
  const [active, setActive] = useState("Apresentação");
  const [title, setTitle] = useState(""); const [name, setName] = useState(""); const [summary, setSummary] = useState(""); const [description, setDescription] = useState("");
  const [stateId, setStateId] = useState(""); const [cityId, setCityId] = useState(""); const [categoryId, setCategoryId] = useState(""); const [age, setAge] = useState(""); const [height, setHeight] = useState(""); const [price, setPrice] = useState(""); const [servicesText, setServicesText] = useState("");
  const [zipcode, setZipcode] = useState(""); const [street, setStreet] = useState(""); const [number, setNumber] = useState(""); const [complement, setComplement] = useState(""); const [neighborhood, setNeighborhood] = useState(""); const [cepBusy, setCepBusy] = useState(false); const [latitude, setLatitude] = useState<number | null>(null); const [longitude, setLongitude] = useState<number | null>(null); const [locationMessage, setLocationMessage] = useState("");
  const [states, setStates] = useState<StateRow[]>([]); const [cities, setCities] = useState<CityRow[]>([]); const [categories, setCategories] = useState<CategoryRow[]>([]); const [attributes, setAttributes] = useState<AttributeRow[]>([]); const [services, setServices] = useState<ServiceRow[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string | string[] | boolean | number | null>>({}); const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [media, setMedia] = useState<any[]>([]); const [mediaBusy, setMediaBusy] = useState(false);

  useEffect(() => {
    let activeEffect = true;
    const load = async () => {
      try {
        const supabase = createClient();
        const [stateResult, categoryResult, profileResult] = await Promise.all([
          supabase.from("states").select("id,uf,name").order("name"),
          supabase.from("categories").select("id,name").order("sort_order,name"),
          supabase.from("advertiser_profiles").select("id,title,display_name,summary,description,state_id,city_id,category_id,birth_date,height_cm,pricing,service_options").maybeSingle(),
        ]);
        if (!activeEffect) return;
        if (stateResult.error || categoryResult.error || profileResult.error) setError("Não foi possível carregar todos os dados do anúncio.");
        setStates((stateResult.data || []) as StateRow[]);
        setCategories((categoryResult.data || []) as CategoryRow[]);
        const profile = profileResult.data;
        if (profile) {
          setTitle(profile.title || ""); setName(profile.display_name || ""); setSummary(profile.summary || ""); setDescription(profile.description || "");
          setStateId(profile.state_id ? String(profile.state_id) : ""); setCityId(profile.city_id ? String(profile.city_id) : ""); setCategoryId(profile.category_id ? String(profile.category_id) : "");
          setAge(profile.birth_date ? String(new Date(`${profile.birth_date}T00:00:00Z`).getUTCFullYear()) : "");
          setHeight(profile.height_cm == null ? "" : String(profile.height_cm));
          setPrice(profile.pricing?.price == null ? "" : String(profile.pricing.price)); setServicesText(profile.service_options?.description || "");
        }
        const { data: address } = await supabase.from("user_addresses").select("zipcode,street,number,complement,city_id,state_id,latitude,longitude").eq("address_type","primary").maybeSingle();
        if (address) {
          setZipcode(address.zipcode || ""); setStreet(address.street || ""); setNumber(address.number || ""); setComplement(address.complement || ""); setNeighborhood("");
          setLatitude(address.latitude == null ? null : Number(address.latitude)); setLongitude(address.longitude == null ? null : Number(address.longitude));
          if (address.city_id) setCityId(String(address.city_id)); if (address.state_id) setStateId(String(address.state_id));
        }
      } catch (err) { console.error("Erro ao carregar editor do anúncio", err); if (activeEffect) setError(err instanceof Error ? err.message : "Não foi possível carregar o editor."); }
      finally { if (activeEffect) setLoading(false); }
    };
    void load();
    return () => { activeEffect = false; };
  }, []);

  useEffect(() => {
    if (!stateId) { setCities([]); return; }
    let activeEffect = true;
    const loadCities = async () => {
      try { const supabase = createClient(); const { data, error: queryError } = await supabase.from("cities").select("id,name,state_id").eq("state_id", Number(stateId)).order("name"); if (queryError) throw queryError; if (activeEffect) setCities((data || []) as CityRow[]); }
      catch (err) { console.error("Erro ao carregar cidades", err); if (activeEffect) setCities([]); }
    };
    void loadCities(); return () => { activeEffect = false; };
  }, [stateId]);

  useEffect(() => {
    if (!categoryId) { setAttributes([]); setServices([]); setAttributeValues({}); setSelectedServices({}); return; }
    let activeEffect = true;
    const loadCategoryData = async () => {
      try {
        const supabase = createClient();
        const [a, s] = await Promise.all([
          supabase.from("category_attributes").select("id,name,slug,field_type,options,required,display_public,sort_order").eq("category_id", Number(categoryId)).order("sort_order"),
          supabase.from("category_services").select("id,name,slug,description,required,display_public,sort_order").eq("category_id", Number(categoryId)).order("sort_order"),
        ]);
        if (a.error || s.error) throw a.error || s.error;
        if (!activeEffect) return;
        setAttributes((a.data || []) as AttributeRow[]); setServices((s.data || []) as ServiceRow[]); setAttributeValues({}); setSelectedServices({});
      } catch (err) { console.error("Erro ao carregar características e serviços", err); if (activeEffect) { setAttributes([]); setServices([]); setError("Não foi possível carregar as características da categoria."); } }
    };
    void loadCategoryData(); return () => { activeEffect = false; };
  }, [categoryId]);

  async function lookupCep() {
    const cep = zipcode.replace(/\D/g, ""); setLocationMessage(""); if (cep.length !== 8) { setLocationMessage("Informe um CEP válido com 8 dígitos."); return; }
    setCepBusy(true);
    try { const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`); if (!response.ok) throw new Error("Não foi possível consultar o CEP."); const data = await response.json(); if (data.erro) throw new Error("CEP não encontrado."); setStreet(data.logradouro || ""); setNeighborhood(data.bairro || ""); const matchedState = states.find((s) => s.uf === data.uf); if (matchedState) { setStateId(String(matchedState.id)); const supabase = createClient(); const { data: cityRows } = await supabase.from("cities").select("id,name,state_id").eq("state_id", matchedState.id).eq("id", Number(data.ibge)); const city = cityRows?.[0]; if (city) setCityId(String(city.id)); else setLocationMessage("CEP encontrado, mas o município não foi localizado na base territorial do Pecatho."); } setLocationMessage(`CEP localizado: ${data.localidade} — ${data.uf}.`); }
    catch (err) { setLocationMessage(err instanceof Error ? err.message : "Não foi possível consultar o CEP."); } finally { setCepBusy(false); }
  }

  async function geolocateAddress() {
    setLocationMessage(""); if (!street || !number || !cityId || !stateId) { setLocationMessage("Preencha CEP, endereço, número, Estado e Cidade antes de localizar no mapa."); return; }
    setCepBusy(true);
    try { const city = cities.find((item) => item.id === Number(cityId)); const state = states.find((item) => item.id === Number(stateId)); const query = encodeURIComponent(`${street}, ${number}, ${city?.name || ""}, ${state?.uf || ""}, Brasil`); const response = await fetch(`/api/geocode?address=${query}`); if (!response.ok) throw new Error("Não foi possível localizar este endereço."); const result = await response.json(); if (!result?.latitude || !result?.longitude) throw new Error("Endereço não localizado. Confira o número e tente novamente."); setLatitude(Number(result.latitude)); setLongitude(Number(result.longitude)); setLocationMessage("Localização encontrada. O mapa público utilizará estas coordenadas."); }
    catch (err) { setLocationMessage(err instanceof Error ? err.message : "Não foi possível localizar o endereço."); } finally { setCepBusy(false); }
  }

  function setAttribute(id: string, value: string | string[] | boolean | number | null) { setAttributeValues((current) => ({ ...current, [id]: value })); }
  function toggleService(id: string, value: boolean) { setSelectedServices((current) => ({ ...current, [id]: value })); }

  async function uploadMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []); if (!files.length) return; setMediaBusy(true); setError(""); setMessage("");
    try { const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("Sessão expirada."); const {data: profile}=await supabase.from("advertiser_profiles").select("id").eq("user_id",user.id).maybeSingle(); if(!profile) throw new Error("Salve primeiro o rascunho do anúncio."); let order=media.length; for(const file of files){ if(!file.type.startsWith("image/") && !file.type.startsWith("video/")) throw new Error("Envie apenas imagens ou vídeos."); if(file.size>50*1024*1024) throw new Error("Cada arquivo deve ter no máximo 50 MB."); const kind=file.type.startsWith("video/")?"video":"image"; const ext=(file.name.split(".").pop()||"bin").toLowerCase(); const path=user.id+"/"+profile.id+"/"+crypto.randomUUID()+"."+ext; const up=await supabase.storage.from("pecatho-media").upload(path,file,{contentType:file.type,upsert:false}); if(up.error) throw up.error; const ins=await supabase.from("profile_media").insert({profile_id:profile.id,kind,storage_bucket:"pecatho-media",storage_path:path,original_filename:file.name,mime_type:file.type,size_bytes:file.size,sort_order:order,is_primary:order===0,is_public:true,moderation_status:"pending"}).select("*").single(); if(ins.error) throw ins.error; order++; } const {data}=await supabase.from("profile_media").select("*").eq("profile_id",profile.id).order("sort_order"); setMedia(data||[]); setMessage("Mídia enviada e encaminhada para moderação."); }
    catch(err){ setError(err instanceof Error?err.message:"Não foi possível enviar a mídia."); } finally { setMediaBusy(false); e.target.value=""; }
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage(""); setError("");
    try {
      const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) { window.location.href = "/login"; return; }
      if (!categoryId) throw new Error("Selecione uma categoria antes de salvar.");
      const missing = attributes.filter((a) => { const value = attributeValues[a.id]; return a.required && (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)); });
      if (missing.length) throw new Error(`Preencha os campos obrigatórios: ${missing.map((a) => a.name).join(", ")}.`);
      const requiredServices = services.filter((s) => s.required && selectedServices[s.id] !== true); if (requiredServices.length) throw new Error(`Selecione os serviços obrigatórios: ${requiredServices.map((s) => s.name).join(", ")}.`);
      const { data: old } = await supabase.from("advertiser_profiles").select("id").eq("user_id", user.id).maybeSingle();
      const normalizedPrice = price ? Number(price.replace(/\./g, "").replace(",", ".")) : null;
      const parsedAge = age.trim() ? Number(age) : null; const parsedHeight = height.trim() ? Number(height.replace(",", ".")) : null;
      if (parsedAge != null && (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 99)) throw new Error("Informe uma idade válida entre 18 e 99 anos.");
      if (parsedHeight != null && (!Number.isFinite(parsedHeight) || parsedHeight < 100 || parsedHeight > 250)) throw new Error("Informe uma altura válida entre 100 e 250 cm.");
      const birthDate = parsedAge == null ? null : (() => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - parsedAge); return d.toISOString().slice(0,10); })();
      const payload = { title, display_name: name, summary, description, state_id: stateId ? Number(stateId) : null, city_id: cityId ? Number(cityId) : null, category_id: Number(categoryId), birth_date: birthDate, height_cm: parsedHeight, pricing: { price: normalizedPrice }, service_options: { description: servicesText }, social_links: {}, payment_options: {} };
      const result = old ? await supabase.from("advertiser_profiles").update(payload).eq("id", old.id) : await supabase.from("advertiser_profiles").insert({ ...payload, user_id: user.id, status: "draft", verification_status: "unverified" }).select("id").single();
      if (result.error) throw new Error("Não foi possível salvar o anúncio. " + result.error.message);
      const profileId = old?.id || (result.data as { id: string } | null)?.id; if (!profileId) throw new Error("O perfil foi salvo, mas não foi possível identificar o anúncio.");
      const { error: clearAttrError } = await supabase.from("profile_attribute_values").delete().eq("profile_id", profileId); if (clearAttrError) throw new Error("Não foi possível atualizar as características do anúncio. " + clearAttrError.message);
      const attrs = attributes.filter((a) => attributeValues[a.id] !== undefined && attributeValues[a.id] !== "").map((a) => ({ profile_id: profileId, attribute_id: a.id, value: attributeValues[a.id] })); if (attrs.length) { const { error: attrError } = await supabase.from("profile_attribute_values").insert(attrs); if (attrError) throw new Error("Não foi possível salvar as características. " + attrError.message); }
      const { error: clearServiceError } = await supabase.from("profile_services").delete().eq("profile_id", profileId); if (clearServiceError) throw new Error("Não foi possível atualizar os serviços. " + clearServiceError.message);
      const selected = services.filter((s) => selectedServices[s.id] === true).map((s) => ({ profile_id: profileId, service_id: s.id, selected: true })); if (selected.length) { const { error: serviceError } = await supabase.from("profile_services").insert(selected); if (serviceError) throw new Error("Não foi possível salvar os serviços. " + serviceError.message); }
      setMessage("Rascunho salvo com sucesso.");
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar o anúncio."); } finally { setBusy(false); }
  }

  if (loading) return <main className="shell"><section className="hero"><p>Carregando editor...</p></section></main>;
  return <main className="shell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><Link href="/painel" className="navCta">Painel</Link></nav><section className="hero"><div className="eyebrow">EDITOR DO ANÚNCIO</div><h1>Construa seu <em>perfil.</em></h1><p className="heroCopy">Preencha as informações com atenção. O anúncio permanece em rascunho até passar pelo processo de revisão e publicação.</p><div className="editorGrid"><aside className="editorNav">{sections.map((section) => <button key={section} type="button" className={`editorTab ${active === section ? "active" : ""}`} onClick={() => setActive(section)}>{section}</button>)}</aside><form className="authCard editorCard" onSubmit={submit}>
    {active === "Apresentação" && <><h2>Apresentação</h2><label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label><label>Nome público<input value={name} onChange={(e) => setName(e.target.value)} required /></label><label>Resumo<textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} /></label><label>Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={7} /></label></>}
    {active === "Mídias" && <><h2>Mídias do anúncio</h2><p className="fieldNote">Adicione fotos e vídeos ao anúncio. Os arquivos ficarão associados ao seu anúncio e passarão pela revisão antes da publicação.</p><label>Selecionar imagens ou vídeos<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple onChange={uploadMedia} disabled={mediaBusy} /></label>{mediaBusy && <p className="fieldNote">Enviando mídia...</p>}</>}
    {active === "Localização" && <><h2>Localização</h2><label>Categoria<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required><option value="">Selecione uma categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>CEP<div style={{display:"flex",gap:8}}><input value={zipcode} onChange={(e) => setZipcode(e.target.value.replace(/\D/g,"").slice(0,8))} onBlur={() => { if (zipcode.replace(/\D/g,"").length === 8) lookupCep(); }} inputMode="numeric" placeholder="00000-000" /><button type="button" className="secondaryButton" onClick={lookupCep} disabled={cepBusy}>{cepBusy ? "Consultando..." : "Consultar CEP"}</button></div></label><label>Logradouro<input value={street} onChange={(e) => setStreet(e.target.value)} /></label><label>Número<input value={number} onChange={(e) => setNumber(e.target.value)} /></label><label>Complemento<input value={complement} onChange={(e) => setComplement(e.target.value)} /></label><label>Bairro<input value={neighborhood} readOnly /></label><label>Estado<select value={stateId} onChange={(e) => { setStateId(e.target.value); setCityId(""); }}><option value="">Selecione</option>{states.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.uf}</option>)}</select></label><label>Cidade<select value={cityId} onChange={(e) => setCityId(e.target.value)} disabled={!stateId}><option value="">Selecione</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button type="button" className="secondaryButton" onClick={geolocateAddress} disabled={cepBusy}>{cepBusy ? "Localizando..." : "Localizar endereço no mapa"}</button>{locationMessage && <p className="fieldNote">{locationMessage}</p>}{latitude != null && longitude != null && <div className="mapCard"><div className="mapHeader"><div><strong>Pré-visualização da localização</strong><span>O endereço exato não será exibido publicamente.</span></div><a href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`} target="_blank" rel="noreferrer">Abrir no Google Maps</a></div><iframe className="mapFrame" title="Mapa da localização do anúncio" loading="lazy" src={`https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`} /></div>}</>}
    {active === "Características" && <><h2>Características</h2><div className="formGrid"><label>Idade<input type="number" min={18} max={99} value={age} onChange={(e) => setAge(e.target.value)} placeholder="18" /></label><label>Altura (cm)<input type="number" min={100} max={250} value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" /></label></div>{!categoryId ? <p className="fieldNote">Escolha uma categoria na aba Localização.</p> : attributes.length === 0 ? <p className="fieldNote">Esta categoria ainda não possui atributos configurados.</p> : attributes.map((a) => <label key={a.id}>{a.name}{a.field_type === "select" ? <select value={typeof attributeValues[a.id] === "string" ? attributeValues[a.id] as string : ""} onChange={(e) => setAttribute(a.id, e.target.value)} required={a.required}><option value="">Selecione</option>{optionsOf(a.options).map((o) => <option key={o} value={o}>{o}</option>)}</select> : a.field_type === "multiselect" ? <select multiple value={Array.isArray(attributeValues[a.id]) ? attributeValues[a.id] as string[] : []} onChange={(e) => setAttribute(a.id, Array.from(e.target.selectedOptions, (o) => o.value))}>{optionsOf(a.options).map((o) => <option key={o} value={o}>{o}</option>)}</select> : a.field_type === "boolean" ? <select value={typeof attributeValues[a.id] === "boolean" ? String(attributeValues[a.id]) : ""} onChange={(e) => setAttribute(a.id, e.target.value === "true")}><option value="">Selecione</option><option value="true">Sim</option><option value="false">Não</option></select> : a.field_type === "number" ? <input type="number" value={attributeValues[a.id] == null ? "" : String(attributeValues[a.id])} onChange={(e) => setAttribute(a.id, e.target.value === "" ? null : Number(e.target.value))} required={a.required} /> : <input value={attributeValues[a.id] == null ? "" : String(attributeValues[a.id])} onChange={(e) => setAttribute(a.id, e.target.value)} required={a.required} />}</label>)}</>}
    {active === "Serviços" && <><h2>Serviços</h2>{!categoryId ? <p className="fieldNote">Escolha uma categoria na aba Localização.</p> : services.length === 0 ? <p className="fieldNote">Esta categoria ainda não possui serviços configurados.</p> : services.map((s) => <label key={s.id} className="serviceCheck"><span><input type="checkbox" checked={selectedServices[s.id] === true} onChange={(e) => toggleService(s.id, e.target.checked)} /> {s.name}{s.required ? " *" : ""}</span>{s.description && <small>{s.description}</small>}</label>)}<label>Observações sobre serviços<textarea value={servicesText} onChange={(e) => setServicesText(e.target.value)} rows={5} /></label></>}
    {active === "Preços" && <><h2>Preços</h2><label>Valor de referência<input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0,00" /></label></>}
    {active === "Publicação" && <><h2>Publicação</h2><div className="publicationBox"><p>O anúncio será salvo como <strong>rascunho</strong>. A publicação deverá ocorrer somente após revisão e validação.</p></div></>}
    {error && <p className="formError">{error}</p>}{message && <p className="formSuccess">{message}</p>}<button className="primaryButton" disabled={busy}>{busy ? "Salvando..." : "Salvar rascunho"}</button></form></div></section></main>;
}
