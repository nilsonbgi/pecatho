"use client";

import "../admin-redesign.css";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type BannerMetadata = {
  campaign_type?: "advertiser" | "pecatho";
  campaign_status?: "lead" | "quoted" | "approved" | "active" | "paused" | "completed" | "rejected";
  campaign_status_history?: { from: string; to: string; changed_at: string; changed_by: string | null }[];
  commercial_interaction_history?: { type: "call" | "email" | "whatsapp" | "meeting" | "note"; summary: string; created_at: string; created_by: string | null }[];
  next_follow_up_at?: string | null;
  follow_up_note?: string | null;
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
  next_follow_up_at: string;
  follow_up_note: string;
};
const emptyForm: FormState = {
  id: "", title: "", image_path: "", link_url: "", target: "_self", placement: "home_top",
  banner_format: "leaderboard", sort_order: "0", starts_at: "", ends_at: "", campaign_type: "advertiser",
  campaign_status: "lead", advertiser_name: "", contact_name: "", contact_email: "", contact_whatsapp: "",
  commercial_value: "", budget_estimate: "", notes: "", next_follow_up_at: "", follow_up_note: "",
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
function isSafeCampaignLink(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(null);
  const [interactionDrafts, setInteractionDrafts] = useState<Record<string, { type: "call" | "email" | "whatsapp" | "meeting" | "note"; summary: string }>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [placementFilter, setPlacementFilter] = useState("all");
  const [campaignSort, setCampaignSort] = useState<"priority" | "recent" | "value">("priority");
  const [campaignTypeFilter, setCampaignTypeFilter] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    let intervalId: number | undefined;
    const initialTimeoutId = window.setTimeout(() => {
      setCurrentTime(Date.now());
      intervalId = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    }, 0);
    return () => {
      window.clearTimeout(initialTimeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, []);

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
      next_follow_up_at: toLocalInput(meta.next_follow_up_at || null),
      follow_up_note: meta.follow_up_note || "",
    });
    setMessage(""); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadArtwork(file: File | undefined) {
    if (!file) return;
    setError(""); setMessage("");
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) { setError("Envie uma imagem JPG, PNG ou WebP."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("A arte deve ter no máximo 5 MB."); return; }
    setUploadingArtwork(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { setError("Sua sessão expirou. Entre novamente para enviar a arte."); return; }
      const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("pecatho-banners").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (uploadError) { setError(`Não foi possível enviar a arte: ${uploadError.message}`); return; }
      const { data } = supabase.storage.from("pecatho-banners").getPublicUrl(path);
      setForm(current => ({ ...current, image_path: data.publicUrl }));
      setMessage("Arte enviada. Confira a prévia e salve a campanha.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao enviar a arte. Tente novamente.");
    } finally { setUploadingArtwork(false); }
  }

  async function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError("");
    const image = form.image_path.trim();
    const link = form.link_url.trim();
    if (!form.title.trim()) { setError("Informe o título da campanha."); return; }
    if (form.campaign_status === "active" && !image) { setError("Informe a URL pública da imagem antes de ativar a campanha."); return; }
    if (image && !/^https?:\/\//i.test(image)) { setError("A imagem deve ser informada por uma URL pública iniciada em https:// ou http://."); return; }
    if (!isSafeCampaignLink(link)) { setError("O destino deve ser uma URL http:// ou https:// válida, ou um caminho interno iniciado por uma única barra. Links externos devem usar http(s)."); return; }
    if (form.starts_at && form.ends_at && new Date(form.ends_at).getTime() < new Date(form.starts_at).getTime()) { setError("O encerramento não pode ser anterior ao início."); return; }
    const rawValue = form.commercial_value.trim();
    const normalizedValue = rawValue.includes(",") ? rawValue.replace(/\./g, "").replace(",", ".") : rawValue;
    if (rawValue && (!Number.isFinite(Number(normalizedValue)) || Number(normalizedValue) < 0)) { setError("Informe um valor comercial válido, sem valores negativos."); return; }
    const campaignActive = form.campaign_status === "active";
    const existingBanner = form.id ? banners.find((banner) => banner.id === form.id) : undefined;
    const existingMetadata = existingBanner?.metadata || {};
    const previousStatus = existingMetadata.campaign_status || (existingBanner?.active ? "active" : "lead");
    const statusChanged = Boolean(form.id && previousStatus !== form.campaign_status);
    let statusHistory = Array.isArray(existingMetadata.campaign_status_history) ? existingMetadata.campaign_status_history : [];
    if (statusChanged) {
      const { data: { user } } = await supabase.auth.getUser();
      statusHistory = [
        ...statusHistory,
        {
          from: previousStatus,
          to: form.campaign_status,
          changed_at: new Date().toISOString(),
          changed_by: user?.email || user?.id || null,
        },
      ].slice(-50);
    }
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
        ...(statusChanged ? { campaign_status_history: statusHistory } : {}),
        banner_format: form.banner_format,
        banner_format_preference: existingMetadata.banner_format_preference || readBannerFormatPreference(typeof existingMetadata.notes === "string" ? existingMetadata.notes : "").preference,
        advertiser_name: form.advertiser_name.trim() || null,
        contact_name: form.contact_name.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_whatsapp: form.contact_whatsapp.trim() || null,
        commercial_value: rawValue ? normalizedValue : null,
        budget_estimate: form.budget_estimate.trim() || null,
        notes: form.notes.trim() || null,
        next_follow_up_at: form.next_follow_up_at ? fromLocalInput(form.next_follow_up_at) : null,
        follow_up_note: form.follow_up_note.trim() || null,
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
      if (!isSafeCampaignLink((banner.link_url || "").trim())) {
        setError("Não é possível ativar esta campanha: corrija o destino para uma URL http:// ou https:// válida, ou um caminho interno iniciado por uma única barra.");
        return;
      }
    }
    const previousStatus = banner.metadata?.campaign_status || (banner.active ? "active" : "lead");
    if (status === previousStatus) return;
    const { data: { user } } = await supabase.auth.getUser();
    const history = Array.isArray(banner.metadata?.campaign_status_history) ? banner.metadata.campaign_status_history : [];
    const metadata = {
      ...(banner.metadata || {}),
      campaign_status: status,
      campaign_status_history: [
        ...history,
        {
          from: previousStatus,
          to: status,
          changed_at: new Date().toISOString(),
          changed_by: user?.email || user?.id || null,
        },
      ].slice(-50),
    };
    setUpdatingCampaignId(banner.id);
    try {
      const { error: updateError } = await supabase.from("banners")
        .update({ metadata, active: status === "active" }).eq("id", banner.id);
      if (updateError) setError(updateError.message);
      else { setMessage("Etapa comercial atualizada."); await loadBanners(); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a etapa comercial por uma falha de conexão. Tente novamente.");
    } finally {
      setUpdatingCampaignId(null);
    }
  }

  async function logCommercialInteraction(banner: Banner) {
    const draft = interactionDrafts[banner.id];
    const summary = draft?.summary.trim() || "";
    if (!summary) {
      setError("Descreva o contato ou próximo passo antes de registrar a interação.");
      return;
    }
    setMessage("");
    setError("");
    setUpdatingCampaignId(banner.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const history = Array.isArray(banner.metadata?.commercial_interaction_history)
        ? banner.metadata.commercial_interaction_history
        : [];
      const metadata = {
        ...(banner.metadata || {}),
        commercial_interaction_history: [
          ...history,
          {
            type: draft.type,
            summary: summary.slice(0, 1000),
            created_at: new Date().toISOString(),
            created_by: user?.email || user?.id || null,
          },
        ].slice(-100),
      };
      const { error: updateError } = await supabase.from("banners").update({ metadata }).eq("id", banner.id);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setInteractionDrafts((current) => ({ ...current, [banner.id]: { type: "note", summary: "" } }));
      setMessage("Interação comercial registrada no histórico.");
      await loadBanners();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar a interação comercial.");
    } finally {
      setUpdatingCampaignId(null);
    }
  }

  async function completeFollowUp(banner: Banner) {
    const meta = banner.metadata || {};
    if (!meta.next_follow_up_at) {
      setError("Esta campanha não possui um acompanhamento pendente.");
      return;
    }
    const note = meta.follow_up_note?.trim();
    const summary = note
      ? `Acompanhamento concluído. Próximo contato registrado anteriormente: ${note}`
      : "Acompanhamento comercial concluído.";
    setMessage("");
    setError("");
    setUpdatingCampaignId(banner.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const history = Array.isArray(meta.commercial_interaction_history)
        ? meta.commercial_interaction_history
        : [];
      const metadata = {
        ...meta,
        next_follow_up_at: null,
        follow_up_note: null,
        commercial_interaction_history: [
          ...history,
          {
            type: "note" as const,
            summary,
            created_at: new Date().toISOString(),
            created_by: user?.email || user?.id || null,
          },
        ].slice(-100),
      };
      const { error: updateError } = await supabase.from("banners")
        .update({ metadata }).eq("id", banner.id);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setMessage("Acompanhamento concluído e registrado no histórico comercial.");
      await loadBanners();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir o acompanhamento comercial.");
    } finally {
      setUpdatingCampaignId(null);
    }
  }

  async function duplicateCampaign(banner: Banner) {
    const label = (banner.title || "Campanha").trim();
    const confirmed = window.confirm(`Criar uma nova campanha baseada em "${label}"? O novo registro começará como contato recebido, sem valor comercial, orçamento, datas de veiculação ou histórico copiados.`);
    if (!confirmed) return;

    setMessage("");
    setError("");
    setSaving(true);
    try {
      const metadata = { ...(banner.metadata || {}) };
      delete metadata.campaign_status_history;
      delete metadata.commercial_value;
      delete metadata.budget_estimate;
      delete metadata.submitted_at;
      delete metadata.intake_source;
      delete metadata.next_follow_up_at;
      delete metadata.follow_up_note;
      const payload = {
        title: `Cópia de ${label}`.slice(0, 160),
        image_path: banner.image_path,
        link_url: banner.link_url,
        target: banner.target === "_blank" ? "_blank" : "_self",
        placement: banner.placement || "home",
        sort_order: Math.max(0, Math.min(10000, Number(banner.sort_order) || 0)),
        active: false,
        starts_at: null,
        ends_at: null,
        metadata: {
          ...metadata,
          campaign_status: "lead",
          commercial_value: null,
          budget_estimate: null,
          campaign_status_history: [],
        },
      };
      const { error: insertError } = await supabase.from("banners").insert(payload);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setMessage("Cópia criada como novo contato recebido. Revise os dados comerciais e as datas antes de veicular.");
      await loadBanners();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível duplicar a campanha por uma falha de conexão.");
    } finally {
      setSaving(false);
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
    const now = (currentTime ?? 0);
    return banner.active && (!banner.starts_at || new Date(banner.starts_at).getTime() <= now) && (!banner.ends_at || new Date(banner.ends_at).getTime() >= now);
  };
  const campaignDisplayStatus = (banner: Banner, status: string) => {
    if (status !== "active" || !banner.active) return statusLabels[status as NonNullable<BannerMetadata["campaign_status"]>] || status;
    const now = (currentTime ?? 0);
    if (banner.ends_at && new Date(banner.ends_at).getTime() < now) return "Período encerrado";
    if (banner.starts_at && new Date(banner.starts_at).getTime() > now) return "Programada";
    return "Veiculando";
  };
  const isScheduled = (banner: Banner) => {
    const now = (currentTime ?? 0);
    return banner.active &&
      !!banner.starts_at &&
      new Date(banner.starts_at).getTime() > now &&
      (!banner.ends_at || new Date(banner.ends_at).getTime() >= now);
  };
  const isExpired = (banner: Banner) =>
    !!banner.ends_at && new Date(banner.ends_at).getTime() < (currentTime ?? 0);
  function exportCampaignsCsv() {
    const columns = [
      ["Título", (banner: Banner) => banner.title || ""],
      ["Data de cadastro", (banner: Banner) => banner.created_at || ""],
      ["Origem da solicitação", (banner: Banner) => banner.metadata?.intake_source === "public_advertising_form" ? "Formulário público /anunciar" : "Cadastro administrativo"],
      ["Data de recebimento da solicitação", (banner: Banner) => banner.metadata?.submitted_at || ""],
      ["Formato do banner", (banner: Banner) => {
        const preference = banner.metadata?.banner_format_preference || readBannerFormatPreference(banner.metadata?.notes).preference;
        return preference ? bannerFormatPreferenceLabels[preference] : banner.metadata?.banner_format ? bannerFormatDetails[banner.metadata.banner_format].label : "";
      }],
      ["Tipo", (banner: Banner) => banner.metadata?.campaign_type === "pecatho" ? "Campanha própria Pecatho" : "Publicidade de anunciante"],
      ["Etapa comercial", (banner: Banner) => campaignDisplayStatus(banner, banner.metadata?.campaign_status || (banner.active ? "active" : "lead"))],
      ["Anunciante", (banner: Banner) => banner.metadata?.advertiser_name || ""],
      ["Contato", (banner: Banner) => banner.metadata?.contact_name || ""],
      ["E-mail", (banner: Banner) => banner.metadata?.contact_email || ""],
      ["WhatsApp", (banner: Banner) => banner.metadata?.contact_whatsapp || ""],
      ["Valor combinado (R$)", (banner: Banner) => banner.metadata?.commercial_value || ""],
      ["Orçamento estimado", (banner: Banner) => banner.metadata?.budget_estimate || ""],
      ["Posição", (banner: Banner) => banner.placement || "home"],
      ["Início", (banner: Banner) => banner.starts_at || ""],
      ["Fim", (banner: Banner) => banner.ends_at || ""],
      ["URL da arte", (banner: Banner) => banner.image_path || ""],
      ["Destino", (banner: Banner) => banner.link_url || ""],
      ["Próximo acompanhamento", (banner: Banner) => banner.metadata?.next_follow_up_at || ""],
      ["Nota do acompanhamento", (banner: Banner) => banner.metadata?.follow_up_note || ""],
      ["Observações", (banner: Banner) => readBannerFormatPreference(banner.metadata?.notes).notes],
    ] as const;
    const escapeCsv = (value: string) => {
      // Neutraliza fórmulas em planilhas quando campos controlados por anunciantes começam com caracteres executáveis.
      const safeValue = /^[\u0000-\u0020]*[=+\-@]/.test(value) ? "'" + value : value;
      return '"' + safeValue.replace(/"/g, '""') + '"';
    };
    const csv = [columns.map(([label]) => escapeCsv(label)).join(";"), ...filteredBanners.map(banner => columns.map(([, getValue]) => escapeCsv(String(getValue(banner) ?? ""))).join(";"))].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pecatho-campanhas-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const filteredBanners = banners.filter((banner) => {
    const status = banner.metadata?.campaign_status || (banner.active ? "active" : "lead");
    const needle = searchTerm.trim().toLocaleLowerCase("pt-BR");
    const searchable = [banner.title, banner.placement, banner.metadata?.advertiser_name, banner.metadata?.contact_name, banner.metadata?.contact_email, banner.metadata?.contact_whatsapp].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    if (needle && !searchable.includes(needle)) return false;
    const createdAt = new Date(banner.created_at).getTime();
    if (createdFrom) {
      const from = new Date(`${createdFrom}T00:00:00`).getTime();
      if (!Number.isFinite(createdAt) || createdAt < from) return false;
    }
    if (createdTo) {
      const to = new Date(`${createdTo}T23:59:59.999`).getTime();
      if (!Number.isFinite(createdAt) || createdAt > to) return false;
    }
    if (campaignTypeFilter !== "all" && (banner.metadata?.campaign_type === "pecatho" ? "pecatho" : "advertiser") !== campaignTypeFilter) return false;
    if (placementFilter !== "all" && (banner.placement || "home") !== placementFilter) return false;
    if (filter === "followup" || filter === "followup_upcoming" || filter === "followup_missing") {
      const due = banner.metadata?.next_follow_up_at ? new Date(banner.metadata.next_follow_up_at).getTime() : NaN;
      const now = (currentTime ?? 0);
      const upcomingLimit = now + 7 * 24 * 60 * 60 * 1000;
      if (["completed", "rejected"].includes(status)) return false;
      if (filter === "followup_missing") return !Number.isFinite(due);
      if (!Number.isFinite(due)) return false;
      return filter === "followup" ? due <= now : due > now && due <= upcomingLimit;
    }
    if (filter === "active") return isCurrentlyLive(banner);
    if (filter === "scheduled") return isScheduled(banner);
    if (filter === "expired") return isExpired(banner);
    if (filter !== "all" && status !== filter) return false;
    return true;
  });
  const sortedFilteredBanners = [...filteredBanners].sort((a, b) => {
    if (campaignSort === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (campaignSort === "value") {
      const valueOf = (banner: Banner) => {
        const raw = banner.metadata?.commercial_value?.trim() || "";
        const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
        const value = Number(normalized);
        return Number.isFinite(value) && value >= 0 ? value : -1;
      };
      return valueOf(b) - valueOf(a) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    const followUpRank = (banner: Banner) => {
      const status = banner.metadata?.campaign_status || (banner.active ? "active" : "lead");
      if (["completed", "rejected"].includes(status)) return { rank: 3, due: Number.POSITIVE_INFINITY };
      const due = banner.metadata?.next_follow_up_at ? new Date(banner.metadata.next_follow_up_at).getTime() : NaN;
      if (Number.isFinite(due) && due <= (currentTime ?? 0)) return { rank: 0, due };
      if (Number.isFinite(due)) return { rank: 1, due };
      return { rank: 2, due: Number.POSITIVE_INFINITY };
    };
    const left = followUpRank(a);
    const right = followUpRank(b);
    return left.rank - right.rank || left.due - right.due || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const activeCount = banners.filter(isCurrentlyLive).length;
  const followUpDueCount = banners.filter((banner) => {
    const due = banner.metadata?.next_follow_up_at ? new Date(banner.metadata.next_follow_up_at).getTime() : NaN;
    const status = banner.metadata?.campaign_status || (banner.active ? "active" : "lead");
    return Number.isFinite(due) && due <= (currentTime ?? 0) && !["completed", "rejected"].includes(status);
  }).length;
  const followUpUpcomingCount = banners.filter((banner) => {
    const due = banner.metadata?.next_follow_up_at ? new Date(banner.metadata.next_follow_up_at).getTime() : NaN;
    const status = banner.metadata?.campaign_status || (banner.active ? "active" : "lead");
    const now = (currentTime ?? 0);
    return Number.isFinite(due) && due > now && due <= now + 7 * 24 * 60 * 60 * 1000 &&
      !["completed", "rejected"].includes(status);
  }).length;
  const followUpMissingCount = banners.filter((banner) => {
    const due = banner.metadata?.next_follow_up_at ? new Date(banner.metadata.next_follow_up_at).getTime() : NaN;
    const status = banner.metadata?.campaign_status || (banner.active ? "active" : "lead");
    return !Number.isFinite(due) && !["completed", "rejected"].includes(status);
  }).length;
  const scheduledCount = banners.filter((banner) => {
    const now = (currentTime ?? 0);
    return banner.active &&
      !!banner.starts_at &&
      new Date(banner.starts_at).getTime() > now &&
      (!banner.ends_at || new Date(banner.ends_at).getTime() >= now);
  }).length;
  const pendingCount = banners.filter((banner) => banner.metadata?.campaign_type !== "pecatho" && ["lead", "quoted", "approved"].includes(banner.metadata?.campaign_status || "")).length;
  const commercialFunnelStages: { status: NonNullable<BannerMetadata["campaign_status"]>; label: string; count: number }[] = [
    { status: "lead", label: "Contato recebido", count: banners.filter((banner) => banner.metadata?.campaign_type !== "pecatho" && (banner.metadata?.campaign_status || (banner.active ? "active" : "lead")) === "lead").length },
    { status: "quoted", label: "Proposta enviada", count: banners.filter((banner) => banner.metadata?.campaign_type !== "pecatho" && (banner.metadata?.campaign_status || (banner.active ? "active" : "lead")) === "quoted").length },
    { status: "approved", label: "Aprovada", count: banners.filter((banner) => banner.metadata?.campaign_type !== "pecatho" && (banner.metadata?.campaign_status || (banner.active ? "active" : "lead")) === "approved").length },
    { status: "active", label: "Veiculando", count: banners.filter((banner) => banner.metadata?.campaign_type !== "pecatho" && isCurrentlyLive(banner)).length },
    { status: "paused", label: "Pausada", count: banners.filter((banner) => banner.metadata?.campaign_type !== "pecatho" && (banner.metadata?.campaign_status || (banner.active ? "active" : "lead")) === "paused").length },
    { status: "completed", label: "Encerrada", count: banners.filter((banner) => banner.metadata?.campaign_type !== "pecatho" && (banner.metadata?.campaign_status || (banner.active ? "active" : "lead")) === "completed").length },
    { status: "rejected", label: "Recusada", count: banners.filter((banner) => banner.metadata?.campaign_type !== "pecatho" && (banner.metadata?.campaign_status || (banner.active ? "active" : "lead")) === "rejected").length },
  ];
  const commercialValueTotal = banners.reduce((total, banner) => {
    if (banner.metadata?.campaign_type === "pecatho") return total;
    const rawValue = banner.metadata?.commercial_value?.trim();
    if (!rawValue) return total;
    const normalizedValue = rawValue.includes(",")
      ? rawValue.replace(/\./g, "").replace(",", ".")
      : rawValue;
    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) && parsedValue >= 0 ? total + parsedValue : total;
  }, 0);
  const campaignsWithCommercialValue = banners.filter((banner) =>
    banner.metadata?.campaign_type !== "pecatho" &&
    Boolean(banner.metadata?.commercial_value?.trim()) &&
    Number.isFinite(Number(
      banner.metadata?.commercial_value?.includes(",")
        ? banner.metadata.commercial_value.replace(/\./g, "").replace(",", ".")
        : banner.metadata?.commercial_value
    ))
  ).length;
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
        <article className="card"><div className="cardIcon">R$</div><h2>{money(String(commercialValueTotal))}</h2><p>Valor comercial registrado em {campaignsWithCommercialValue} campanhas de anunciantes; não representa recebimentos confirmados</p></article>
        <article className="card"><div className="cardIcon">◷</div><h2>{followUpDueCount} acompanhamentos vencidos</h2><p>Retornos programados para agora ou antes, exceto campanhas encerradas ou recusadas</p></article>
        <article className="card"><div className="cardIcon">↻</div><h2>{followUpUpcomingCount} retornos nos próximos 7 dias</h2><p>Acompanhamentos futuros para organizar a agenda comercial</p></article>
        <article className="card"><div className="cardIcon">!</div><h2>{followUpMissingCount} sem retorno agendado</h2><p>Campanhas abertas que precisam de uma próxima ação comercial definida</p></article>
      </div>
      <section className="authCard" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div><h2 style={{ margin: 0 }}>Funil comercial de anunciantes</h2><p style={{ margin: "6px 0 0", color: "#aeb3c0", fontSize: 13 }}>Selecione uma etapa para abrir a carteira já filtrada. Campanhas próprias do Pecatho não entram nestes números.</p></div>
          <button type="button" className="secondaryButton" onClick={() => { setCampaignTypeFilter("advertiser"); setFilter("all"); }}>Ver todas as negociações</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 145px), 1fr))", gap: 10, marginTop: 16 }}>
          {commercialFunnelStages.map((stage) => <button key={stage.status} type="button" className="secondaryButton" onClick={() => { setCampaignTypeFilter("advertiser"); setFilter(stage.status); }} aria-label={`Filtrar carteira: ${stage.label}, ${stage.count} campanhas`} style={{ display: "grid", gap: 6, textAlign: "left", whiteSpace: "normal", minHeight: 82, alignContent: "center" }}><span style={{ color: "#aeb3c0", fontSize: 12 }}>{stage.label}</span><strong style={{ fontSize: 24, lineHeight: 1.1, color: "#e7c33f" }}>{stage.count}</strong><span style={{ color: "#aeb3c0", fontSize: 11 }}>Ver campanhas →</span></button>)}
        </div>
      </section>
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
            <label>Enviar arte da campanha<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingArtwork} onChange={e => { void uploadArtwork(e.target.files?.[0]); e.currentTarget.value = ""; }} /><small>JPG, PNG ou WebP · até 5 MB. Somente a equipe administrativa pode enviar arquivos.</small></label>
            <label>Ou informar URL pública da imagem<input type="url" value={form.image_path} onChange={e => setForm({ ...form, image_path: e.target.value })} placeholder="https://… (obrigatória para veicular)" /></label>
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
            <label>Próximo contato / retorno<input type="datetime-local" value={form.next_follow_up_at} onChange={e => setForm({ ...form, next_follow_up_at: e.target.value })} /><small style={{ color: "#aeb3c0", fontWeight: 400 }}>Define quando a equipe deve retomar a negociação; não altera o período de veiculação.</small></label>
            <label>Nota do acompanhamento<input maxLength={500} value={form.follow_up_note} onChange={e => setForm({ ...form, follow_up_note: e.target.value })} placeholder="Ex.: cobrar aprovação da proposta" /></label>
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
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}><button type="submit" className="primaryButton" disabled={saving || uploadingArtwork}>{uploadingArtwork ? "Enviando arte…" : saving ? "Salvando…" : form.id ? "Salvar alterações" : "Cadastrar campanha"}</button>{form.id && <button type="button" className="secondaryButton" onClick={() => setForm(emptyForm)}>Cancelar edição</button>}</div>
        </form>
      </section>
      <section className="authCard">
        <div style={{ display: "grid", gap: 12 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><h2 style={{ margin: 0 }}>Carteira de campanhas</h2><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" className="secondaryButton" disabled={filteredBanners.length === 0 || loading} onClick={exportCampaignsCsv}>Exportar CSV ({filteredBanners.length})</button><button type="button" className="secondaryButton" disabled={loading || saving || updatingCampaignId !== null} onClick={() => void loadBanners()}>{loading ? "Atualizando campanhas…" : "Atualizar campanhas"}</button></div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 10 }}><label>Buscar campanha ou anunciante<input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Título, empresa, contato, e-mail…" /></label><label>Tipo de campanha<select value={campaignTypeFilter} onChange={e => setCampaignTypeFilter(e.target.value)}><option value="all">Todos os tipos</option><option value="advertiser">Publicidade de anunciante</option><option value="pecatho">Campanha própria Pecatho</option></select></label><label>Cadastro a partir de<input type="date" value={createdFrom} max={createdTo || undefined} onChange={e => setCreatedFrom(e.target.value)} /></label><label>Cadastro até<input type="date" value={createdTo} min={createdFrom || undefined} onChange={e => setCreatedTo(e.target.value)} /></label><label>Etapa comercial<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todas as etapas</option><option value="active">Veiculando agora</option><option value="scheduled">Programadas (início futuro)</option><option value="expired">Período encerrado</option><option value="followup">Acompanhamento vencido</option><option value="followup_upcoming">Retornos nos próximos 7 dias</option><option value="followup_missing">Sem retorno agendado</option>{Object.entries(statusLabels).filter(([value]) => value !== "active").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Ordenar carteira<select value={campaignSort} onChange={e => setCampaignSort(e.target.value as "priority" | "recent" | "value")}><option value="priority">Prioridade de acompanhamento</option><option value="recent">Mais recentes primeiro</option><option value="value">Maior valor comercial</option></select></label><label>Ordenar carteira<select value={campaignSort} onChange={e => setCampaignSort(e.target.value as "priority" | "recent" | "value")}><option value="priority">Prioridade de acompanhamento</option><option value="recent">Mais recentes primeiro</option><option value="value">Maior valor comercial</option></select></label><label>Posição<select value={placementFilter} onChange={e => setPlacementFilter(e.target.value)}><option value="all">Todas as posições</option><option value="home">Página inicial</option><option value="home_top">Página inicial · superior</option><option value="home_mid">Página inicial · intermediária</option><option value="home_bottom">Página inicial · inferior</option><option value="fans">Pecatho Fans</option><option value="catalog">Catálogo</option></select></label></div><p style={{ margin: 0, color: "#aeb3c0", fontSize: 13 }}>{filteredBanners.length} de {banners.length} campanhas exibidas.</p></div>
        {loading ? <p>Carregando campanhas…</p> : filteredBanners.length === 0 ? <p>Nenhuma campanha encontrada para este filtro.</p> : <div style={{ display: "grid", gap: 14, marginTop: 16 }}>{sortedFilteredBanners.map(banner => {
          const meta = banner.metadata || {};
          const status = meta.campaign_status || (banner.active ? "active" : "lead");
          return <article key={banner.id} style={{ display: "grid", gridTemplateColumns: "minmax(100px,180px) minmax(0,1fr)", gap: 16, padding: 16, border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, background: "rgba(255,255,255,.025)" }}>
            <div style={{ minHeight: 90, borderRadius: 10, overflow: "hidden", background: "#11131a" }}>{banner.image_path && <img src={banner.image_path} alt="" style={{ width: "100%", height: "100%", minHeight: 90, objectFit: "cover" }} />}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><h3 style={{ margin: "0 0 6px", overflowWrap: "anywhere" }}>{banner.title || "Campanha sem título"}</h3><p style={{ margin: "0 0 6px", color: "#aeb3c0" }}>{meta.campaign_type === "pecatho" ? "Campanha própria Pecatho" : "Publicidade de anunciante"} · {campaignDisplayStatus(banner, status)}</p>{(meta.banner_format_preference || readBannerFormatPreference(meta.notes).preference) && <p style={{ margin: "6px 0", color: "#e7c33f", fontSize: 13, fontWeight: 650 }}>Formato solicitado: {bannerFormatPreferenceLabels[(meta.banner_format_preference || readBannerFormatPreference(meta.notes).preference)!]}</p>}<p style={{ margin: 0, color: "#aeb3c0", fontSize: 13 }}>{meta.advertiser_name || "Anunciante não informado"} · Valor combinado: {money(meta.commercial_value)}</p>{meta.budget_estimate && <p style={{ margin: "5px 0 0", color: "#c4c8d1", fontSize: 12 }}>Orçamento estimado informado: {meta.budget_estimate}</p>}<p style={{ margin: "6px 0 0", color: "#8f96a7", fontSize: 12 }}>Posição: {banner.placement || "home"} · Ordem: {banner.sort_order} · {formatDate(banner.starts_at)} a {formatDate(banner.ends_at)}</p>{meta.next_follow_up_at && <p style={{ margin: "6px 0 0", color: new Date(meta.next_follow_up_at).getTime() <= (currentTime ?? 0) && !["completed", "rejected"].includes(status) ? "#ffb4a9" : "#e7c33f", fontSize: 12, fontWeight: 650 }}>Próximo acompanhamento: {new Date(meta.next_follow_up_at).toLocaleString("pt-BR")}{new Date(meta.next_follow_up_at).getTime() <= (currentTime ?? 0) && !["completed", "rejected"].includes(status) ? " · VENCIDO" : ""}{meta.follow_up_note ? " · " + meta.follow_up_note : ""}</p>}{meta.intake_source === "public_advertising_form" && meta.submitted_at && <p style={{ margin: "5px 0 0", color: "#8f96a7", fontSize: 12 }}>Solicitação recebida em: {new Date(meta.submitted_at).toLocaleString("pt-BR")}</p>}</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{meta.next_follow_up_at && <button type="button" className="secondaryButton" disabled={updatingCampaignId === banner.id || saving || loading} onClick={() => void completeFollowUp(banner)}>Concluir acompanhamento</button>}<button type="button" className="secondaryButton" disabled={updatingCampaignId === banner.id || saving} onClick={() => beginEdit(banner)}>Editar</button><button type="button" className="secondaryButton" disabled={updatingCampaignId === banner.id || saving} onClick={() => void duplicateCampaign(banner)}>Duplicar</button><button type="button" className="secondaryButton" disabled={updatingCampaignId === banner.id || saving} onClick={() => void deleteCampaign(banner)}>Excluir</button></div></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}><label style={{ display: "flex", alignItems: "center", gap: 8 }}>Etapa rápida<select disabled={loading || saving || updatingCampaignId !== null} value={status} onChange={e => void setCampaignStatus(banner, e.target.value as NonNullable<BannerMetadata["campaign_status"]>)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{meta.contact_email && <a href={`mailto:${meta.contact_email}`} className="secondaryButton">E-mail</a>}{meta.contact_whatsapp && <a href={`https://wa.me/${meta.contact_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="secondaryButton">WhatsApp</a>}</div>
              <details style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 10 }}>
                <summary style={{ cursor: "pointer", color: "#e7c33f", fontSize: 12, fontWeight: 750 }}>Registrar contato / acompanhamento</summary>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, 200px) minmax(0, 1fr) auto", gap: 8, marginTop: 10, alignItems: "end" }}>
                  <label style={{ display: "grid", gap: 5, fontSize: 12 }}>Tipo
                    <select value={interactionDrafts[banner.id]?.type || "note"} onChange={e => setInteractionDrafts(current => ({ ...current, [banner.id]: { type: e.target.value as NonNullable<BannerMetadata["commercial_interaction_history"]>[number]["type"], summary: current[banner.id]?.summary || "" } }))}>
                      <option value="call">Ligação</option><option value="email">E-mail</option><option value="whatsapp">WhatsApp</option><option value="meeting">Reunião</option><option value="note">Nota / próximo passo</option>
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 5, fontSize: 12 }}>Resumo do contato ou próximo passo
                    <input maxLength={1000} value={interactionDrafts[banner.id]?.summary || ""} onChange={e => setInteractionDrafts(current => ({ ...current, [banner.id]: { type: current[banner.id]?.type || "note", summary: e.target.value } }))} placeholder="Ex.: proposta enviada; retornar na sexta-feira" />
                  </label>
                  <button type="button" className="secondaryButton" disabled={updatingCampaignId === banner.id || saving || loading} onClick={() => void logCommercialInteraction(banner)}>Registrar</button>
                </div>
              </details>
              {Array.isArray(meta.commercial_interaction_history) && meta.commercial_interaction_history.length > 0 && <details style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 10 }}>
                <summary style={{ cursor: "pointer", color: "#e7c33f", fontSize: 12, fontWeight: 750 }}>Histórico de contatos ({meta.commercial_interaction_history.length})</summary>
                <ol style={{ display: "grid", gap: 8, margin: "10px 0 0", paddingLeft: 20 }}>
                  {[...meta.commercial_interaction_history].slice(-20).reverse().map((entry, index) => <li key={entry.created_at + "-" + index} style={{ color: "#c4c8d1", fontSize: 12, lineHeight: 1.55 }}>
                    <strong>{{ call: "Ligação", email: "E-mail", whatsapp: "WhatsApp", meeting: "Reunião", note: "Nota" }[entry.type] || "Interação"}</strong>
                    {" · "}{new Date(entry.created_at).toLocaleString("pt-BR")}
                    {entry.created_by ? " · " + entry.created_by : ""}
                    <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{entry.summary}</div>
                  </li>)}
                </ol>
              </details>}
              {Array.isArray(meta.campaign_status_history) && meta.campaign_status_history.length > 0 && <details style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 10 }}>
                <summary style={{ cursor: "pointer", color: "#e7c33f", fontSize: 12, fontWeight: 750 }}>Histórico comercial ({meta.campaign_status_history.length})</summary>
                <ol style={{ display: "grid", gap: 8, margin: "10px 0 0", paddingLeft: 20 }}>
                  {[...meta.campaign_status_history].slice(-10).reverse().map((entry, index) => <li key={entry.changed_at + "-" + index} style={{ color: "#c4c8d1", fontSize: 12, lineHeight: 1.55 }}>
                    <strong>{statusLabels[entry.to as NonNullable<BannerMetadata["campaign_status"]>] || entry.to}</strong>
                    {" · de "}{statusLabels[entry.from as NonNullable<BannerMetadata["campaign_status"]>] || entry.from}
                    {" · "}{new Date(entry.changed_at).toLocaleString("pt-BR")}
                    {entry.changed_by ? " · " + entry.changed_by : ""}
                  </li>)}
                </ol>
              </details>}
              {readBannerFormatPreference(meta.notes).notes && <p style={{ margin: "10px 0 0", color: "#c4c8d1", whiteSpace: "pre-wrap" }}>{readBannerFormatPreference(meta.notes).notes}</p>}
            </div>
          </article>;
        })}</div>}
      </section>
    </section>
  </main>;
}
