"use client";

import "../admin-redesign.css";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type BannerMetadata = {
  campaign_type?: "advertiser" | "pecatho";
  campaign_status?: "lead" | "quoted" | "approved" | "active" | "paused" | "completed" | "rejected";
  advertiser_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_whatsapp?: string;
  commercial_value?: string;
  notes?: string;
  budget_estimate?: string;
  intake_source?: string;
  submitted_at?: string;
  banner_format?: "leaderboard" | "rectangle" | "square" | "vertical";
  banner_format_preference?: "leaderboard" | "rectangle" | "square" | "vertical" | "consultation";
};
type Banner = {
  id: string;
  title: string | null;
  image_path: string | null;
  link_url: string | null;
  target: string | null;
  placement: string | null;
  sort_order: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  metadata: BannerMetadata | null;
  created_at: string;
};
type FormState = {
  id: string;
  title: string;
  image_path: string;
  link_url: string;
  target: "_self" | "_blank";
  placement: string;
  banner_format: NonNullable<BannerMetadata["banner_format"]>;
  sort_order: string;
  starts_at: string;
  ends_at: string;
  campaign_type: "advertiser" | "pecatho";
  campaign_status: NonNullable<BannerMetadata["campaign_status"]>;
  advertiser_name: string;
  contact_name: string;
  contact_email: string;
  contact_whatsapp: string;
  commercial_value: string;
  budget_estimate: string;
  notes: string;
};
const emptyForm: FormState = {
  id: "", title: "", image_path: "", link_url: "", target: "_self", placement: "home_top",
  banner_format: "leaderboard", sort_order: "0", starts_at: "", ends_at: "", campaign_type: "advertiser",
  campaign_status: "lead", advertiser_name: "", contact_name: "", contact_email: "", contact_whatsapp: "",
  commercial_value: "", budget_estimate: "", notes: "",
};
const bannerFormatDetails: Record<NonNullable<BannerMetadata["banner_format"]>, { label: string; maxWidth: number; ratio: string }> = {
  leaderboard: { label: "Faixa horizontal · 5:1 · até 1200 × 240 px", maxWidth: 1200, ratio: "5 / 1" },
  rectangle: { label: "Retangular · 2:1 · até 600 × 300 px", maxWidth: 600, ratio: "2 / 1" },
  square: { label: "Quadrado · 1:1 · até 600 × 600 px", maxWidth: 600, ratio: "1 / 1" },
  vertical: { label: "Vertical · 1:2 · até 300 × 600 px", maxWidth: 300, ratio: "1 / 2" },
};
const statusLabels: Record<NonNullable<BannerMetadata["campaign_status"]>, string> = {
  lead: "Contato recebido", quoted: "Proposta enviada", approved: "Aprovada / aguardando veiculação",
  active: "Veiculando", paused: "Pausada", completed: "Encerrada", rejected: "Recusada",
};
function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}
const bannerFormatPreferenceLabels: Record<NonNullable<BannerMetadata["banner_format_preference"]>, string> = {
  leaderboard: "Faixa horizontal · 5:1 · até 1200 × 240 px",
  rectangle: "Retangular · 2:1 · até 600 × 300 px",
  square: "Quadrado · 1:1 · até 600 × 600 px",
  vertical: "Vertical · 1:2 · até 300 × 600 px",
  consultation: "Solicitou orientação sobre o formato",
};
function readBannerFormatPreference(notes: string | null | undefined) {
  const match = notes?.match(/^Formato preferido:\s*(leaderboard|rectangle|square|vertical|consultation)\s*(?:\r?\n\s*\r?\n)?/i);
  if (!match) return { preference: null as NonNullable<BannerMetadata["banner_format_preference"]> | null, notes: notes || "" };
  return {
    preference: match[1].toLowerCase() as NonNullable<BannerMetadata["banner_format_preference"]>,
    notes: (notes || "").slice(match[0].length).trimStart(),
  };
}
function money(value: string | undefined) {
  if (!value) return "Não informado";
  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : value;
}

export default function AdminAdvertisingPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [placementFilter, setPlacementFilter] = useState("all");

  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from("banners")
        .select("id,title,image_path,link_url,target,placement,sort_order,active,starts_at,ends_at,metadata,created_at")
        .order("created_at", { ascending: false });
      if (queryError) setError(queryError.message);
      else setBanners((data || []) as Banner[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as campanhas. Verifique a conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!alive) return;
      if (authError || !user) { router.replace("/login"); return; }
      const { data: role, error: roleError } = await supabase.from("user_roles")
        .select("role").eq("user_id", user.id)
        .in("role", ["super_admin", "admin", "moderator", "support", "finance"]).limit(1).maybeSingle();
      if (!alive) return;
      if (roleError) { setError(roleError.message); setAuthLoading(false); return; }
      if (!role?.role && user.email?.trim().toLowerCase() !== "nilson.umasno@gmail.com") { router.replace("/painel"); return; }
      setAuthorized(true);
      setAuthLoading(false);
      await loadBanners();
    })().catch((err: unknown) => {
      if (!alive) return;
      setError(err instanceof Error ? err.message : "Não foi possível validar o acesso administrativo.");
      setAuthLoading(false);
    });
    return () => { alive = false; };
  }, [router, supabase, loadBanners]);

  function beginEdit(banner: Banner) {
    const meta = banner.metadata || {};
    setForm({
      id: banner.id, title: banner.title || "", image_path: banner.image_path || "",
      link_url: banner.link_url || "", target: banner.target === "_blank" ? "_blank" : "_self",
      placement: banner.placement || "home_top", banner_format: meta.banner_format || "leaderboard", sort_order: String(banner.sort_order ?? 0),
      starts_at: toLocalInput(banner.starts_at), ends_at: toLocalInput(banner.ends_at),
      campaign_type: meta.campaign_type === "pecatho" ? "pecatho" : "advertiser",
      campaign_status: meta.campaign_status || (banner.active ? "active" : "lead"),
      advertiser_name: meta.advertiser_name || "", contact_name: meta.contact_name || "", contact_email: meta.contact_email || "",
      contact_whatsapp: meta.contact_whatsapp || "",
      commercial_value: meta.intake_source === "public_advertising_form" ? "" : meta.commercial_value || "",
      budget_estimate: meta.budget_estimate || (meta.intake_source === "public_advertising_form" ? meta.commercial_value || "" : ""),
      notes: readBannerFormatPreference(meta.notes).notes,
    });
    setMessage(""); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError("");
    const image = form.image_path.trim();
    const link = form.link_url.trim();
    if (!form.title.trim()) { setError("Informe o título da campanha."); return; }
    if (form.campaign_status === "active" && !image) { setError("Informe a URL pública da imagem antes de ativar a campanha."); return; }
    if (image && !/^https?:\/\//i.test(image)) { setError("A imagem deve ser informada por uma URL pública iniciada em https:// ou http://."); return; }
    if (link && !/^https?:\/\//i.test(link) && !link.startsWith("/")) { setError("O destino deve ser uma URL http(s) ou um caminho interno iniciado por /."); return; }
    if (form.starts_at && form.ends_at && new Date(form.ends_at).getTime() < new Date(form.starts_at).getTime()) { setError("O encerramento não pode ser anterior ao início."); return; }
    const rawValue = form.commercial_value.trim();
    const normalizedValue = rawValue.includes(",") ? rawValue.replace(/\./g, "").replace(",", ".") : rawValue;
    if (rawValue && (!Number.isFinite(Number(normalizedValue)) || Number(normalizedValue) < 0)) { setError("Informe um valor comercial válido, sem valores negativos."); return; }
    const campaignActive = form.campaign_status === "active";
    const existingMetadata = form.id
      ? banners.find((banner) => banner.id === form.id)?.metadata || {}
      : {};
    const payload = {
      title: form.title.trim(),
      image_path: image || null,
      link_url: link || null,
      target: form.target,
      placement: form.placement.trim() || "home",
      sort_order: Math.max(0, Math.min(10000, Number.parseInt(form.sort_order, 10) || 0)),
      active: campaignActive,
      starts_at: fromLocalInput(form.starts_at),
      ends_at: fromLocalInput(form.ends_at),
      metadata: {
        ...existingMetadata,
        campaign_type: form.campaign_type,
        campaign_status: form.campaign_status,
        banner_format: form.banner_format,
        banner_format_preference: existingMetadata.banner_format_preference || readBannerFormatPreference(typeof existingMetadata.notes === "string" ? existingMetadata.notes : "").preference,
        advertiser_name: form.advertiser_name.trim() || null,
        contact_name: form.contact_name.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_whatsapp: form.contact_whatsapp.trim() || null,
        commercial_value: rawValue ? normalizedValue : null,
        budget_estimate: form.budget_estimate.trim() || null,
        notes: form.notes.trim() || null,
      },
    };
    setSaving(true);
    try {
      const result = form.id
        ? await supabase.from("banners").update(payload).eq("id", form.id)
        : await supabase.from("banners").insert(payload);
      if (result.error) { setError(result.error.message); return; }
      setMessage(form.id ? "Campanha atualizada." : "Campanha cadastrada.");
      setForm(emptyForm);
      await loadBanners();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a campanha por uma falha de conexão. Os dados preenchidos foram mantidos; tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function setCampaignStatus(banner: Banner, status: NonNullable<BannerMetadata["campaign_status"]>) {
    setMessage(""); setError("");
    if (status === "active") {
      if (typeof banner.image_path !== "string" || !/^https?:\/\//i.test(banner.image_path)) {
        setError("Não é possível ativar esta campanha: cadastre primeiro uma URL pública válida para a imagem e salve as alterações.");
        return;
      }
      if (banner.starts_at && banner.ends_at && new Date(banner.ends_at).getTime() < new Date(banner.starts_at).getTime()) {
        setError("Não é possível ativar esta campanha: a data de encerramento é anterior ao início.");
        return;
      }
    }
    const metadata = { ...(banner.metadata || {}), campaign_status: status };
    try {
      const { error: updateError } = await supabase.from("banners")
        .update({ metadata, active: status === "active" }).eq("id", banner.id);
      if (updateError) setError(updateError.message);
      else { setMessage("Etapa comercial atualizada."); await loadBanners(); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a etapa comercial por uma falha de conexão. Tente novamente.");
    }
  }

  async function deleteCampaign(banner: Banner) {
    const label = banner.title || "esta campanha";
    if (!window.confirm(`Excluir definitivamente "${label}"?`)) return;
    setMessage(""); setError("");
    try {
      const { error: deleteError } = await supabase.from("banners").delete().eq("id", banner.id);
      if (deleteError) setError(deleteError.message);
      else { setMessage("Campanha excluída."); if (form.id === banner.id) setForm(emptyForm); await loadBanners(); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir a campanha por uma falha de conexão. Tente novamente.");
    }
  }

  const isCurrentlyLive = (banner: Banner) => {
    const now = Date.now();
    return banner.active && (!banner.starts_at || new Date(banner.starts_at).getTime() <= now) && (!banner.ends_at || new Date(banner.ends_at).getTime() >= now);
  };
  const filteredBanners = banners.filter((banner) => {
    const status = banner.metadata?.campaign_status || (banner.active ? "active" : "lead");
    const needle = searchTerm.trim().toLocaleLowerCase("pt-BR");
    const searchable = [banner.title, banner.placement, banner.metadata?.advertiser_name, banner.metadata?.contact_name, banner.metadata?.contact_email, banner.metadata?.contact_whatsapp].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    if (needle && !searchable.includes(needle)) return false;
    if (placementFilter !== "all" && (banner.placement || "home") !== placementFilter) return false;
    if (filter === "active") return isCurrentlyLive(banner);
    if (filter !== "all" && status !== filter) return false;
    return true;
  });
  const activeCount = banners.filter(isCurrentlyLive).length;
  const scheduledCount = banners.filter((banner) => banner.active && banner.starts_at && new Date(banner.starts_at).getTime() > Date.now()).length;
  const pendingCount = banners.filter((banner) => ["lead", "quoted", "approved"].includes(banner.metadata?.campaign_status || "")).length;
  const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString("pt-BR") : "Sem data";

  if (authLoading) return <main className="shell"><section className="hero"><div className="eyebrow">ADMINISTRAÇÃO PECATHO</div><h1>Publicidade <em>e campanhas.</em></h1><div className="authCard">Validando acesso administrativo…</div></section></main>;
  if (!authorized) return <main className="shell"><section className="hero"><h1>Acesso administrativo necessário.</h1><p className="heroCopy">{error || "Sua conta não possui permissão para gerenciar campanhas."}</p><Link href="/painel" className="secondaryButton">Voltar ao painel</Link></section></main>;

  return <main className="shell adminConsoleShell">
    <nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><div className="navLinks"><Link href="/admin">Centro de gestão</Link><Link href="/anunciantes">Catálogo</Link><Link href="/painel" className="navCta">Painel</Link></div></nav>
    <section className="hero" style={{ maxWidth: 1400 }}>
      <div className="eyebrow">COMERCIAL · MÍDIA E CAMPANHAS</div>
      <h1>Publicidade <em>sob controle.</em></h1>
      <p className="heroCopy">Cadastre peças, organize a negociação, registre o anunciante e o valor combinado, programe a veiculação e pause ou encerre campanhas. Os registros usam a tabela banners existente; nenhum dado financeiro é criado automaticamente.</p>
      <div className="pillars" style={{ marginBottom: 24 }}>
        <article className="card"><div className="cardIcon">M</div><h2>{banners.length} campanhas</h2><p>Registros administráveis</p></article>
        <article className="card"><div className="cardIcon">▶</div><h2>{activeCount} veiculando</h2><p>Ativas e dentro do período programado</p></article>
        <article className="card"><div className="cardIcon">◷</div><h2>{scheduledCount} programadas</h2><p>Ativas, com início futuro</p></article>
        <article className="card"><div className="cardIcon">↗</div><h2>{pendingCount} em negociação</h2><p>Contato, proposta ou aprovação</p></article>
      </div>
      {message && <p className="formSuccess" role="status">{message}</p>}
      {error && <p className="formError" role="alert">{error}</p>}
      <section className="authCard" style={{ marginBottom: 28 }}>
        <h2>{form.id ? "Editar campanha" : "Cadastrar campanha"}</h2>
        <p>Use uma URL pública para a imagem. A campanha só aparece na página inicial quando o status está em “Veiculando” e o período está vigente.</p>
        <form onSubmit={saveCampaign}>
          <div className="formRow">
            <label>Título da campanha<input required maxLength={160} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Marca em destaque" /></label>
            <label>Tipo de campanha<select value={form.campaign_type} onChange={e => setForm({ ...form, campaign_type: e.target.value as FormState["campaign_type"] })}><option value="advertiser">Publicidade de anunciante</option><option value="pecatho">Campanha própria Pecatho</option></select></label>
          </div>
          <div className="formRow">
            <label>URL pública da imagem<input type="url" value={form.image_path} onChange={e => setForm({ ...form, image_path: e.target.value })} placeholder="https://… (obrigatória para veicular)" /></label>
            <label>Link ao clicar<input type="text" value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="/fans ou https://…" /></label>
          </div>
          <div style={{ marginTop: 14, padding: 14, border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, background: "rgba(255,255,255,.025)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
              <strong style={{ fontSize: 13 }}>Prévia da peça publicitária</strong>
              <span style={{ color: "#aeb3c0", fontSize: 12 }}>{form.placement.replaceAll("_", " ")} · {bannerFormatDetails[form.banner_format].label} · ordem {Math.max(0, Number.parseInt(form.sort_order, 10) || 0)}</span>
            </div>
            {/^https?:\/\//i.test(form.image_path.trim()) ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 14, alignItems: "center" }}>
              <div style={{ overflow: "hidden", width: "100%", maxWidth: bannerFormatDetails[form.banner_format].maxWidth, aspectRatio: bannerFormatDetails[form.banner_format].ratio, borderRadius: 10, background: "#11131a", border: "1px solid rgba(255,255,255,.1)" }}>
                <img src={form.image_path.trim()} alt={form.title.trim() || "Prévia da campanha"} style={{ display: "block", width: "100%", maxHeight: 260, objectFit: "contain" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#e9eaf0", fontSize: 16, fontWeight: 750, overflowWrap: "anywhere" }}>{form.title.trim() || "Título da campanha"}</div>
                <p style={{ color: "#aeb3c0", fontSize: 12, lineHeight: 1.6, overflowWrap: "anywhere" }}>Destino: {form.link_url.trim() || "Sem link configurado"}</p>
                <p style={{ color: form.campaign_status === "active" ? "#a4edbf" : "#e7c33f", fontSize: 12, marginBottom: 0 }}>Etapa: {statusLabels[form.campaign_status]}</p>
              </div>
            </div> : <p style={{ margin: 0, color: "#aeb3c0", fontSize: 13 }}>Informe uma URL pública de imagem para visualizar a peça. A prévia é administrativa; a campanha só será exibida ao público quando estiver ativa e dentro do período programado.</p>}
            {form.link_url.trim() && <p style={{ margin: "10px 0 0", color: "#8f96a7", fontSize: 12, overflowWrap: "anywhere" }}>O clique levará para: {form.link_url.trim()}</p>}
          </div>
          <div className="formRow">
            <label>Etapa comercial<select value={form.campaign_status} onChange={e => setForm({ ...form, campaign_status: e.target.value as FormState["campaign_status"] })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Onde aparecerá<select value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value })}><option value="home_top">Página inicial · superior</option><option value="home_mid">Página inicial · intermediária</option><option value="home_bottom">Página inicial · inferior</option><option value="home">Página inicial · posição padrão (superior)</option><option value="fans">Pecatho Fans</option><option value="catalog">Catálogo</option></select><small style={{ color: "#aeb3c0", fontWeight: 400 }}>Os banners serão exibidos na área selecionada quando estiverem ativos e dentro do período programado.</small></label>
          </div>
          <div className="formRow">
            <label>Nome da empresa / anunciante<input value={form.advertiser_name} onChange={e => setForm({ ...form, advertiser_name: e.target.value })} placeholder="Empresa ou responsável" /></label>
            <label>Nome do contato<input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Pessoa responsável" /></label>
          </div>
          <div className="formRow">
            <label>Contato por e-mail<input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="contato@empresa.com" /></label>
            <label>WhatsApp de contato<input value={form.contact_whatsapp} onChange={e => setForm({ ...form, contact_whatsapp: e.target.value })} placeholder="DDD + número" /></label>
          </div>
          <div className="formRow">
            <label>Valor comercial combinado (R$)<input inputMode="decimal" value={form.commercial_value} onChange={e => setForm({ ...form, commercial_value: e.target.value })} placeholder="Ex.: 500,00" /></label>
            <label>Orçamento estimado informado (R$ ou texto)<input maxLength={80} value={form.budget_estimate} onChange={e => setForm({ ...form, budget_estimate: e.target.value })} placeholder="Orçamento indicado pelo solicitante" /></label>
          </div>
          <div className="formRow">
            <label>Início da veiculação<input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} /></label>
            <label>Fim da veiculação<input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} /></label>
          </div>
          <div className="formRow">
            <label>Formato e tamanho<select value={form.banner_format} onChange={e => setForm({ ...form, banner_format: e.target.value as FormState["banner_format"] })}><option value="leaderboard">Faixa horizontal · proporção 5:1 · até 1200 × 240 px</option><option value="rectangle">Retangular · proporção 2:1 · até 600 × 300 px</option><option value="square">Quadrado · proporção 1:1 · até 600 × 600 px</option><option value="vertical">Vertical · proporção 1:2 · até 300 × 600 px</option></select><small style={{ color: "#aeb3c0", fontWeight: 400 }}>O site adapta a exibição ao desktop e celular. Envie a arte na proporção escolhida para evitar cortes.</small></label>
            <label>Ordem de exibição<input type="number" min="0" max="10000" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></label>
            <label>Abertura do link<select value={form.target} onChange={e => setForm({ ...form, target: e.target.value as FormState["target"] })}><option value="_self">Na mesma aba</option><option value="_blank">Nova aba</option></select></label>
          </div>
          <label style={{ display: "block", marginTop: 12 }}>Observações comerciais<textarea rows={3} maxLength={3000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Condições acordadas, material pendente, responsável pelo atendimento…" /></label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}><button type="submit" className="primaryButton" disabled={saving}>{saving ? "Salvando…" : form.id ? "Salvar alterações" : "Cadastrar campanha"}</button>{form.id && <button type="button" className="secondaryButton" onClick={() => setForm(emptyForm)}>Cancelar edição</button>}</div>
        </form>
      </section>
      <section className="authCard">
        <div style={{ display: "grid", gap: 12 }}><h2>Carteira de campanhas</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 10 }}><label>Buscar campanha ou anunciante<input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Título, empresa, contato, e-mail…" /></label><label>Etapa comercial<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todas as etapas</option><option value="active">Veiculando agora</option>{Object.entries(statusLabels).filter(([value]) => value !== "active").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Posição<select value={placementFilter} onChange={e => setPlacementFilter(e.target.value)}><option value="all">Todas as posições</option><option value="home">Página inicial</option><option value="home_top">Página inicial · superior</option><option value="home_mid">Página inicial · intermediária</option><option value="home_bottom">Página inicial · inferior</option><option value="fans">Pecatho Fans</option><option value="catalog">Catálogo</option></select></label></div><p style={{ margin: 0, color: "#aeb3c0", fontSize: 13 }}>{filteredBanners.length} de {banners.length} campanhas exibidas.</p></div>
        {loading ? <p>Carregando campanhas…</p> : filteredBanners.length === 0 ? <p>Nenhuma campanha encontrada para este filtro.</p> : <div style={{ display: "grid", gap: 14, marginTop: 16 }}>{filteredBanners.map(banner => {
          const meta = banner.metadata || {};
          const status = meta.campaign_status || (banner.active ? "active" : "lead");
          return <article key={banner.id} style={{ display: "grid", gridTemplateColumns: "minmax(100px,180px) minmax(0,1fr)", gap: 16, padding: 16, border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, background: "rgba(255,255,255,.025)" }}>
            <div style={{ minHeight: 90, borderRadius: 10, overflow: "hidden", background: "#11131a" }}>{banner.image_path && <img src={banner.image_path} alt="" style={{ width: "100%", height: "100%", minHeight: 90, objectFit: "cover" }} />}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><h3 style={{ margin: "0 0 6px", overflowWrap: "anywhere" }}>{banner.title || "Campanha sem título"}</h3><p style={{ margin: "0 0 6px", color: "#aeb3c0" }}>{meta.campaign_type === "pecatho" ? "Campanha própria Pecatho" : "Publicidade de anunciante"} · {statusLabels[status] || status}</p>{(meta.banner_format_preference || readBannerFormatPreference(meta.notes).preference) && <p style={{ margin: "6px 0", color: "#e7c33f", fontSize: 13, fontWeight: 650 }}>Formato solicitado: {bannerFormatPreferenceLabels[(meta.banner_format_preference || readBannerFormatPreference(meta.notes).preference)!]}</p>}<p style={{ margin: 0, color: "#aeb3c0", fontSize: 13 }}>{meta.advertiser_name || "Anunciante não informado"} · Valor combinado: {money(meta.commercial_value)}</p>{meta.budget_estimate && <p style={{ margin: "5px 0 0", color: "#c4c8d1", fontSize: 12 }}>Orçamento estimado informado: {meta.budget_estimate}</p>}<p style={{ margin: "6px 0 0", color: "#8f96a7", fontSize: 12 }}>Posição: {banner.placement || "home"} · Ordem: {banner.sort_order} · {formatDate(banner.starts_at)} a {formatDate(banner.ends_at)}</p>{meta.intake_source === "public_advertising_form" && meta.submitted_at && <p style={{ margin: "5px 0 0", color: "#8f96a7", fontSize: 12 }}>Solicitação recebida em: {new Date(meta.submitted_at).toLocaleString("pt-BR")}</p>}</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" className="secondaryButton" onClick={() => beginEdit(banner)}>Editar</button><button type="button" className="secondaryButton" onClick={() => void deleteCampaign(banner)}>Excluir</button></div></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}><label style={{ display: "flex", alignItems: "center", gap: 8 }}>Etapa rápida<select value={status} onChange={e => void setCampaignStatus(banner, e.target.value as NonNullable<BannerMetadata["campaign_status"]>)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{meta.contact_email && <a href={`mailto:${meta.contact_email}`} className="secondaryButton">E-mail</a>}{meta.contact_whatsapp && <a href={`https://wa.me/${meta.contact_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="secondaryButton">WhatsApp</a>}</div>
              {readBannerFormatPreference(meta.notes).notes && <p style={{ margin: "10px 0 0", color: "#c4c8d1", whiteSpace: "pre-wrap" }}>{readBannerFormatPreference(meta.notes).notes}</p>}
            </div>
          </article>;
        })}</div>}
      </section>
    </section>
  </main>;
}
