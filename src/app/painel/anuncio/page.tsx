"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type StateRow = { id: number; uf: string; name: string };
type CityRow = { id: number; name: string; state_id?: number | null; ibge_code?: string | null };
type CategoryRow = { id: number; name: string; display?: boolean };
type AttributeOption = string | { label?: string; value?: string };
type AttributeRow = { id: string; name: string; slug: string; field_type: string; options: unknown; required: boolean; display_public: boolean; sort_order: number };
type ServiceRow = { id: string; name: string; slug: string; description: string | null; required: boolean; display_public: boolean; sort_order: number };
type MediaRow = { id: string; kind: string; storage_bucket: string; storage_path: string; original_filename: string | null; mime_type: string | null; size_bytes: number | null; sort_order: number; is_primary: boolean; is_public: boolean; moderation_status: string; access_type?: string; price?: number; preview_url?: string };
type JsonObject = Record<string, unknown>;
type PricingPeriod = { minutes: number; price: number; period: string; starting_from?: boolean };
const PRICING_OPTIONS: PricingPeriod[] = [
  { minutes: 15, price: 0, period: "15 Minutos" },
  { minutes: 30, price: 0, period: "30 Minutos" },
  { minutes: 60, price: 0, period: "1 Hora" },
  { minutes: 120, price: 0, period: "2 Horas" },
  { minutes: 180, price: 0, period: "3 Horas" },
  { minutes: 240, price: 0, period: "4 Horas" },
  { minutes: 480, price: 0, period: "8 Horas" },
  { minutes: 720, price: 0, period: "12 Horas" },
  { minutes: 1440, price: 0, period: "Diária" },
  { minutes: 2880, price: 0, period: "2 Diárias" },
  { minutes: 0, price: 0, period: "Pernoite" },
  { minutes: 0, price: 0, period: "Diária de viagem" },
];

const sections = ["Apresentação", "Mídias", "Localização", "Características", "Serviços", "Preços", "Contato", "Publicação"];

function asObject(value: unknown): JsonObject { return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {}; }
function optionPairs(value: unknown): { label: string; value: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: AttributeOption) => {
    if (typeof item === "string") return [{ label: item, value: item }];
    if (item && typeof item === "object" && typeof item.value === "string") return [{ label: typeof item.label === "string" ? item.label : item.value, value: item.value }];
    return [];
  });
}
function calculateAge(date: string | null): string {
  if (!date) return "";
  const birth = new Date(`${date}T00:00:00Z`); const now = new Date();
  let years = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years >= 0 ? String(years) : "";
}

export default function AnuncioPage() {
  const [active, setActive] = useState("Apresentação");
  const [title, setTitle] = useState(""); const [name, setName] = useState(""); const [summary, setSummary] = useState(""); const [description, setDescription] = useState("");
  const [stateId, setStateId] = useState(""); const [cityId, setCityId] = useState(""); const [categoryId, setCategoryId] = useState("");
  const [birthDate, setBirthDate] = useState(""); const [age, setAge] = useState(""); const [cpf, setCpf] = useState(""); const [height, setHeight] = useState(""); const [weight, setWeight] = useState("");
  const [availability, setAvailability] = useState(""); const [price, setPrice] = useState(""); const [pricingPeriods, setPricingPeriods] = useState<PricingPeriod[]>([{ minutes: 60, price: 0, period: "1 Hora" }]); const [servicesText, setServicesText] = useState("");
  const [phone, setPhone] = useState(""); const [whatsapp, setWhatsapp] = useState(""); const [phoneSecondary, setPhoneSecondary] = useState("");
  const [positioning, setPositioning] = useState(""); const [paymentOptionsText, setPaymentOptionsText] = useState(""); const [socialLinksText, setSocialLinksText] = useState("");
  const [zipcode, setZipcode] = useState(""); const [street, setStreet] = useState(""); const [number, setNumber] = useState(""); const [complement, setComplement] = useState(""); const [neighborhood, setNeighborhood] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState<string>(""); const [locationVisibility, setLocationVisibility] = useState("private"); const [cepBusy, setCepBusy] = useState(false); const [latitude, setLatitude] = useState<number | null>(null); const [longitude, setLongitude] = useState<number | null>(null); const [publicLatitude, setPublicLatitude] = useState<number | null>(null); const [publicLongitude, setPublicLongitude] = useState<number | null>(null); const [locationMessage, setLocationMessage] = useState("");
  const [states, setStates] = useState<StateRow[]>([]); const [cities, setCities] = useState<CityRow[]>([]); const [categories, setCategories] = useState<CategoryRow[]>([]); const [attributes, setAttributes] = useState<AttributeRow[]>([]); const [services, setServices] = useState<ServiceRow[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, unknown>>({}); const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({}); const [serviceNotes, setServiceNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true); const [catalogBusy, setCatalogBusy] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [media, setMedia] = useState<MediaRow[]>([]); const [mediaBusy, setMediaBusy] = useState(false); const [profileStatus, setProfileStatus] = useState(""); const [verificationStatus, setVerificationStatus] = useState(""); const [publishBusy, setPublishBusy] = useState(false);

  const visibleCities = useMemo(() => cities.filter((c) => !stateId || String(c.state_id) === stateId), [cities, stateId]);
  const selectedCategory = categories.find((c) => String(c.id) === categoryId);

  const publicationReadiness = useMemo(() => {
    const paymentMethods = (() => {
      if (!paymentOptionsText.trim()) return false;
      try {
        const parsed = JSON.parse(paymentOptionsText);
        const methods = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as JsonObject).methods : null;
        return Boolean(methods && typeof methods === "object" && !Array.isArray(methods) && Object.values(methods as Record<string, unknown>).some((value) => value === true));
      } catch {
        return false;
      }
    })();
    const approvedPrimaryImage = media.some((item) => item.kind === "image" && item.is_primary && item.moderation_status === "approved" && item.is_public);
    const requiredServicesReady = services.every((service) => !service.required || selectedServices[service.id] === true);
    const atLeastOneServiceReady = services.length === 0 || Object.values(selectedServices).some(Boolean);
    const validPrice = pricingPeriods.length > 0 && pricingPeriods.some((row) => row.minutes === 60 && Number(row.price) > 0) && pricingPeriods.every((row) => Number(row.price) > 0 && Number.isFinite(Number(row.price)));
    const ageReady = Boolean(birthDate && Number(calculateAge(birthDate)) >= 18);
    const checks = [
      { key: "presentation", label: "Apresentação", detail: "Título, resumo, descrição e categoria", ready: title.trim().length >= 3 && summary.trim().length >= 20 && description.trim().length >= 50 && Boolean(categoryId) },
      { key: "identity", label: "Idade e identidade", detail: "Data de nascimento compatível com 18+", ready: ageReady },
      { key: "location", label: "Localização", detail: "Estado, cidade e coordenadas do endereço", ready: Boolean(stateId && cityId && latitude != null && longitude != null) },
      { key: "availability", label: "Disponibilidade", detail: "Informe os dias e horários de atendimento", ready: availability.trim().length > 0 },
      { key: "services", label: "Serviços", detail: "Serviços obrigatórios e pelo menos um serviço", ready: requiredServicesReady && atLeastOneServiceReady },
      { key: "pricing", label: "Preços", detail: "1 Hora acima de zero e demais períodos válidos", ready: validPrice },
      { key: "payment", label: "Pagamento", detail: "Ao menos uma forma de pagamento", ready: paymentMethods },
      { key: "contact", label: "Contato", detail: "Telefone ou WhatsApp válido", ready: phone.replace(/\\D/g, "").length >= 10 || whatsapp.replace(/\\D/g, "").length >= 10 },
      { key: "media", label: "Foto principal", detail: media.length === 0 ? "Adicione uma mídia" : approvedPrimaryImage ? "Foto principal aprovada" : "Aguardando aprovação da moderação", ready: approvedPrimaryImage },
    ];
    return { checks, ready: checks.every((check) => check.ready) };
  }, [title, summary, description, categoryId, birthDate, stateId, cityId, latitude, longitude, availability, services, selectedServices, pricingPeriods, paymentOptionsText, phone, whatsapp, media]);

  async function loadMedia(profileId: string) {
    const supabase = createClient();
    const { data, error: mediaError } = await supabase.from("profile_media").select("id,kind,storage_bucket,storage_path,original_filename,mime_type,size_bytes,sort_order,is_primary,is_public,moderation_status,access_type,price").eq("profile_id", profileId).order("sort_order");
    if (mediaError) return;
    const rows = (data || []) as MediaRow[];
    const withUrls = await Promise.all(rows.map(async (row) => {
      if (row.access_type === "paid" || row.is_public === false) return row;
      const signed = await supabase.storage.from(row.storage_bucket).createSignedUrl(row.storage_path, 600);
      return { ...row, preview_url: signed.data?.signedUrl || undefined };
    }));
    setMedia(withUrls);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/login"; return; }
        const [{ data: stateData, error: stateError }, { data: categoryData, error: categoryError }, { data: profile, error: profileError }, { data: address, error: addressError }, { data: accountProfile, error: accountProfileError }] = await Promise.all([
          supabase.from("states").select("id,uf,name").order("name"),
          supabase.from("categories").select("id,name,display").eq("display", true).order("sort_order,name"),
          supabase.from("advertiser_profiles").select("id,user_id,title,display_name,summary,description,state_id,city_id,category_id,neighborhood_id,birth_date,height_cm,weight_kg,availability,phone,whatsapp,phone_secondary,pricing,service_options,payment_options,social_links,positioning,primary_media_id,status,verification_status").maybeSingle(),
          supabase.from("user_addresses").select("id,zipcode,street,number,complement,neighborhood_id,city_id,state_id,latitude,longitude,location_visibility,public_latitude,public_longitude").eq("user_id", user.id).eq("address_type","primary").maybeSingle(),
          supabase.from("profiles").select("id,display_name,legal_name,email,phone,cpf,birth_date").eq("id", user.id).maybeSingle(),
        ]);
        if (!alive) return;
        if (stateError || categoryError || profileError || addressError || accountProfileError) setError("Não foi possível carregar todos os dados do anúncio.");
        setStates((stateData || []) as StateRow[]); setCategories((categoryData || []) as CategoryRow[]);
        if (accountProfile) {
          setCpf(accountProfile.cpf ? String(accountProfile.cpf) : "");
          if (accountProfile.birth_date) { setBirthDate(String(accountProfile.birth_date)); setAge(calculateAge(String(accountProfile.birth_date))); }
          if (accountProfile.display_name || accountProfile.legal_name) setName(String(accountProfile.display_name || accountProfile.legal_name || ""));
          if (accountProfile.phone) setPhone(String(accountProfile.phone));
        }
        if (profile) {
          const pricing = asObject(profile.pricing); const serviceOptions = asObject(profile.service_options); const paymentOptions = asObject(profile.payment_options); const socialLinks = asObject(profile.social_links);
          setProfileStatus(profile.status || ""); setVerificationStatus(profile.verification_status || ""); setTitle(profile.title || ""); setName(profile.display_name || ""); setSummary(profile.summary || ""); setDescription(profile.description || ""); setStateId(profile.state_id ? String(profile.state_id) : ""); setCityId(profile.city_id ? String(profile.city_id) : ""); setCategoryId(profile.category_id ? String(profile.category_id) : "");
          setBirthDate(accountProfile?.birth_date || profile.birth_date || ""); setAge(calculateAge(accountProfile?.birth_date || profile.birth_date || null)); setHeight(profile.height_cm == null ? "" : String(profile.height_cm)); setWeight(profile.weight_kg == null ? "" : String(profile.weight_kg)); setAvailability(profile.availability || "");
          const loadedPeriods = Array.isArray(pricing.periods) ? pricing.periods.flatMap((row: unknown) => {
            const item = asObject(row);
            const minutes = Number(item.minutes);
            const amount = Number(item.price);
            const period = typeof item.period === "string" ? item.period : minutes === 60 ? "1 Hora" : "";
            if (!Number.isFinite(amount) || amount < 0 || (!period && !Number.isFinite(minutes))) return [];
            return [{ minutes: Number.isFinite(minutes) ? minutes : 0, price: amount, period: period || "Período", starting_from: item.starting_from === true }];
          }) : [];
          const fallbackPrice = pricing.price == null ? "" : String(pricing.price);
          setPrice(fallbackPrice);
          setPricingPeriods(loadedPeriods.length ? loadedPeriods : fallbackPrice ? [{ minutes: 60, price: Number(fallbackPrice), period: "1 Hora" }] : [{ minutes: 60, price: 0, period: "1 Hora" }]);
          setServicesText(typeof serviceOptions.description === "string" ? serviceOptions.description : ""); setPaymentOptionsText(JSON.stringify(paymentOptions, null, 2)); setSocialLinksText(JSON.stringify(socialLinks, null, 2)); setPositioning(profile.positioning || "");
          setPhone(profile.phone || accountProfile?.phone || ""); setWhatsapp(profile.whatsapp || ""); setPhoneSecondary(profile.phone_secondary || "");
          void loadMedia(profile.id);
        }
        if (address) { setZipcode(address.zipcode || ""); setStreet(address.street || ""); setNumber(address.number || ""); setComplement(address.complement || ""); setNeighborhoodId(address.neighborhood_id ? String(address.neighborhood_id) : ""); setLatitude(address.latitude == null ? null : Number(address.latitude)); setLongitude(address.longitude == null ? null : Number(address.longitude)); setPublicLatitude(address.public_latitude == null ? null : Number(address.public_latitude)); setPublicLongitude(address.public_longitude == null ? null : Number(address.public_longitude)); setLocationVisibility(address.location_visibility || "private"); if (address.city_id) setCityId(String(address.city_id)); if (address.state_id) setStateId(String(address.state_id)); }
      } catch (err) { if (alive) setError(err instanceof Error ? err.message : "Não foi possível carregar o editor."); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!stateId) { setCities([]); return; }
    let alive = true; const supabase = createClient();
    (async () => { const { data, error: queryError } = await supabase.from("cities").select("id,name,state_id,ibge_code").eq("state_id", Number(stateId)).order("name"); if (alive) { if (queryError) setError("Não foi possível carregar as cidades."); setCities((data || []) as CityRow[]); } })();
    return () => { alive = false; };
  }, [stateId]);

  useEffect(() => {
    if (!categoryId) { setAttributes([]); setServices([]); setAttributeValues({}); setSelectedServices({}); setServiceNotes({}); return; }
    let alive = true; setCatalogBusy(true); setError(""); const supabase = createClient();
    (async () => {
      const [a, s] = await Promise.all([
        supabase.from("category_attributes").select("id,name,slug,field_type,options,required,display_public,sort_order").eq("category_id", Number(categoryId)).order("sort_order"),
        supabase.from("category_services").select("id,name,slug,description,required,display_public,sort_order").eq("category_id", Number(categoryId)).order("sort_order"),
      ]);
      if (!alive) return;
      if (a.error || s.error) { setError("Não foi possível carregar as características e serviços da categoria."); setAttributes([]); setServices([]); setCatalogBusy(false); return; }
      const nextAttributes = (a.data || []) as AttributeRow[]; const nextServices = (s.data || []) as ServiceRow[]; setAttributes(nextAttributes); setServices(nextServices);
      const { data: profile } = await supabase.from("advertiser_profiles").select("id").eq("user_id", (await supabase.auth.getUser()).data.user?.id || "").maybeSingle();
      if (profile) {
        const [{ data: values }, { data: savedServices }] = await Promise.all([
          supabase.from("profile_attribute_values").select("attribute_id,value").eq("profile_id", profile.id),
          supabase.from("profile_services").select("service_id,selected,notes").eq("profile_id", profile.id),
        ]);
        const valueMap: Record<string, unknown> = {}; for (const row of values || []) valueMap[String(row.attribute_id)] = row.value;
        const serviceMap: Record<string, boolean> = {}; const notesMap: Record<string, string> = {}; for (const row of savedServices || []) { serviceMap[String(row.service_id)] = row.selected === true; if (row.notes) notesMap[String(row.service_id)] = row.notes; }
        setAttributeValues(valueMap); setSelectedServices(serviceMap); setServiceNotes(notesMap);
        const ageAttribute = nextAttributes.find((x) => x.slug === "idade"); const heightAttribute = nextAttributes.find((x) => x.slug === "altura");
        if (ageAttribute && valueMap[ageAttribute.id] != null && valueMap[ageAttribute.id] !== "") setAge(String(valueMap[ageAttribute.id]));
        if (heightAttribute && valueMap[heightAttribute.id] != null && valueMap[heightAttribute.id] !== "") setHeight(String(valueMap[heightAttribute.id]));
      }
      setCatalogBusy(false);
    })();
    return () => { alive = false; };
  }, [categoryId]);

  function setAttribute(id: string, value: unknown) { setAttributeValues((current) => ({ ...current, [id]: value })); }
  function toggleService(id: string, value: boolean) { setSelectedServices((current) => ({ ...current, [id]: value })); }
  function togglePublicLocation() {
    if (latitude == null || longitude == null) { setLocationMessage("Localize o endereço primeiro para definir uma localização pública aproximada."); return; }
    setLocationVisibility("approximate"); setPublicLatitude(Number(latitude.toFixed(3))); setPublicLongitude(Number(longitude.toFixed(3)));
  }

  async function lookupCep() {
    const cep = zipcode.replace(/\D/g, ""); setLocationMessage(""); if (cep.length !== 8) { setLocationMessage("Informe um CEP válido com 8 dígitos."); return; }
    setCepBusy(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`); if (!response.ok) throw new Error("Não foi possível consultar o CEP."); const data = await response.json(); if (data.erro) throw new Error("CEP não encontrado.");
      setStreet(data.logradouro || ""); setNeighborhood(data.bairro || ""); const matchedState = states.find((s) => s.uf === data.uf); if (matchedState) {
        setStateId(String(matchedState.id)); const supabase = createClient(); const { data: cityRows } = await supabase.from("cities").select("id,name,state_id,ibge_code").eq("state_id", matchedState.id).or(`ibge_code.eq.${data.ibge},id.eq.${data.ibge}`).limit(1); const city = cityRows?.[0]; if (city) setCityId(String(city.id));
      }
      setLocationMessage(`CEP localizado: ${data.localidade} — ${data.uf}.`);
    } catch (err) { setLocationMessage(err instanceof Error ? err.message : "Não foi possível consultar o CEP."); } finally { setCepBusy(false); }
  }

  async function geolocateAddress() {
    if (!street || !number || !cityId || !stateId) { setLocationMessage("Preencha logradouro, número, Estado e Cidade antes de localizar no mapa."); return; }
    setCepBusy(true); setLocationMessage("");
    try { const city = cities.find((item) => item.id === Number(cityId)); const state = states.find((item) => item.id === Number(stateId)); const query = encodeURIComponent(`${street}, ${number}, ${city?.name || ""}, ${state?.uf || ""}, Brasil`); const response = await fetch(`/api/geocode?address=${query}`); if (!response.ok) throw new Error("Não foi possível localizar este endereço."); const result = await response.json(); if (typeof result?.latitude !== "number" || typeof result?.longitude !== "number") throw new Error("Endereço não localizado. Confira o número e tente novamente."); setLatitude(result.latitude); setLongitude(result.longitude); setLocationMessage("Localização encontrada. O endereço exato permanece privado."); } catch (err) { setLocationMessage(err instanceof Error ? err.message : "Não foi possível localizar o endereço."); } finally { setCepBusy(false); }
  }

  async function saveAddress(supabase: ReturnType<typeof createClient>, userId: string) {
    const payload = { user_id: userId, address_type: "primary", zipcode: zipcode || null, street: street || null, number: number || null, complement: complement || null, neighborhood_id: neighborhoodId ? Number(neighborhoodId) : null, city_id: cityId ? Number(cityId) : null, state_id: stateId ? Number(stateId) : null, latitude, longitude, location_visibility: locationVisibility, public_latitude: locationVisibility === "approximate" ? publicLatitude : null, public_longitude: locationVisibility === "approximate" ? publicLongitude : null, is_primary: true };
    const { data: existing, error: existingError } = await supabase.from("user_addresses").select("id").eq("user_id", userId).eq("address_type", "primary").maybeSingle(); if (existingError) throw existingError;
    if (existing) { const { error } = await supabase.from("user_addresses").update(payload).eq("id", existing.id); if (error) throw error; } else { const { error } = await supabase.from("user_addresses").insert(payload); if (error) throw error; }
  }

  async function uploadMedia(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []); if (!files.length) return; setMediaBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("Sessão expirada.");
      let profile: { id: string } | null = null;
      const existing = await supabase.from("advertiser_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (existing.error) throw existing.error;
      profile = existing.data as { id: string } | null;
      if (!profile) {
        const response = await fetch("/api/painel/anuncio/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: categoryId ? Number(categoryId) : null }) });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.profile?.id) throw new Error(payload?.error || "Não foi possível criar o rascunho do anúncio antes do envio da mídia.");
        profile = { id: String(payload.profile.id) };
      }
      let order = media.length;
      for (const file of files) {
        if (!(file.type.startsWith("image/") || file.type.startsWith("video/"))) throw new Error("Envie apenas imagens ou vídeos.");
        if (file.size > 50 * 1024 * 1024) throw new Error("Cada arquivo deve ter no máximo 50 MB.");
        const kind = file.type.startsWith("video/") ? "video" : "image"; const ext = (file.name.split(".").pop() || "bin").toLowerCase(); const path = `${user.id}/${profile.id}/${crypto.randomUUID()}.${ext}`;
        const upload = await supabase.storage.from("pecatho-media").upload(path, file, { contentType: file.type, upsert: false }); if (upload.error) throw upload.error;
        const insert = await supabase.from("profile_media").insert({ profile_id: profile.id, kind, storage_bucket: "pecatho-media", storage_path: path, original_filename: file.name, mime_type: file.type, size_bytes: file.size, sort_order: order, is_primary: order === 0, is_public: true, moderation_status: "pending", access_type: "public", price: 0 }).select("id,kind,storage_bucket,storage_path,original_filename,mime_type,size_bytes,sort_order,is_primary,is_public,moderation_status,access_type,price").single(); if (insert.error) throw insert.error; order++;
      }
      await loadMedia(profile.id); setMessage("Mídia enviada e encaminhada para moderação.");
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível enviar a mídia."); } finally { setMediaBusy(false); e.target.value = ""; }
  }

  async function requestPublication() {
    setPublishBusy(true); setMessage(""); setError("");
    try {
      const saved = await saveDraft();
      if (!saved) return;
      setMessage("");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase.from("advertiser_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!profile?.id) throw new Error("Não foi possível identificar o anúncio após salvar o rascunho.");
      const { data, error: rpcError } = await supabase.rpc("submit_advertiser_for_review", { p_profile_id: profile.id });
      if (rpcError) throw new Error(rpcError.message);
      setProfileStatus(data?.status || "pending_review");
      setMessage("Alterações salvas e anúncio enviado para análise. A publicação dependerá da validação administrativa e da moderação das mídias.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o anúncio para análise.");
    } finally {
      setPublishBusy(false);
    }
  }

  async function saveDraft() {
    setBusy(true); setMessage(""); setError("");
    try {
      const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) { window.location.href = "/login"; return; }
      if (!categoryId) throw new Error("Selecione uma categoria antes de salvar.");
      const missing = attributes.filter((a) => { const value = attributeValues[a.id]; return a.slug !== "idade" && a.required && (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)); }); if (missing.length) throw new Error(`Preencha os campos obrigatórios: ${missing.map((a) => a.name).join(", ")}.`);
      const requiredServices = services.filter((s) => s.required && selectedServices[s.id] !== true); if (requiredServices.length) throw new Error(`Selecione os serviços obrigatórios: ${requiredServices.map((s) => s.name).join(", ")}.`);
      const parsedHeight = height.trim() ? Number(height.replace(",", ".")) : null; const parsedWeight = weight.trim() ? Number(weight.replace(",", ".")) : null; const parsedAge = birthDate ? Number(calculateAge(birthDate)) : null;
      if (parsedAge != null && (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 99)) throw new Error("A data de nascimento não produz uma idade válida."); if (parsedHeight != null && (!Number.isFinite(parsedHeight) || parsedHeight < 100 || parsedHeight > 250)) throw new Error("Informe uma altura válida entre 100 e 250 cm."); if (parsedWeight != null && (!Number.isFinite(parsedWeight) || parsedWeight < 30 || parsedWeight > 300)) throw new Error("Informe um peso válido entre 30 e 300 kg.");
      const effectiveBirthDate = birthDate || null;
      if (pricingPeriods.length > 5) throw new Error("Cadastre no máximo 5 períodos de atendimento.");
      if (!pricingPeriods.some((row) => row.minutes === 60 && Number(row.price) > 0)) throw new Error("Informe um valor maior que zero para o período de 1 Hora.");
      if (pricingPeriods.some((row) => !Number.isFinite(Number(row.price)) || Number(row.price) <= 0)) throw new Error("Informe valores maiores que zero para todos os períodos selecionados.");
      const normalizedPricingPeriods = pricingPeriods.map((row) => ({ minutes: row.minutes, period: row.period, price: Number(row.price), ...(row.starting_from ? { starting_from: true } : {}) }));
      const old = await supabase.from("advertiser_profiles").select("id,pricing,service_options,payment_options,social_links").eq("user_id", user.id).maybeSingle(); if (old.error) throw old.error;
      const oldProfile = old.data; const oldPricing = asObject(oldProfile?.pricing); const oldServiceOptions = asObject(oldProfile?.service_options); const oldPaymentOptions = asObject(oldProfile?.payment_options); const oldSocialLinks = asObject(oldProfile?.social_links);
      let paymentOptions: JsonObject = oldPaymentOptions; let socialLinks: JsonObject = oldSocialLinks;
      if (paymentOptionsText.trim()) { try { const parsed = JSON.parse(paymentOptionsText); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) paymentOptions = parsed; else throw new Error("JSON de pagamentos inválido."); } catch { throw new Error("As opções de pagamento precisam estar em JSON válido."); } }
      if (socialLinksText.trim()) { try { const parsed = JSON.parse(socialLinksText); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) socialLinks = parsed; else throw new Error("JSON de redes sociais inválido."); } catch { throw new Error("As redes sociais precisam estar em JSON válido."); } }
      const payload = { title, display_name: name, summary, description, state_id: stateId ? Number(stateId) : null, city_id: cityId ? Number(cityId) : null, category_id: Number(categoryId), birth_date: effectiveBirthDate, height_cm: parsedHeight, weight_kg: parsedWeight, availability: availability || null, phone: phone || null, whatsapp: whatsapp || null, phone_secondary: phoneSecondary || null, positioning: positioning || null, pricing: { ...oldPricing, price: pricingPeriods.find((row) => row.minutes === 60)?.price ?? (price.trim() ? Number(price.replace(/\./g, "").replace(",", ".")) : null), periods: normalizedPricingPeriods }, service_options: { ...oldServiceOptions, description: servicesText }, payment_options: paymentOptions, social_links: socialLinks };
      const result = oldProfile ? await supabase.from("advertiser_profiles").update(payload).eq("id", oldProfile.id) : await supabase.from("advertiser_profiles").insert({ ...payload, user_id: user.id, status: "draft", verification_status: "unverified" }).select("id").single(); if (result.error) throw new Error("Não foi possível salvar o anúncio. " + result.error.message);
      const profileId = oldProfile?.id || (result.data as { id: string } | null)?.id; if (!profileId) throw new Error("O perfil foi salvo, mas não foi possível identificar o anúncio.");
      const ageAttr = attributes.find((a) => a.slug === "idade"); const heightAttr = attributes.find((a) => a.slug === "altura"); const valuesToSave = { ...attributeValues }; if (ageAttr && parsedAge != null) valuesToSave[ageAttr.id] = parsedAge; if (heightAttr && parsedHeight != null) valuesToSave[heightAttr.id] = parsedHeight;
      const { error: clearAttrError } = await supabase.from("profile_attribute_values").delete().eq("profile_id", profileId); if (clearAttrError) throw new Error("Não foi possível atualizar as características. " + clearAttrError.message); const attributeRows = attributes.filter((a) => valuesToSave[a.id] !== undefined && valuesToSave[a.id] !== null && valuesToSave[a.id] !== "").map((a) => ({ profile_id: profileId, attribute_id: a.id, value: valuesToSave[a.id] })); if (attributeRows.length) { const { error } = await supabase.from("profile_attribute_values").insert(attributeRows); if (error) throw new Error("Não foi possível salvar as características. " + error.message); }
      const { error: clearServiceError } = await supabase.from("profile_services").delete().eq("profile_id", profileId); if (clearServiceError) throw new Error("Não foi possível atualizar os serviços. " + clearServiceError.message); const serviceRows = services.map((s) => ({ profile_id: profileId, service_id: s.id, selected: selectedServices[s.id] === true, notes: serviceNotes[s.id] || null })); if (serviceRows.length) { const { error } = await supabase.from("profile_services").insert(serviceRows); if (error) throw new Error("Não foi possível salvar os serviços. " + error.message); }
      await saveAddress(supabase, user.id); await loadMedia(profileId); setBirthDate(effectiveBirthDate || ""); setMessage("Rascunho salvo com sucesso, preservando as informações existentes."); return true;
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar o anúncio."); return false; } finally { setBusy(false); }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    await saveDraft();
  }

  function renderAttribute(a: AttributeRow) {
    const value = attributeValues[a.id]; const options = optionPairs(a.options); const label = `${a.name}${a.required ? " *" : ""}`;
    if (a.slug === "idade" || a.slug === "altura") return null;
    if (a.field_type === "boolean") return <label key={a.id}>{label}<select value={typeof value === "boolean" ? String(value) : ""} onChange={(e) => setAttribute(a.id, e.target.value === "" ? null : e.target.value === "true")}><option value="">Selecione</option><option value="true">Sim</option><option value="false">Não</option></select></label>;
    if (a.field_type === "select") return <label key={a.id}>{label}<select value={typeof value === "string" ? value : ""} onChange={(e) => setAttribute(a.id, e.target.value)}><option value="">Selecione</option>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
    if (a.field_type === "multiselect") { const current = Array.isArray(value) ? value.map(String) : []; return <fieldset key={a.id} className="attributeField"><legend>{label}</legend>{options.map((o) => <label className="checkRow" key={o.value}><input type="checkbox" checked={current.includes(o.value)} onChange={(e) => setAttribute(a.id, e.target.checked ? [...current, o.value] : current.filter((item) => item !== o.value))} /> {o.label}</label>)}</fieldset>; }
    if (a.field_type === "date") return <label key={a.id}>{label}<input type="date" value={typeof value === "string" ? value : ""} onChange={(e) => setAttribute(a.id, e.target.value)} /></label>;
    return <label key={a.id}>{label}<input type={a.field_type === "number" ? "number" : "text"} value={value == null ? "" : String(value)} onChange={(e) => setAttribute(a.id, a.field_type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)} /></label>;
  }

  if (loading) return <main className="shell"><section className="hero"><p>Carregando editor...</p></section></main>;
  return <main className="shell advertiserAdEditor"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><Link href="/painel" className="navCta">Voltar ao painel</Link></nav><section className="hero editorHero"><div className="eyebrow">CENTRAL DO ANÚNCIO</div><h1>Construa uma presença que <em>converte.</em></h1><p className="heroCopy">Organize apresentação, mídia, localização, características, serviços, preços e contato em um único fluxo. Seus dados existentes são preservados enquanto você evolui o anúncio.</p><div className="editorStatus"><div><strong>Rascunho seguro</strong><span>Você controla quando solicitar a publicação.</span></div><div><strong>Moderação de mídia</strong><span>Arquivos entram no fluxo de revisão.</span></div><div><strong>Privacidade</strong><span>Endereço exato não é exposto ao público.</span></div></div><div className="editorGrid"><aside className="editorNav"><div className="editorNavTitle"><span>CONFIGURAÇÃO</span><strong>Seu anúncio</strong></div>{sections.map((section, index) => <button key={section} type="button" className={`editorTab ${active === section ? "active" : ""}`} onClick={() => setActive(section)}>{section}</button>)}</aside><form className="authCard editorCard" onSubmit={submit}>
    {active === "Apresentação" && <><h2>Apresentação</h2><label>Categoria<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required><option value="">Selecione a categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{selectedCategory && <p className="fieldNote">Categoria selecionada: <strong>{selectedCategory.name}</strong>. Os campos específicos permanecem vinculados à configuração administrativa.</p>}<label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} /></label><label>Nome público<input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></label><label>Resumo<textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} maxLength={280} /></label><label>Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} maxLength={5000} /></label></>}
    {active === "Mídias" && <><h2>Mídias do anúncio</h2><p className="fieldNote">Imagens e vídeos são associados ao anúncio e entram no fluxo de moderação. O arquivo original não é exposto por URL pública direta.</p><label>Adicionar imagens ou vídeos<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple onChange={uploadMedia} disabled={mediaBusy} /></label>{mediaBusy && <p className="fieldNote">Enviando mídia...</p>}{media.length > 0 && <div className="mediaGrid">{media.map((item) => <article key={item.id} className="mediaCard"><div className="mediaPreview">{item.preview_url && item.kind === "image" ? <img src={item.preview_url} alt={item.original_filename || "Mídia do anúncio"} /> : item.preview_url && item.kind === "video" ? <video src={item.preview_url} controls preload="metadata" /> : <span>{item.kind === "video" ? "Vídeo" : "Imagem"}</span>}</div><strong>{item.original_filename || "Arquivo"}</strong><small>{item.moderation_status === "pending" ? "Aguardando moderação" : item.moderation_status}</small></article>)}</div>}</>}
    {active === "Localização" && <><h2>Localização</h2><label>CEP<div className="inlineField"><input value={zipcode} onChange={(e) => setZipcode(e.target.value.replace(/\D/g, "").slice(0, 8))} onBlur={() => { if (zipcode.length === 8) void lookupCep(); }} inputMode="numeric" placeholder="00000000" /><button type="button" className="secondaryButton" onClick={() => void lookupCep()} disabled={cepBusy}>{cepBusy ? "Consultando..." : "Consultar CEP"}</button></div></label><label>Logradouro<input value={street} onChange={(e) => setStreet(e.target.value)} /></label><div className="formGrid"><label>Número<input value={number} onChange={(e) => setNumber(e.target.value)} /></label><label>Complemento<input value={complement} onChange={(e) => setComplement(e.target.value)} /></label></div><label>Bairro<input value={neighborhood} readOnly /></label><div className="formGrid"><label>Estado<select value={stateId} onChange={(e) => { setStateId(e.target.value); setCityId(""); }}><option value="">Selecione</option>{states.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.uf}</option>)}</select></label><label>Cidade<select value={cityId} onChange={(e) => setCityId(e.target.value)} disabled={!stateId}><option value="">Selecione</option>{visibleCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><button type="button" className="secondaryButton" onClick={() => void geolocateAddress()} disabled={cepBusy}>{cepBusy ? "Localizando..." : "Localizar endereço no mapa"}</button><div className="locationVisibility"><strong>Privacidade da localização</strong><label className="checkRow"><input type="radio" name="location-visibility" checked={locationVisibility === "private"} onChange={() => { setLocationVisibility("private"); setPublicLatitude(null); setPublicLongitude(null); }} /> Endereço privado</label><label className="checkRow"><input type="radio" name="location-visibility" checked={locationVisibility === "approximate"} onChange={togglePublicLocation} /> Mostrar localização aproximada</label></div>{locationMessage && <p className="fieldNote">{locationMessage}</p>}{latitude != null && longitude != null && <div className="mapCard"><div className="mapHeader"><div><strong>Pré-visualização da localização</strong><span>{locationVisibility === "approximate" ? "A posição pública será aproximada." : "O endereço exato permanece privado."}</span></div><a href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`} target="_blank" rel="noreferrer">Abrir no Google Maps</a></div><iframe className="mapFrame" title="Mapa da localização do anúncio" loading="lazy" src={`https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`} /></div>}</>}
    {active === "Características" && <><h2>Características</h2><div className="identitySummary"><strong>Identidade cadastral recuperada</strong><span>CPF: {cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "não informado"}</span><small>O CPF pertence à conta autenticada e não é publicado no anúncio.</small></div><div className="formGrid"><label>Idade<input type="number" value={age} readOnly disabled aria-readonly="true" /><small className="fieldNote">Calculada automaticamente pela data de nascimento.</small></label><label>Data de nascimento<input type="date" value={birthDate} readOnly disabled aria-readonly="true" /><small className="fieldNote">Fonte oficial da idade: identidade cadastral da conta.</small></label><label>Altura (cm)<input type="number" min={100} max={250} value={height} onChange={(e) => setHeight(e.target.value)} /></label><label>Peso (kg)<input type="number" min={30} max={300} value={weight} onChange={(e) => setWeight(e.target.value)} /></label></div><label>Disponibilidade<textarea value={availability} onChange={(e) => setAvailability(e.target.value)} rows={3} placeholder="Dias e horários de atendimento" /></label>{catalogBusy ? <p className="fieldNote">Carregando características...</p> : attributes.length ? <div className="formGrid">{attributes.map(renderAttribute)}</div> : <p className="fieldNote">Esta categoria ainda não possui atributos configurados.</p>}</>}
    {active === "Serviços" && <><h2>Serviços</h2><p className="fieldNote">Selecione somente os serviços disponíveis no catálogo da categoria. Essas seleções ficam estruturadas no anúncio e podem ser usadas pelos filtros e pela busca pública.</p>{catalogBusy ? <p className="fieldNote">Carregando serviços...</p> : services.length ? <div className="serviceList">{services.map((s) => <label key={s.id} className="serviceCheck"><span><input type="checkbox" checked={selectedServices[s.id] === true} onChange={(e) => toggleService(s.id, e.target.checked)} /> <strong>{s.name}{s.required ? " *" : ""}</strong></span>{s.description && <small>{s.description}</small>}{selectedServices[s.id] && <textarea value={serviceNotes[s.id] || ""} onChange={(e) => setServiceNotes((current) => ({ ...current, [s.id]: e.target.value }))} placeholder="Observação específica (opcional)" rows={2} />}</label>)}</div> : <p className="fieldNote">Esta categoria ainda não possui serviços configurados.</p>}<div className="fieldNote"><strong>{Object.values(selectedServices).filter(Boolean).length}</strong> serviço(s) selecionado(s).</div></>}
    {active === "Preços" && <><h2>Preços e períodos de atendimento</h2><p className="fieldNote">Defina até 5 períodos de atendimento. O período de <strong>1 Hora</strong> é a referência obrigatória do anúncio e pode ser usado pela busca pública para comparação de valores. Esta estrutura também permite apresentar o preço como “a partir de”.</p><div className="pricingEditor">{PRICING_OPTIONS.map((option) => { const current = pricingPeriods.find((row) => row.period === option.period); const selected = Boolean(current); return <div className="pricingRow" key={option.period}><label className="checkRow"><input type="checkbox" checked={selected} disabled={option.minutes === 60} onChange={(e) => { if (e.target.checked) { if (pricingPeriods.length >= 5) { setError("Você pode cadastrar no máximo 5 períodos."); return; } setPricingPeriods((rows) => [...rows, { ...option }]); } else { setPricingPeriods((rows) => rows.filter((row) => row.period !== option.period)); } }} /><strong>{option.period}{option.minutes === 60 ? " *" : ""}</strong></label>{selected && <div className="pricingRowFields"><label>Valor (R$)<input value={String(current?.price ?? "")} onChange={(e) => { const raw = e.target.value.replace(/[^0-9,\.]/g, "").replace(",", "."); setPricingPeriods((rows) => rows.map((row) => row.period === option.period ? { ...row, price: raw === "" ? 0 : Number(raw) } : row)); }} inputMode="decimal" placeholder="0,00" /></label><label className="checkRow pricingStarting"><input type="checkbox" checked={current?.starting_from === true} onChange={(e) => setPricingPeriods((rows) => rows.map((row) => row.period === option.period ? { ...row, starting_from: e.target.checked } : row))} /> Exibir como “a partir de”</label></div>}</div>; })}</div><p className="fieldNote"><strong>{pricingPeriods.length}</strong> de 5 períodos selecionados.</p></>}
    {active === "Contato" && <><h2>Contato e apresentação comercial</h2><div className="formGrid"><label>Telefone<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></label><label>WhatsApp<input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" /></label><label>Telefone secundário<input value={phoneSecondary} onChange={(e) => setPhoneSecondary(e.target.value)} inputMode="tel" /></label><label>Posicionamento<input value={positioning} onChange={(e) => setPositioning(e.target.value)} /></label></div><label>Opções de pagamento (JSON)<textarea value={paymentOptionsText} onChange={(e) => setPaymentOptionsText(e.target.value)} rows={6} /></label><label>Redes sociais (JSON)<textarea value={socialLinksText} onChange={(e) => setSocialLinksText(e.target.value)} rows={6} /></label></>}
    {active === "Publicação" && <><h2>Publicação</h2><div className="publicationBox"><div className="publicationStatus"><span>STATUS DO ANÚNCIO</span><strong>{profileStatus === "pending_review" ? "Em análise" : profileStatus === "published" ? "Publicado" : profileStatus === "paused" ? "Pausado" : "Rascunho"}</strong><small>{verificationStatus === "verified" ? "Identidade verificada" : verificationStatus === "pending" ? "Verificação em análise" : "Verificação ainda não concluída"}</small></div><div className="publicationChecklist">{publicationReadiness.checks.map((check) => <div key={check.key}><span>{check.ready ? "✓" : "!"}</span><p><strong>{check.label}</strong><small>{check.detail}</small></p></div>)}</div><p>Categoria: <strong>{selectedCategory?.name || "não selecionada"}</strong></p><p>Localização pública: <strong>{locationVisibility === "approximate" ? "aproximada" : "privada"}</strong></p>{profileStatus === "pending_review" && <div className="publicationWaiting">Seu anúncio já está na fila de análise. Novos ajustes deverão ser feitos conforme o retorno da moderação.</div>}{profileStatus !== "pending_review" && profileStatus !== "published" && <><div className={publicationReadiness.ready ? "publicationReady" : "publicationBlocked"}>{publicationReadiness.ready ? "Seu anúncio está completo e pode ser enviado para análise." : "Conclua os itens marcados acima antes de solicitar a análise."}</div><button type="button" className="primaryButton publicationSubmit" onClick={() => void requestPublication()} disabled={!publicationReadiness.ready || publishBusy || busy || catalogBusy}>{publishBusy ? "Enviando para análise..." : "Salvar alterações e solicitar análise"}</button></>}</div></>}
    {error && <p className="formError">{error}</p>}{message && <p className="formSuccess">{message}</p>}<div className="editorSaveBar"><div><strong>{busy ? "Salvando alterações..." : "Tudo pronto para salvar"}</strong><span>As alterações ficam no rascunho até a publicação ser solicitada.</span></div><button className="primaryButton" disabled={busy || catalogBusy}>{busy ? "Salvando..." : "Salvar rascunho"}</button></div></form></div></section></main>;
}
