"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import ApproximateLocationMap from "@/components/ApproximateLocationMap";
import DigitalContentShowcase from "@/components/DigitalContentShowcase";
import ProfileCommerceHub from "@/components/ProfileCommerceHub";

type Profile = { id: string; user_id: string; title: string | null; display_name: string | null; summary: string | null; description: string | null; status: string; verification_status: string | null; city_id: number | null; state_id: number | null; category_id: number | null; birth_date: string | null; height_cm: number | null; weight_kg: number | null; availability: string | null; phone: string | null; whatsapp: string | null; phone_secondary: string | null; positioning: string | null; pricing: Record<string, unknown> | null; payment_options: Record<string, unknown> | null; social_links: Record<string, string> | null };
type Address = { public_latitude: number | null; public_longitude: number | null };
type Media = { id: string; profile_id: string; storage_bucket: string; storage_path: string; preview_storage_bucket: string | null; preview_storage_path: string | null; kind: string; access_type: "public" | "paid"; price: number; currency: string; is_primary: boolean; sort_order: number; moderation_status: string };
type Review = { id: string; rating: number | null; comment: string | null; created_at: string; experience_verified: boolean };
type City = { name: string };
type State = { uf: string; name: string };
type Category = { name: string };
type Attribute = { id: string; name: string; slug: string; field_type: string; options: unknown; sort_order: number };
type AttributeValue = { attribute_id: string; value: unknown };
type Service = { id: string; name: string; slug: string; description: string | null; sort_order: number };
type ProfileService = { service_id: string; selected: boolean; notes: string | null };
type FansCreator = { slug: string; display_name: string; bio: string | null; status: string };

type GalleryItem = Media & { url: string | null; previewUrl: string | null; unlockedUrl?: string | null };

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function publicUrl(supabase: ReturnType<typeof createClient>, bucket: string | null, path: string | null) {
  if (!bucket || !path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl || null;
}

function labelValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function safeExternalUrl(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function contactDigits(value: string | null | undefined) {
  const digits = String(value || "").replace(/\\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function calculateAge(birthDate: string | null) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18 ? age : null;
}

export default function PublicAdvertiserPage() {
  const params = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [city, setCity] = useState<City | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [profileServices, setProfileServices] = useState<ProfileService[]>([]);
  const [fans, setFans] = useState<FansCreator | null>(null);
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mediaTab, setMediaTab] = useState<"all" | "image" | "video">("all");
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followNotice, setFollowNotice] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationBusy, setConversationBusy] = useState(false);
  const [conversationNotice, setConversationNotice] = useState("");
  const [ageVerified, setAgeVerified] = useState(false);

  useEffect(() => {
    setAgeVerified(window.localStorage.getItem("pecatho_age_verified") === "true");
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      const { data: p, error: profileError } = await supabase
        .from("advertiser_profiles")
        .select("id,user_id,title,display_name,summary,description,status,verification_status,city_id,state_id,category_id,birth_date,height_cm,weight_kg,availability,phone,whatsapp,phone_secondary,positioning,pricing,payment_options,social_links")
        .eq("slug", params.slug)
        .eq("status", "published")
        .maybeSingle();
      if (profileError || !p) {
        if (active) { setError("Anúncio não encontrado ou ainda não publicado."); setLoading(false); }
        return;
      }
      const typed = p as Profile;
      const [a, c, s, cat, attrs, attrValues, svc, svcValues, mediaResult, reviewResult, fansResult] = await Promise.all([
        supabase.from("user_addresses").select("public_latitude,public_longitude").eq("user_id", typed.user_id).eq("is_primary", true).maybeSingle(),
        typed.city_id ? supabase.from("cities").select("name").eq("id", typed.city_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        typed.state_id ? supabase.from("states").select("uf,name").eq("id", typed.state_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        typed.category_id ? supabase.from("categories").select("name").eq("id", typed.category_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        typed.category_id ? supabase.from("category_attributes").select("id,name,slug,field_type,options,sort_order").eq("category_id", typed.category_id).eq("display_public", true).order("sort_order") : Promise.resolve({ data: [], error: null }),
        supabase.from("profile_attribute_values").select("attribute_id,value").eq("profile_id", typed.id),
        typed.category_id ? supabase.from("category_services").select("id,name,slug,description,sort_order").eq("category_id", typed.category_id).eq("display_public", true).order("sort_order") : Promise.resolve({ data: [], error: null }),
        supabase.from("profile_services").select("service_id,selected,notes").eq("profile_id", typed.id).eq("selected", true),
        supabase.from("profile_media").select("id,profile_id,storage_bucket,storage_path,preview_storage_bucket,preview_storage_path,kind,access_type,price,currency,is_primary,sort_order,moderation_status").eq("profile_id", typed.id).eq("moderation_status", "approved").order("sort_order"),
        supabase.from("profile_feedback").select("id,rating,comment,created_at,experience_verified").eq("profile_id", typed.id).eq("status", "approved").eq("experience_verified", true).order("created_at", { ascending: false }).limit(12),
        supabase.from("fans_creators").select("slug,display_name,bio,status").eq("advertiser_profile_id", typed.id).eq("status", "active").maybeSingle(),
      ]);
      const gallery = ((mediaResult.data ?? []) as Media[]).map((item) => ({
        ...item,
        url: item.access_type === "public" ? publicUrl(supabase, item.storage_bucket, item.storage_path) : null,
        previewUrl: item.access_type === "paid" ? publicUrl(supabase, item.preview_storage_bucket, item.preview_storage_path) : null,
      }));
      if (!active) return;
      setProfile(typed); setAddress((a.data as Address | null) || null); setCity((c.data as City | null) || null); setState((s.data as State | null) || null); setCategory((cat.data as Category | null) || null);
      setAttributes((attrs.data ?? []) as Attribute[]); setAttributeValues((attrValues.data ?? []) as AttributeValue[]); setServices((svc.data ?? []) as Service[]); setProfileServices((svcValues.data ?? []) as ProfileService[]);
      setFans((fansResult.data as FansCreator | null) || null); setMedia(gallery); setReviews((reviewResult.data ?? []) as Review[]); setLoading(false);

      const { data: authData } = await supabase.auth.getUser();
      if (authData.user && authData.user.id !== typed.user_id) {
        if (active) setCurrentUserId(authData.user.id);
        const { data: followRow } = await supabase.from("user_follows").select("profile_id").eq("follower_id", authData.user.id).eq("profile_id", typed.id).maybeSingle();
        if (active) setFollowing(Boolean(followRow));
      }
    })().catch((err) => { console.error(err); if (active) { setError("Não foi possível carregar este perfil."); setLoading(false); } });
    return () => { active = false; };
  }, [params.slug]);

  const filteredMedia = useMemo(() => media.filter((item) => mediaTab === "all" || item.kind === mediaTab), [media, mediaTab]);
  const averageRating = reviews.length ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length : 0;
  const publicImages = media.filter((item) => item.kind === "image").length;
  const publicVideos = media.filter((item) => item.kind === "video").length;
  const socialLinks = Object.entries(profile?.social_links || {}).map(([label, value]) => { const url = safeExternalUrl(value); return url ? [label, url] as const : null; }).filter((entry): entry is readonly [string, string] => entry !== null);
  const paymentMethods = (() => {
    const methods = profile?.payment_options?.methods;
    return methods && typeof methods === "object" && !Array.isArray(methods)
      ? Object.entries(methods as Record<string, unknown>).filter(([, value]) => value === true).map(([key]) => key)
      : [];
  })();
  const paymentLabels: Record<string, string> = { pix: "PIX", dinheiro: "Dinheiro", cartao_credito: "Cartão de crédito", cartao_debito: "Cartão de débito", transferencia: "Transferência bancária", outro: "Outro meio de pagamento" };
  const whatsappContact = contactDigits(profile?.whatsapp);
  const whatsappUrl = (message: string) => whatsappContact ? `https://wa.me/${whatsappContact}?text=${encodeURIComponent(message)}` : null;
  const phoneContact = contactDigits(profile?.phone);
  const age = calculateAge(profile?.birth_date || null);
  const visibleAttributeRows = attributes.map((attribute) => ({ attribute, value: attributeValues.find((entry) => entry.attribute_id === attribute.id)?.value })).filter(({ value }) => labelValue(value));
  const selectedServices = services
    .map((service) => ({
      ...service,
      notes: profileServices.find((entry) => entry.service_id === service.id && entry.selected)?.notes || null,
    }))
    .filter((service) => service.notes !== undefined || profileServices.some((entry) => entry.service_id === service.id && entry.selected));
  const prices = Array.isArray(profile?.pricing?.periods) ? (profile?.pricing?.periods as Array<Record<string, unknown>>) : [];
  const validPrices = prices.filter((row) => Number.isFinite(Number(row.price)) && Number(row.price) >= 0);

  async function toggleFollow() {
    if (!profile) return;
    setFollowBusy(true); setFollowNotice("");
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setFollowNotice("Entre na sua conta para acompanhar este perfil.");
        return;
      }
      if (authData.user.id === profile.user_id) {
        setFollowNotice("Você não pode acompanhar o próprio perfil.");
        return;
      }
      setCurrentUserId(authData.user.id);
      if (following) {
        const { error: deleteError } = await supabase.from("user_follows").delete().eq("follower_id", authData.user.id).eq("profile_id", profile.id);
        if (deleteError) throw deleteError;
        setFollowing(false);
      } else {
        const { error: insertError } = await supabase.from("user_follows").insert({ follower_id: authData.user.id, profile_id: profile.id });
        if (insertError) throw insertError;
        setFollowing(true);
      }
    } catch (err) {
      console.error(err);
      setFollowNotice("Não foi possível atualizar seu acompanhamento agora.");
    } finally { setFollowBusy(false); }
  }

  async function startConversation(context?: string) {
    if (!profile || conversationBusy) return;
    setConversationBusy(true); setConversationNotice("");
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        window.location.href = `/login?redirect=/anunciantes/${params.slug}`;
        return;
      }
      if (authData.user.id === profile.user_id) {
        setConversationNotice("Você não pode iniciar uma conversa com o próprio perfil.");
        return;
      }
      const { data, error: rpcError } = await supabase.rpc("start_advertiser_conversation", { p_profile_id: profile.id });
      if (rpcError) throw rpcError;
      if (!data) throw new Error("A conversa não foi criada.");
      const destination = context ? `/painel/mensagens/${data}?context=${encodeURIComponent(context)}` : `/painel/mensagens/${data}`;
      window.location.href = destination;
    } catch (err) {
      console.error(err);
      setConversationNotice("Não foi possível iniciar a conversa agora.");
    } finally { setConversationBusy(false); }
  }

  async function unlock(item: GalleryItem) {
    setUnlocking(item.id); setNotice("");
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        window.location.href = `/login?redirect=/anunciantes/${params.slug}`;
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke("get-advertiser-media-access", { body: { media_id: item.id } });
      if (!fnError && data?.url) {
        setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, unlockedUrl: data.url } : entry));
        return;
      }

      if (data?.code !== "MEDIA_PAYMENT_REQUIRED") {
        setNotice(data?.error || "O conteúdo ainda não está disponível para este usuário.");
        return;
      }

      const intentResponse = await fetch("/api/anunciantes/media/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_id: item.id }),
      });
      const intent = await intentResponse.json().catch(() => ({}));
      if (!intentResponse.ok) throw new Error(intent.error || "Não foi possível preparar a compra.");

      if (intent.already_owned) {
        const { data: retryData, error: retryError } = await supabase.functions.invoke("get-advertiser-media-access", { body: { media_id: item.id } });
        if (retryError || !retryData?.url) throw new Error(retryData?.error || "O acesso ainda não foi liberado.");
        setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, unlockedUrl: retryData.url } : entry));
        return;
      }

      const providerResponse = await fetch("/api/conteudos/checkout/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: intent.order_id }),
      });
      const provider = await providerResponse.json().catch(() => ({}));
      if (!providerResponse.ok || !provider.checkout_url) throw new Error(provider.error || "Não foi possível abrir o checkout.");

      window.location.href = provider.checkout_url;
    } catch (err) {
      console.error(err);
      setNotice(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento deste conteúdo.");
    } finally {
      setUnlocking(null);
    }
  }

  if (loading) return <main className="shell"><section className="hero"><p>Carregando anúncio...</p></section></main>;
  if (error || !profile) return <main className="shell"><section className="hero"><div className="eyebrow">PECATHO</div><h1>Anúncio <em>indisponível.</em></h1><p className="heroCopy">{error || "Este anúncio não está disponível."}</p><Link href="/anunciantes" className="primaryButton">Voltar aos anunciantes</Link></section></main>;

  return (
    <main className="shell publicProfile">
      {ageVerified === false && (
        <div className="pAgeGate" role="dialog" aria-modal="true" aria-labelledby="advertiser-age-title">
          <div className="pAgeCard">
            <div className="pAgeMark">18+</div>
            <div className="pAgeKicker">ACESSO RESTRITO</div>
            <h2 id="advertiser-age-title">Conteúdo destinado a maiores de 18 anos</h2>
            <p>Este perfil integra a área de anunciantes de serviços adultos do Pecatho. Para continuar, confirme que você possui 18 anos ou mais.</p>
            <div className="pAgeWarning"><strong>⚠ Aviso:</strong> este perfil pode apresentar imagens, serviços e informações de natureza sexualmente explícita. Menores de 18 anos não podem prosseguir.</div>
            <div className="pAgeActions"><button type="button" className="pAgeEnter" onClick={() => { window.localStorage.setItem("pecatho_age_verified", "true"); setAgeVerified(true); }}>TENHO 18 ANOS OU MAIS · ENTRAR</button><button type="button" className="pAgeLeave" onClick={() => { window.location.href = "https://www.google.com"; }}>SAIR</button></div>
            <div className="pAgeLegal">A confirmação é armazenada neste navegador para evitar a repetição do aviso em acessos futuros.</div>
          </div>
        </div>
      )}
      <nav className="topbar"><Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link><Link href="/anunciantes" className="navCta">Ver anunciantes</Link></nav>

      <nav aria-label="Navegação comercial do perfil" style={{ position: "sticky", top: 12, zIndex: 20, display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0 18px", padding: 8, border: "1px solid rgba(231,195,63,.22)", borderRadius: 16, background: "rgba(255,255,255,.92)", backdropFilter: "blur(14px)", boxShadow: "0 12px 30px rgba(15,23,42,.06)" }}>
        <a href="#conteudo-exclusivo" className="secondaryButton" style={{ textDecoration: "none" }}>Conteúdo exclusivo</a>
        {selectedServices.length > 0 && <a href="#servicos" className="secondaryButton" style={{ textDecoration: "none" }}>Serviços</a>}
        {validPrices.length > 0 && <a href="#valores" className="secondaryButton" style={{ textDecoration: "none" }}>Valores</a>}
        <a href="#galeria" className="secondaryButton" style={{ textDecoration: "none" }}>Galeria</a>
        {fans && <Link href={`/fans/${fans.slug}`} className="primaryButton" style={{ textDecoration: "none" }}>Pecatho Fans →</Link>}
      </nav>

      <section className="publicProfileHero">
        <div className="eyebrow">{category?.name || "ANUNCIANTE"}</div>
        <div className="profileTitleRow"><div><h1>{profile.title || profile.display_name || "Perfil Pecatho"}</h1><p className="heroCopy">{profile.summary || "Conheça este perfil no Pecatho."}</p></div><div className="profileTrust">{profile.verification_status === "verified" ? <span>✓ PERFIL VERIFICADO</span> : <span>PERFIL PUBLICADO</span>}{reviews.length > 0 && <strong>★ {averageRating.toFixed(1)} <small>({reviews.length} avaliações)</small></strong>}</div></div>
        <div className="profileStats"><span>📷 {publicImages} fotos</span><span>▶ {publicVideos} vídeos</span><span>★ {reviews.length} avaliações verificadas</span>{age && <span>◷ {age} anos</span>}{city?.name && <span>⌖ {city.name}{state?.uf ? ` · ${state.uf}` : ""}</span>}</div>
        <div className="profileEngagement"><button type="button" className="primaryButton" onClick={() => void startConversation("Olá! Encontrei seu perfil no Pecatho e gostaria de conversar sobre os serviços anunciados. Este contato ocorreu por intermédio do Pecatho.")} disabled={conversationBusy}>{conversationBusy ? "Abrindo conversa..." : "✉ Enviar mensagem"}</button><button type="button" className={`followButton ${following ? "active" : ""}`} onClick={toggleFollow} disabled={followBusy}>{followBusy ? "Atualizando..." : following ? "✓ Acompanhando" : "＋ Acompanhar perfil"}</button>{conversationNotice && <span className="followNotice">{conversationNotice}</span>}{currentUserId && <span>Você receberá este perfil na sua área de acompanhamento.</span>}{followNotice && <span className="followNotice">{followNotice}</span>}</div>
      </section>

      <DigitalContentShowcase ownerType="advertiser" ownerId={profile.id} compact />

      <ProfileCommerceHub
        ownerType="advertiser"
        ownerId={profile.id}
        fansSlug={fans?.slug ?? null}
        serviceCount={selectedServices.length}
        priceCount={validPrices.length}
        galleryCount={media.length}
      />

      {(visibleAttributeRows.length > 0 || profile.height_cm || profile.weight_kg || age) && <section className="profileDetails card"><div className="sectionHeading"><div><div className="eyebrow">CARACTERÍSTICAS</div><h2>Perfil e características</h2><p>Informações públicas configuradas pela anunciante e liberadas pela política do catálogo.</p></div></div><div className="detailGrid">{age && <div><span>Idade</span><strong>{age} anos</strong></div>}{profile.height_cm && <div><span>Altura</span><strong>{Number(profile.height_cm)} cm</strong></div>}{profile.weight_kg && <div><span>Peso</span><strong>{Number(profile.weight_kg)} kg</strong></div>}{visibleAttributeRows.map(({ attribute, value }) => <div key={attribute.id}><span>{attribute.name}</span><strong>{labelValue(value)}</strong></div>)}</div></section>}

      {selectedServices.length > 0 && <section id="servicos" className="profileServices card">
        <div className="sectionHeading">
          <div>
            <div className="eyebrow">SERVIÇOS</div>
            <h2>Serviços e modalidades</h2>
            <p>Veja o que esta anunciante disponibiliza e inicie o atendimento diretamente pelo Pecatho.</p>
          </div>
          {whatsappContact ? <a href={whatsappUrl("Olá! Encontrei seu perfil no Pecatho e gostaria de conversar sobre os serviços anunciados. Este contato ocorreu por intermédio do Pecatho.") || "#"} target="_blank" rel="noreferrer" className="primaryButton" style={{ textDecoration: "none" }}>Conversar pelo WhatsApp</a> : <button type="button" className="primaryButton" onClick={() => void startConversation("Olá! Gostaria de conhecer os serviços disponíveis e alinhar o atendimento. Este contato ocorreu por intermédio do Pecatho.")} disabled={conversationBusy}>{conversationBusy ? "Abrindo atendimento..." : "Solicitar atendimento"}</button>}
        </div>
        <div className="serviceChips">
          {selectedServices.map((service) => (
            <div key={service.id} style={{ display: "flex", flexDirection: "column", gap: 5, border: "1px solid rgba(15,23,42,.08)", borderRadius: 14, padding: "12px 14px", background: "#fff" }}>
              <strong>{service.name}</strong>
              {service.description && <small style={{ color: "#6b7280", lineHeight: 1.45 }}>{service.description}</small>}
              {service.notes && <small style={{ color: "#7c3aed", lineHeight: 1.45 }}>{service.notes}</small>}
            </div>
          ))}
        </div>
        {conversationNotice && <div className="followNotice" style={{ marginTop: 14 }}>{conversationNotice}</div>}
      </section>}

      {validPrices.length > 0 && <section id="valores" className="profilePricing card"><div className="eyebrow">VALORES</div><h2>Preços por período</h2><div className="priceGrid">{validPrices.map((row, index) => { const minutes = Number(row.minutes); const label = typeof row.period === "string" && row.period ? row.period : minutes === 60 ? "1 Hora" : minutes > 0 ? `${minutes} minutos` : "Período"; const amount = brl(Number(row.price)); const context = `Olá! Tenho interesse no período ${label}, anunciado por ${row.starting_from === true ? "a partir de " : ""}${amount}. Gostaria de confirmar disponibilidade e condições. O contato foi realizado por intermédio do Pecatho.`; return <div key={`${String(row.minutes ?? row.period ?? index)}-${index}`} style={{ display: "grid", gap: 10, padding: 16, border: "1px solid rgba(15,23,42,.08)", borderRadius: 16, background: "#fff" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><span>{label}</span><strong>{row.starting_from === true ? "A partir de " : ""}{amount}</strong></div><button type="button" className="secondaryButton" onClick={() => { const url = whatsappUrl(context); if (url) window.open(url, "_blank", "noopener,noreferrer"); else void startConversation(context); }} disabled={conversationBusy}>{conversationBusy ? "Abrindo atendimento..." : whatsappContact ? "Consultar pelo WhatsApp" : "Consultar este período"}</button></div>; })}</div></section>}

      {paymentMethods.length > 0 && <section className="profilePayment card"><div className="eyebrow">PAGAMENTO DIRETO</div><h2>Formas de pagamento</h2><p>Os serviços de acompanhante são negociados diretamente entre cliente e anunciante. O Pecatho não realiza a cobrança antecipada desses serviços.</p><div className="paymentChips">{paymentMethods.map((key) => <span key={key}>✓ {paymentLabels[key] || key}</span>)}</div></section>}

      {(whatsappContact || phoneContact || profile.positioning) && <section className="profileContact card"><div className="eyebrow">CONTATO</div><h2>Contato e atendimento</h2>{profile.positioning && <p>{profile.positioning}</p>}<div className="profileContactActions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>{whatsappContact && <a href={`https://wa.me/${whatsappContact}`} target="_blank" rel="noreferrer" className="primaryButton">◉ WhatsApp</a>}{phoneContact && <a href={`tel:+${phoneContact}`} className="secondaryButton">☎ Ligar</a>}</div><small style={{ display: "block", marginTop: 14, color: "#777168", lineHeight: 1.5 }}>Os canais acima foram informados pela própria anunciante e ficam sujeitos às regras de uso do Pecatho.</small></section>}

      {profile.availability && <section className="profileAvailability card"><div className="eyebrow">DISPONIBILIDADE</div><h2>Horários de atendimento</h2><p>{profile.availability}</p></section>}

      <section id="galeria" className="profileMediaSection">
        <div className="sectionHeading"><div><div className="eyebrow">GALERIA</div><h2>Fotos e vídeos</h2><p>Conteúdo público e conteúdo exclusivo com acesso pago definido pela própria anunciante.</p></div><div className="mediaTabs"><button className={mediaTab === "all" ? "active" : ""} onClick={() => setMediaTab("all")}>Tudo</button><button className={mediaTab === "image" ? "active" : ""} onClick={() => setMediaTab("image")}>Fotos</button><button className={mediaTab === "video" ? "active" : ""} onClick={() => setMediaTab("video")}>Vídeos</button></div></div>
        {notice && <div className="mediaNotice">{notice}</div>}
        {filteredMedia.length === 0 ? <div className="emptyDiscovery"><h2>Galeria em preparação</h2><p>Esta anunciante ainda não publicou mídia aprovada nesta categoria.</p></div> : <div className="profileGallery">{filteredMedia.map((item) => {
          const unlocked = Boolean(item.unlockedUrl);
          const src = unlocked ? item.unlockedUrl : item.url || item.previewUrl;
          const isVideo = item.kind === "video";
          return <article className={`profileMediaCard ${item.access_type === "paid" ? "paid" : "public"}`} key={item.id}>
            <div className="profileMediaVisual">{src ? (isVideo && unlocked ? <video src={src} controls playsInline preload="metadata" /> : <img src={src} alt={item.access_type === "paid" ? "Prévia de conteúdo exclusivo" : "Foto do perfil"} />) : <div className="lockedMedia"><span>{isVideo ? "▶" : "✦"}</span><strong>Conteúdo exclusivo</strong><small>Prévia não publicada</small></div>}
              {item.access_type === "paid" && !unlocked && <div className="paidOverlay"><span>🔒 EXCLUSIVO</span><strong>{brl(Number(item.price))}</strong><button type="button" onClick={() => unlock(item)} disabled={unlocking === item.id}>{unlocking === item.id ? "Verificando acesso..." : "Desbloquear conteúdo"}</button></div>}
              {item.access_type === "public" && <span className="mediaBadge">PÚBLICO</span>}
            </div>
          </article>;
        })}</div>}
      </section>

      <section className="profileContentGrid">
        <article className="card profileAbout"><div className="eyebrow">SOBRE</div><h2>{profile.display_name || "Anunciante"}</h2><p>{profile.description || "A anunciante ainda não adicionou uma apresentação detalhada."}</p>{socialLinks.length > 0 && <div className="profileLinks"><strong>Redes e presença digital</strong>{socialLinks.map(([label, url]) => <a href={url} target="_blank" rel="noopener noreferrer" key={label}>{label}</a>)}</div>}{fans && <div className="fansCta"><div><span>PECATHO FANS</span><strong>{fans.display_name}</strong><p>{fans.bio || "Conteúdo exclusivo diretamente no ecossistema Pecatho."}</p></div><Link href={`/fans/${fans.slug}`} className="primaryButton">Ver conteúdo exclusivo</Link></div>}</article>
        <ApproximateLocationMap latitude={address?.public_latitude ?? null} longitude={address?.public_longitude ?? null} label="Localização aproximada do anúncio" />
      </section>

      <section className="profileReviews"><div className="sectionHeading"><div><div className="eyebrow">EXPERIÊNCIAS VERIFICADAS</div><h2>Avaliações de quem utilizou os serviços</h2><p>Somente experiências verificadas e aprovadas pela moderação entram no rating público.</p></div>{reviews.length > 0 && <div className="ratingBig"><strong>★ {averageRating.toFixed(1)}</strong><span>{reviews.length} avaliações</span></div>}</div>{reviews.length === 0 ? <div className="emptyDiscovery"><h2>Ainda não há avaliações publicadas.</h2><p>Quando houver experiências verificadas, os comentários aparecerão aqui.</p></div> : <div className="reviewGrid">{reviews.map((review) => <article className="reviewCard" key={review.id}><div className="reviewStars">{"★".repeat(Math.max(0, Math.min(5, Number(review.rating || 0))))}<span>{review.experience_verified ? "✓ Experiência verificada" : ""}</span></div><p>{review.comment || "O usuário não deixou comentário."}</p><small>{new Date(review.created_at).toLocaleDateString("pt-BR")}</small></article>)}</div>}</section>

      {whatsappContact && <a
        href={`https://wa.me/${whatsappContact}?text=${encodeURIComponent("Olá! Encontrei seu perfil no Pecatho e gostaria de conversar sobre os serviços anunciados. Este contato foi realizado por intermédio do Pecatho.")}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Conversar com a anunciante pelo WhatsApp"
        title="Conversar pelo WhatsApp"
        style={{ position: "fixed", right: 20, bottom: 20, zIndex: 60, display: "inline-flex", alignItems: "center", gap: 9, padding: "13px 17px", borderRadius: 999, background: "#25D366", color: "#fff", textDecoration: "none", fontWeight: 800, boxShadow: "0 14px 35px rgba(0,0,0,.22)", border: "2px solid rgba(255,255,255,.9)" }}
      >
        <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>◉</span>
        <span>WhatsApp</span>
      </a>}

      <footer><span>Pecatho · experiência pública da anunciante</span><Link href="/anunciantes">Voltar para a busca</Link></footer>
    </main>
  );
}
