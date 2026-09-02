"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Advertiser = { id: string; user_id: string; title: string; display_name: string | null; summary: string | null; description: string | null; status: string; verification_status: string; category_id: number | null; state_id: number | null; city_id: number | null; birth_date: string | null; height_cm: number | null; weight_kg: number | null; availability: string | null; phone: string | null; whatsapp: string | null; pricing: unknown; payment_options: unknown; social_links: unknown; positioning: string | null };
type Media = { id: string; kind: string; storage_bucket: string; storage_path: string; original_filename: string | null; mime_type: string | null; size_bytes: number | null; is_primary: boolean; is_public: boolean; moderation_status: string; access_type: string; price: number; preview_url?: string };
type Verification = { id: string; status: string; provider: string | null; submitted_at: string | null; reviewed_at: string | null; rejection_reason: string | null; metadata: unknown };

const labels: Record<string, string> = { draft: "Rascunho", pending_review: "Em análise", published: "Publicado", paused: "Pausado", suspended: "Suspenso", rejected: "Rejeitado", unverified: "Não verificado", pending: "Pendente", verified: "Verificado" };

export default function ReviewPage() {
  const supabase = createClient();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [selected, setSelected] = useState<Advertiser | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [account, setAccount] = useState<Record<string, unknown> | null>(null);
  const [address, setAddress] = useState<Record<string, unknown> | null>(null);
  const [attributes, setAttributes] = useState<{ name: string; value: unknown }[]>([]);
  const [services, setServices] = useState<{ name: string; selected: boolean; notes: string | null }[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthorized(false); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["super_admin", "admin", "moderator", "support"]).limit(1).maybeSingle();
      setAuthorized(Boolean(role));
      if (!role) return;
      await loadAdvertisers();
    })();
  }, []);

  async function loadAdvertisers() {
    const { data, error: dbError } = await supabase.from("advertiser_profiles").select("id,user_id,title,display_name,summary,description,status,verification_status,category_id,state_id,city_id,birth_date,height_cm,weight_kg,availability,phone,whatsapp,pricing,payment_options,social_links,positioning").order("updated_at", { ascending: false });
    if (dbError) setError(dbError.message); else setAdvertisers((data || []) as Advertiser[]);
  }

  async function openAdvertiser(item: Advertiser) {
    setSelected(item); setBusy(true); setMessage(""); setError("");
    const [mediaResult, verificationResult, accountResult, addressResult, attrResult, serviceResult] = await Promise.all([
      supabase.from("profile_media").select("id,kind,storage_bucket,storage_path,original_filename,mime_type,size_bytes,is_primary,is_public,moderation_status,access_type,price").eq("profile_id", item.id).order("is_primary", { ascending: false }).order("sort_order"),
      supabase.from("verification_cases").select("id,status,provider,submitted_at,reviewed_at,rejection_reason,metadata").eq("user_id", item.user_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("profiles").select("id,username,display_name,legal_name,email,phone,cpf,birth_date,status,verification_status,created_at,updated_at").eq("id", item.user_id).maybeSingle(),
      supabase.from("user_addresses").select("zipcode,street,number,complement,neighborhood_id,city_id,state_id,latitude,longitude,location_visibility,public_latitude,public_longitude").eq("user_id", item.user_id).eq("address_type", "primary").maybeSingle(),
      supabase.from("profile_attribute_values").select("attribute_id,value,category_attributes(name)").eq("profile_id", item.id),
      supabase.from("profile_services").select("service_id,selected,notes,category_services(name)").eq("profile_id", item.id),
    ]);
    const rows = (mediaResult.data || []) as Media[];
    const previews = await Promise.all(rows.map(async (row) => {
      const signed = await supabase.storage.from(row.storage_bucket).createSignedUrl(row.storage_path, 600);
      return { ...row, preview_url: signed.data?.signedUrl || undefined };
    }));
    setMedia(previews);
    setVerification((verificationResult.data || null) as Verification | null);
    setAccount((accountResult.data || null) as Record<string, unknown> | null);
    setAddress((addressResult.data || null) as Record<string, unknown> | null);
    setAttributes(((attrResult.data || []) as Array<{ value: unknown; category_attributes?: { name?: string } | { name?: string }[] }>).map((row) => ({ name: Array.isArray(row.category_attributes) ? row.category_attributes[0]?.name || "Característica" : row.category_attributes?.name || "Característica", value: row.value })));
    setServices(((serviceResult.data || []) as Array<{ selected: boolean; notes: string | null; category_services?: { name?: string } | { name?: string }[] }>).map((row) => ({ name: Array.isArray(row.category_services) ? row.category_services[0]?.name || "Serviço" : row.category_services?.name || "Serviço", selected: row.selected, notes: row.notes })));
    setBusy(false);
  }

  async function moderate(action: "verify" | "reject" | "publish" | "pause") {
    if (!selected) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (action === "verify") {
        const { error: e } = await supabase.from("advertiser_profiles").update({ verification_status: "verified" }).eq("id", selected.id);
        if (e) throw e;
      } else if (action === "reject") {
        const { error: e } = await supabase.from("advertiser_profiles").update({ verification_status: "rejected", status: "paused" }).eq("id", selected.id);
        if (e) throw e;
      } else if (action === "publish") {
        if (selected.verification_status !== "verified") throw new Error("O anunciante precisa estar verificado antes da publicação.");
        const pendingMedia = media.filter((m) => m.moderation_status !== "approved");
        if (pendingMedia.length) throw new Error("Todas as mídias precisam estar aprovadas antes da publicação.");
        const { error: e } = await supabase.from("advertiser_profiles").update({ status: "published", published_at: new Date().toISOString() }).eq("id", selected.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("advertiser_profiles").update({ status: "paused" }).eq("id", selected.id);
        if (e) throw e;
      }
      setMessage("Ação administrativa concluída.");
      await loadAdvertisers();
      const refreshed = advertisers.find((a) => a.id === selected.id);
      if (refreshed) await openAdvertiser({ ...selected, ...(action === "verify" ? { verification_status: "verified" } : {}), ...(action === "reject" ? { verification_status: "rejected", status: "paused" } : {}), ...(action === "publish" ? { status: "published" } : {}), ...(action === "pause" ? { status: "paused" } : {}) });
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível concluir a ação."); }
    finally { setBusy(false); }
  }

  if (authorized === null) return <main className="shell"><section className="hero"><h1>Carregando revisão...</h1></section></main>;
  if (!authorized) return <main className="shell"><section className="hero"><h1>Acesso restrito.</h1><p>Esta área é exclusiva da equipe administrativa.</p><Link href="/admin" className="primaryButton">Voltar</Link></section></main>;
  const filtered = advertisers.filter((a) => `${a.title} ${a.display_name || ""}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="shell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><Link href="/admin" className="navCta">Administração</Link></nav><section className="hero" style={{ maxWidth: 1500 }}><div className="eyebrow">REVISÃO · MODERAÇÃO · PUBLICAÇÃO</div><h1>Centro de <em>revisão.</em></h1><p className="heroCopy">Visualização operacional completa do anúncio antes da publicação, incluindo identidade cadastral, localização, características, serviços, mídias e verificação.</p>{message && <p className="formSuccess">{message}</p>}{error && <p className="formError">{error}</p>}<div className="editorGrid"><aside className="editorNav"><label>Pesquisar<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome ou título" /></label>{filtered.map((item) => <button key={item.id} type="button" className={`editorTab ${selected?.id === item.id ? "active" : ""}`} onClick={() => void openAdvertiser(item)}><strong>{item.display_name || item.title}</strong><small>{labels[item.status] || item.status} · {labels[item.verification_status] || item.verification_status}</small></button>)}</aside><section className="authCard editorCard">{!selected ? <div><h2>Selecione um anunciante</h2><p>Abra um registro à esquerda para visualizar todos os dados disponíveis para revisão.</p></div> : <><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><span className="previewBadge">{labels[selected.status] || selected.status}</span><h2>{selected.title}</h2><p>{selected.display_name || "Sem nome público"}</p></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" className="secondaryButton" disabled={busy} onClick={() => void moderate("verify")}>Verificar</button><button type="button" className="secondaryButton" disabled={busy} onClick={() => void moderate("reject")}>Rejeitar</button><button type="button" className="secondaryButton" disabled={busy} onClick={() => void moderate("pause")}>Pausar</button><button type="button" className="primaryButton" disabled={busy} onClick={() => void moderate("publish")}>Publicar</button></div></div><hr /><h3>Identidade cadastral</h3><div className="formGrid"><p><strong>Nome legal:</strong> {String(account?.legal_name || "não informado")}</p><p><strong>CPF:</strong> {String(account?.cpf || "não informado")}</p><p><strong>Nascimento:</strong> {String(account?.birth_date || "não informado")}</p><p><strong>Conta:</strong> {labels[String(account?.status)] || String(account?.status || "não informado")}</p></div><h3>Dados do anúncio</h3><div className="formGrid"><p><strong>Altura:</strong> {selected.height_cm ?? "—"} cm</p><p><strong>Peso:</strong> {selected.weight_kg ?? "—"} kg</p><p><strong>Telefone:</strong> {selected.phone || "—"}</p><p><strong>WhatsApp:</strong> {selected.whatsapp || "—"}</p></div><p><strong>Resumo:</strong> {selected.summary || "—"}</p><p><strong>Descrição:</strong> {selected.description || "—"}</p><h3>Características</h3>{attributes.length ? <div className="serviceList">{attributes.map((a, i) => <div key={`${a.name}-${i}`} className="serviceCheck"><strong>{a.name}</strong><span>{typeof a.value === "string" ? a.value : JSON.stringify(a.value)}</span></div>)}</div> : <p>Nenhuma característica gravada.</p>}<h3>Serviços</h3>{services.length ? <div className="serviceList">{services.map((s, i) => <div key={`${s.name}-${i}`} className="serviceCheck"><strong>{s.name}</strong><span>{s.selected ? "Selecionado" : "Não selecionado"}{s.notes ? ` · ${s.notes}` : ""}</span></div>)}</div> : <p>Nenhum serviço gravado.</p>}<h3>Localização</h3>{address ? <div className="publicationBox"><p><strong>CEP:</strong> {String(address.zipcode || "—")}</p><p><strong>Endereço:</strong> {String(address.street || "—")}, {String(address.number || "—")} {String(address.complement || "")}</p><p><strong>Privacidade:</strong> {String(address.location_visibility || "private")}</p>{address.public_latitude && address.public_longitude ? <p><strong>Coordenadas públicas aproximadas:</strong> {String(address.public_latitude)}, {String(address.public_longitude)}</p> : null}{address.latitude && address.longitude ? <iframe className="mapFrame" title="Mapa administrativo" loading="lazy" src={`https://www.google.com/maps?q=${address.latitude},${address.longitude}&z=15&output=embed`} /> : <p>Coordenadas não disponíveis.</p>}</div> : <p>Endereço não cadastrado.</p>}<h3>Mídias ({media.length})</h3>{media.length ? <div className="mediaGrid">{media.map((m) => <article key={m.id} className="mediaCard"><div className="mediaPreview">{m.preview_url && m.kind === "image" ? <img src={m.preview_url} alt={m.original_filename || "Mídia"} /> : m.preview_url && m.kind === "video" ? <video src={m.preview_url} controls preload="metadata" /> : <span>Prévia indisponível</span>}</div><strong>{m.original_filename || "Arquivo"}</strong><small>{m.moderation_status} · {m.access_type === "paid" ? `Pago · R$ ${Number(m.price || 0).toFixed(2).replace(".", ",")}` : "Público"}</small></article>)}</div> : <p>Nenhuma mídia cadastrada.</p>}<h3>Verificação</h3><div className="publicationBox"><p><strong>Status do anúncio:</strong> {labels[selected.verification_status] || selected.verification_status}</p><p><strong>Caso:</strong> {verification ? labels[verification.status] || verification.status : "Nenhum caso registrado"}</p>{verification?.provider && <p><strong>Provedor:</strong> {verification.provider}</p>}{verification?.rejection_reason && <p><strong>Motivo da rejeição:</strong> {verification.rejection_reason}</p>}</div><h3>Dados comerciais</h3><div className="publicationBox"><p><strong>Preços:</strong> <code>{JSON.stringify(selected.pricing || {}, null, 2)}</code></p><p><strong>Pagamentos:</strong> <code>{JSON.stringify(selected.payment_options || {}, null, 2)}</code></p><p><strong>Redes sociais:</strong> <code>{JSON.stringify(selected.social_links || {}, null, 2)}</code></p></div></>}</section></div></section></main>;
}
