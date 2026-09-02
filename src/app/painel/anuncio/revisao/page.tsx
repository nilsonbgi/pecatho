"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type JsonObject = Record<string, unknown>;
type Media = { id: string; kind: string; original_filename: string | null; storage_bucket: string; storage_path: string; moderation_status: string; access_type: string; is_public: boolean; is_primary: boolean; price: number | null; preview_url?: string };
type Attribute = { id: string; name: string; slug: string; value: unknown };
type Service = { id: string; name: string; selected: boolean; notes: string | null };

function object(value: unknown): JsonObject { return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {}; }
function text(value: unknown): string { return value == null ? "" : typeof value === "string" ? value : JSON.stringify(value); }
function age(date: string | null) {
  if (!date) return "—";
  const birth = new Date(`${date}T00:00:00Z`); const now = new Date();
  let years = now.getUTCFullYear() - birth.getUTCFullYear();
  if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) years--;
  return years >= 0 ? String(years) : "—";
}

export default function AnuncioReviewPage() {
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [profile, setProfile] = useState<any>(null); const [account, setAccount] = useState<any>(null); const [address, setAddress] = useState<any>(null);
  const [category, setCategory] = useState<any>(null); const [state, setState] = useState<any>(null); const [city, setCity] = useState<any>(null); const [neighborhood, setNeighborhood] = useState<any>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]); const [services, setServices] = useState<Service[]>([]); const [media, setMedia] = useState<Media[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/login"; return; }
        const { data: p, error: pe } = await supabase.from("advertiser_profiles").select("id,user_id,title,display_name,summary,description,state_id,city_id,category_id,neighborhood_id,birth_date,height_cm,weight_kg,availability,phone,whatsapp,phone_secondary,pricing,service_options,payment_options,social_links,positioning,primary_media_id,status,verification_status").eq("user_id", user.id).maybeSingle();
        if (pe) throw pe; if (!p) { if (alive) setError("Ainda não existe um rascunho de anúncio. Crie o anúncio antes da revisão."); return; }
        const [a, addr, cat, st, ci, nb, attrs, svcs, med] = await Promise.all([
          supabase.from("profiles").select("display_name,legal_name,email,phone,cpf,birth_date,status,verification_status").eq("id", user.id).maybeSingle(),
          supabase.from("user_addresses").select("zipcode,street,number,complement,neighborhood_id,city_id,state_id,latitude,longitude,location_visibility,public_latitude,public_longitude").eq("user_id", user.id).eq("address_type","primary").maybeSingle(),
          supabase.from("categories").select("id,name").eq("id", p.category_id).maybeSingle(),
          supabase.from("states").select("id,uf,name").eq("id", p.state_id).maybeSingle(),
          supabase.from("cities").select("id,name").eq("id", p.city_id).maybeSingle(),
          supabase.from("neighborhoods").select("id,name").eq("id", p.neighborhood_id).maybeSingle(),
          supabase.from("profile_attribute_values").select("attribute_id,value,category_attributes(id,name,slug)").eq("profile_id", p.id),
          supabase.from("profile_services").select("service_id,selected,notes,category_services(id,name)").eq("profile_id", p.id),
          supabase.from("profile_media").select("id,kind,original_filename,storage_bucket,storage_path,moderation_status,access_type,is_public,is_primary,price").eq("profile_id", p.id).order("sort_order"),
        ]);
        if (!alive) return;
        setProfile(p); setAccount(a.data); setAddress(addr.data); setCategory(cat.data); setState(st.data); setCity(ci.data); setNeighborhood(nb.data);
        setAttributes((attrs.data || []).map((r: any) => ({ id: String(r.attribute_id), name: r.category_attributes?.name || "Característica", slug: r.category_attributes?.slug || "", value: r.value })));
        setServices((svcs.data || []).map((r: any) => ({ id: String(r.service_id), name: r.category_services?.name || "Serviço", selected: r.selected === true, notes: r.notes || null })));
        const rows = (med.data || []) as Media[];
        const withUrls = await Promise.all(rows.map(async (m) => { const signed = await supabase.storage.from(m.storage_bucket).createSignedUrl(m.storage_path, 600); return { ...m, preview_url: signed.data?.signedUrl }; }));
        setMedia(withUrls);
      } catch (e) { if (alive) setError(e instanceof Error ? e.message : "Não foi possível carregar a revisão."); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const pricing = object(profile?.pricing); const payments = object(profile?.payment_options); const social = object(profile?.social_links);
  const selectedServices = useMemo(() => services.filter((s) => s.selected), [services]);
  const approvedMedia = media.filter((m) => m.moderation_status === "approved");
  const checks = [
    ["Identidade", !!account?.birth_date],
    ["Categoria", !!profile?.category_id],
    ["Localização", !!profile?.state_id && !!profile?.city_id],
    ["Título", String(profile?.title || "").trim().length >= 3],
    ["Data de nascimento", !!account?.birth_date],
    ["Mídia cadastrada", media.length > 0],
  ] as [string, boolean][];
  const canSubmit = checks.every(([, ok]) => ok) && profile && ["draft", "paused"].includes(profile.status);

  async function submitReview() {
    setBusy(true); setMessage(""); setError("");
    try { const response = await fetch("/api/painel/anuncio/enviar-analise", { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Não foi possível enviar para análise."); setMessage("Anúncio enviado para análise."); setProfile((p: any) => p ? { ...p, status: "pending_review" } : p); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível enviar para análise."); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="shell"><section className="hero"><p>Carregando revisão completa…</p></section></main>;
  if (error && !profile) return <main className="shell"><section className="hero"><Link href="/painel/anuncio">← Voltar ao anúncio</Link><h1>Revisão do anúncio</h1><p className="fieldNote">{error}</p></section></main>;

  return <main className="shell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><div className="navLinks"><Link href="/painel">Painel</Link><Link href="/painel/anuncio">Editar anúncio</Link><Link href="/painel/anuncio/operacional">Operacional</Link></div></nav>
    <section className="hero"><div className="eyebrow">REVISÃO ANTES DA ANÁLISE</div><h1>Conferência completa do anúncio</h1><p className="heroCopy">Esta tela reúne os dados que serão submetidos à revisão. Nada é publicado automaticamente: a publicação continua condicionada à verificação e à moderação.</p>
      {(message || error) && <div className="card" style={{marginBottom:16}}><strong>{message || error}</strong></div>}
      <section className="pillars">
        <article className="card"><h2>Status</h2><p><strong>{profile?.title || "Sem título"}</strong></p><p>Publicação: {profile?.status}</p><p>Verificação: {profile?.verification_status}</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{checks.map(([label, ok]) => <span key={label} className="fieldNote">{ok ? "✓" : "○"} {label}</span>)}</div></article>
        <article className="card"><h2>Identidade</h2><p>Nome: {account?.display_name || account?.legal_name || "—"}</p><p>CPF: {account?.cpf ? "Cadastro existente" : "Não informado"}</p><p>Data de nascimento: {account?.birth_date || "—"} · idade derivada: {age(account?.birth_date || null)}</p><p>E-mail: {account?.email || "—"}</p></article>
        <article className="card"><h2>Apresentação</h2><p>Nome público: {profile?.display_name || "—"}</p><p>Categoria: {category?.name || "—"}</p><p>Posicionamento: {profile?.positioning || "—"}</p><p>{profile?.summary || "Sem resumo."}</p><p>{profile?.description || "Sem descrição."}</p></article>
        <article className="card"><h2>Características</h2><p>Altura: {profile?.height_cm ? `${profile.height_cm} cm` : "—"} · Peso: {profile?.weight_kg ? `${profile.weight_kg} kg` : "—"}</p>{attributes.length ? attributes.map((a) => <p key={a.id}><strong>{a.name}:</strong> {text(a.value)}</p>) : <p className="fieldNote">Nenhuma característica adicional cadastrada.</p>}</article>
        <article className="card"><h2>Serviços selecionados</h2>{selectedServices.length ? selectedServices.map((s) => <p key={s.id}>✓ {s.name}{s.notes ? ` — ${s.notes}` : ""}</p>) : <p className="fieldNote">Nenhum serviço selecionado.</p>}</article>
        <article className="card"><h2>Localização</h2><p>{state?.name || "—"} · {city?.name || "—"}{neighborhood?.name ? ` · ${neighborhood.name}` : ""}</p><p>{address?.zipcode || "—"} · {address?.street || "—"}{address?.number ? `, ${address.number}` : ""}</p><p>Visibilidade: {address?.location_visibility || "—"}</p>{address?.public_latitude != null && <p>Coordenadas públicas aproximadas disponíveis.</p>}</article>
        <article className="card"><h2>Disponibilidade e preços</h2><p>Disponibilidade: {profile?.availability || "Configuração operacional"}</p><p>Preço de referência: {pricing.price != null ? `R$ ${String(pricing.price)}` : "—"}</p>{Array.isArray(pricing.periods) && pricing.periods.map((x: any, i: number) => <p key={i}>{x.minutes || "—"} min · R$ {x.price || "—"}</p>)}</article>
        <article className="card"><h2>Pagamentos e contato</h2><p>Pagamento configurado: {Object.keys(payments).length ? "Sim" : "Não"}</p><p>Telefone: {profile?.phone || account?.phone || "—"}</p><p>WhatsApp: {profile?.whatsapp || "—"}</p><p>Contato secundário: {profile?.phone_secondary || "—"}</p>{Object.keys(social).length > 0 && <p>Redes sociais: configuradas</p>}</article>
      </section>
      <section className="card" style={{marginTop:20}}><h2>Mídias e estado de moderação</h2><p>{media.length} arquivo(s) · {approvedMedia.length} aprovado(s).</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>{media.map((m) => <div key={m.id} style={{border:"1px solid rgba(127,127,127,.25)",borderRadius:12,padding:10}}>{m.preview_url && m.kind === "image" ? <img src={m.preview_url} alt={m.original_filename || "Mídia"} style={{width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:8}} /> : m.preview_url && m.kind === "video" ? <video src={m.preview_url} controls style={{width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:8}} /> : <div style={{aspectRatio:"1",display:"grid",placeItems:"center"}}>Prévia protegida</div>}<p>{m.original_filename || "Arquivo"}</p><small>{m.moderation_status} · {m.access_type === "paid" ? "pago" : m.is_public ? "público" : "protegido"}{m.is_primary ? " · principal" : ""}</small></div>)}</div></section>
      <section className="card" style={{marginTop:20,display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}><div><h2>Pronto para enviar?</h2><p className="fieldNote">O envio muda o estado para <strong>Em análise</strong>. A publicação depende da revisão administrativa e das regras de segurança.</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link className="secondaryButton" href="/painel/anuncio">Corrigir dados</Link><button className="secondaryButton" onClick={submitReview} disabled={!canSubmit || busy}>{busy ? "Enviando…" : profile?.status === "pending_review" ? "Em análise" : "Enviar para análise"}</button></div></section>
    </section></main>;
}
