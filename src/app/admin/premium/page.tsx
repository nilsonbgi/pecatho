"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type PremiumPlan = {
  id: string;
  plan_key: string;
  name: string;
  description: string | null;
  price: number | string;
  currency: string;
  duration_days: number;
  benefits: string[] | null;
  active: boolean;
  sort_order: number;
  updated_at: string;
  audience: "customer" | "companion" | "content_creator";
  feature_flags: Record<string, boolean> | null;
  card_style: "standard" | "gold" | "obsidian" | "signature";
  badge_label: string | null;
};

type PlanAudience = "customer" | "companion" | "content_creator";
type FeatureFlags = { private_seller_contact: boolean; featured_card: boolean; search_priority: boolean; premium_profile: boolean; profile_badge: boolean };
const defaultFeatures = (audience: PlanAudience): FeatureFlags => ({ private_seller_contact: audience === "customer", featured_card: false, search_priority: false, premium_profile: false, profile_badge: false });

type PublicationPlan = {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  price: number | string;
  currency: string;
  active: boolean;
  free: boolean;
  has_video: boolean;
  features: Record<string, unknown> | null;
  audience: "companion" | "content_seller" | "both";
  featured_card: boolean;
  search_priority: number;
  show_premium_badge: boolean;
  profile_theme: "standard" | "highlighted" | "premium";
  max_gallery_items: number | null;
  updated_at: string;
};

export default function AdminCustomerPremiumPage() {
  const supabase = createClient();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [planKey, setPlanKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [benefitsText, setBenefitsText] = useState("");
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState<PlanAudience | "all">("all");
  const [audience, setAudience] = useState<PlanAudience>("customer");
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(defaultFeatures("customer"));
  const [cardStyle, setCardStyle] = useState<"standard" | "gold" | "obsidian" | "signature">("standard");
  const [badgeLabel, setBadgeLabel] = useState("Perfil Premium");
  const [sortOrder, setSortOrder] = useState("0");
  const [managementArea, setManagementArea] = useState<"publication" | "customer">("publication");
  const [publicationPlans, setPublicationPlans] = useState<PublicationPlan[]>([]);
  const [editingPublicationId, setEditingPublicationId] = useState<string | null>(null);
  const [publicationAudience, setPublicationAudience] = useState<"companion" | "content_seller" | "both">("companion");
  const [publicationName, setPublicationName] = useState("");
  const [publicationDescription, setPublicationDescription] = useState("");
  const [publicationPrice, setPublicationPrice] = useState("");
  const [publicationDuration, setPublicationDuration] = useState("30");
  const [publicationActive, setPublicationActive] = useState(false);
  const [publicationFree, setPublicationFree] = useState(false);
  const [publicationHasVideo, setPublicationHasVideo] = useState(false);
  const [publicationFeatured, setPublicationFeatured] = useState(false);
  const [publicationSearchPriority, setPublicationSearchPriority] = useState("0");
  const [publicationBadge, setPublicationBadge] = useState(false);
  const [publicationTheme, setPublicationTheme] = useState<"standard" | "highlighted" | "premium">("standard");
  const [publicationMaxGalleryItems, setPublicationMaxGalleryItems] = useState("");
  const [publicationBusy, setPublicationBusy] = useState(false);
  const publicationActiveCount = publicationPlans.filter((plan) => plan.active).length;
  const activeCount = plans.filter((plan) => plan.active).length;
  const inactiveCount = plans.length - activeCount;
  const filteredPlans = plans.filter((plan) => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const statusMatches = statusFilter === "all" || (statusFilter === "active" ? plan.active : !plan.active);
    const audienceMatches = audienceFilter === "all" || plan.audience === audienceFilter;
    const searchable = [plan.name, plan.plan_key, plan.description ?? "", ...(plan.benefits ?? []), plan.audience].join(" ").toLocaleLowerCase("pt-BR");
    return statusMatches && audienceMatches && (!term || searchable.includes(term));
  });

  async function load() {
    setLoadingPlans(true);
    try {
      const [{ data, error: loadError }, { data: publicationData, error: publicationError }] = await Promise.all([
        supabase.from("pecatho_customer_premium_plans")
          .select("id,plan_key,name,description,price,currency,duration_days,benefits,active,sort_order,updated_at,audience,feature_flags,card_style,badge_label")
          .order("sort_order", { ascending: true }).order("price", { ascending: true }),
        supabase.from("publication_plans")
          .select("id,name,description,duration_days,price,currency,active,free,has_video,features,audience,featured_card,search_priority,show_premium_badge,profile_theme,max_gallery_items,updated_at")
          .order("audience", { ascending: true }).order("price", { ascending: true }),
      ]);
      if (loadError) throw loadError;
      if (publicationError) throw publicationError;
      setPlans((data ?? []) as PremiumPlan[]);
      setPublicationPlans((publicationData ?? []) as PublicationPlan[]);
    } finally {
      setLoadingPlans(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) { setAuthorized(false); return; }
      const { data: role } = await supabase.from("user_roles").select("role")
        .eq("user_id", user.id).in("role", ["super_admin", "admin"]).limit(1).maybeSingle();
      if (!mounted) return;
      setAuthorized(Boolean(role));
      if (role) {
        try { await load(); } catch { if (mounted) setError("Não foi possível carregar os planos. Confirme se as migrações do Premium foram aplicadas."); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  function edit(plan: PremiumPlan) {
    setEditingId(plan.id);
    setPlanKey(plan.plan_key);
    setName(plan.name);
    setDescription(plan.description ?? "");
    setPrice(String(plan.price).replace(".", ","));
    setDurationDays(String(plan.duration_days));
    setBenefitsText((plan.benefits ?? []).join("\n"));
    setActive(plan.active);
    setAudience(plan.audience ?? "customer");
    setFeatureFlags({ ...defaultFeatures(plan.audience ?? "customer"), ...(plan.feature_flags ?? {}) });
    setCardStyle(plan.card_style ?? "standard");
    setBadgeLabel(plan.badge_label ?? "Perfil Premium");
    setSortOrder(String(plan.sort_order ?? 0));
    setError("");
    setMessage("");
  }

  function reset() {
    setEditingId(null);
    setPlanKey("");
    setName("");
    setDescription("");
    setPrice("");
    setDurationDays("30");
    setBenefitsText("");
    setActive(false);
    setAudience("customer");
    setFeatureFlags(defaultFeatures("customer"));
    setCardStyle("standard");
    setBadgeLabel("Perfil Premium");
    setSortOrder("0");
    setError("");
    setMessage("");
  }

  function editPublication(plan: PublicationPlan) {
    setEditingPublicationId(plan.id);
    setPublicationAudience(plan.audience);
    setPublicationName(plan.name);
    setPublicationDescription(plan.description ?? "");
    setPublicationPrice(String(plan.price).replace(".", ","));
    setPublicationDuration(String(plan.duration_days));
    setPublicationActive(plan.active);
    setPublicationFree(plan.free);
    setPublicationHasVideo(plan.has_video);
    setPublicationFeatured(plan.featured_card);
    setPublicationSearchPriority(String(plan.search_priority));
    setPublicationBadge(plan.show_premium_badge);
    setPublicationTheme(plan.profile_theme);
    setPublicationMaxGalleryItems(plan.max_gallery_items == null ? "" : String(plan.max_gallery_items));
    setError("");
    setMessage("");
  }

  function resetPublication() {
    setEditingPublicationId(null);
    setPublicationAudience("companion");
    setPublicationName("");
    setPublicationDescription("");
    setPublicationPrice("");
    setPublicationDuration("30");
    setPublicationActive(false);
    setPublicationFree(false);
    setPublicationHasVideo(false);
    setPublicationFeatured(false);
    setPublicationSearchPriority("0");
    setPublicationBadge(false);
    setPublicationTheme("standard");
    setPublicationMaxGalleryItems("");
  }

  async function savePublication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublicationBusy(true);
    setError("");
    setMessage("");
    const parsedPrice = publicationFree ? 0 : Number(publicationPrice.trim().replace(/\\s/g, "").replace(",", "."));
    try {
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0 || (!publicationFree && parsedPrice <= 0)) throw new Error("Informe um preço válido para o plano.");
      const { error: saveError } = await supabase.rpc("admin_save_pecatho_publication_plan", {
        p_plan_id: editingPublicationId,
        p_name: publicationName.trim(),
        p_description: publicationDescription.trim() || null,
        p_duration_days: Number(publicationDuration),
        p_price: parsedPrice,
        p_active: publicationActive,
        p_free: publicationFree,
        p_audience: publicationAudience,
        p_has_video: publicationHasVideo,
        p_featured_card: publicationFeatured,
        p_search_priority: Number(publicationSearchPriority),
        p_show_premium_badge: publicationBadge,
        p_profile_theme: publicationTheme,
        p_max_gallery_items: publicationMaxGalleryItems.trim() === "" ? null : Number(publicationMaxGalleryItems),
        p_features: editingPublicationId ? publicationPlans.find((plan) => plan.id === editingPublicationId)?.features ?? {} : {},
      });
      if (saveError) throw saveError;
      setMessage(publicationActive ? "Plano de publicação salvo e ativado. Os diferenciais serão aplicados às publicações válidas." : "Plano de publicação salvo como inativo.");
      resetPublication();
      await load();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      setError(raw.includes("ADMIN_REQUIRED") ? "Seu usuário não tem permissão para administrar os planos."
        : raw.includes("INVALID_PLAN_AUDIENCE") ? "Selecione um público válido."
        : raw.includes("INVALID_SEARCH_PRIORITY") ? "A prioridade deve estar entre 0 e 100."
        : raw.includes("INVALID_PROFILE_THEME") ? "Selecione um estilo de perfil válido."
        : raw.includes("FREE_PLAN_PRICE_MUST_BE_ZERO") ? "Planos gratuitos devem ter preço zero."
        : raw.includes("PAID_PLAN_PRICE_REQUIRED") ? "Planos pagos precisam ter preço maior que zero."
        : raw.includes("INVALID_PLAN_DURATION") ? "Selecione uma periodicidade válida: mensal (30), trimestral (90), semestral (180) ou anual (365 dias)."
        : raw.includes("INVALID_PLAN_PRICE") ? "O preço não pode ultrapassar R$ 100.000,00."
        : raw.includes("admin_save_pecatho_publication_plan") || raw.includes("schema cache") ? "A migration de diferenciais dos planos de publicação precisa estar aplicada no Supabase."
        : "Não foi possível salvar o plano de publicação. Revise os campos e a configuração do banco.");
    } finally {
      setPublicationBusy(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const parsedPrice = Number(price.trim().replace(/\s/g, "").replace(",", "."));
    const benefits = benefitsText.split("\n").map((item) => item.trim()).filter(Boolean);
    try {
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) throw new Error("Informe um preço maior que zero.");
      const { error: rpcError } = await supabase.rpc("admin_save_pecatho_customer_premium_plan", {
        p_plan_id: editingId,
        p_plan_key: planKey.trim().toLowerCase(),
        p_name: name.trim(),
        p_description: description.trim() || null,
        p_price: parsedPrice,
        p_duration_days: Number(durationDays),
        p_benefits: benefits,
        p_active: active,
        p_audience: audience,
        p_feature_flags: featureFlags,
        p_card_style: cardStyle,
        p_badge_label: featureFlags.profile_badge ? badgeLabel.trim() : null,
        p_sort_order: Math.max(0, Number.parseInt(sortOrder, 10) || 0),
      });
      if (rpcError) throw rpcError;
      setMessage(active ? `Plano salvo e publicado para ${audience === "customer" ? "clientes Premium" : audience === "companion" ? "acompanhantes" : "vendedores de conteúdo"}.` : "Plano salvo como inativo; ele não aparece no catálogo do público selecionado.");
      reset();
      await load();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      setError(raw.includes("ADMIN_REQUIRED") ? "Seu usuário não tem permissão para administrar o Premium."
        : raw.includes("INVALID_PLAN_KEY") ? "A chave deve usar 2 a 50 caracteres: letras minúsculas, números, hífen ou sublinhado."
        : raw.includes("INVALID_PLAN_PRICE") ? "O preço deve ser maior que zero e não ultrapassar R$ 10.000,00."
        : raw.includes("INVALID_PLAN_AUDIENCE") ? "Selecione um público válido para o plano."
        : raw.includes("INVALID_PLAN_DURATION") ? "Selecione uma duração válida: mensal, trimestral, semestral ou anual."
        : raw.includes("PLAN_AUDIENCE_LOCKED") ? "O público deste plano não pode ser alterado porque já existem assinaturas vinculadas."
        : raw.includes("PREMIUM_PLAN_NEEDS_OPERATIONAL_FEATURE") ? "Um plano publicado precisa ter ao menos um diferencial operacional habilitado para esse público."
        : raw.includes("PREMIUM_BADGE_LABEL_REQUIRED") ? "Informe o texto do selo Premium."
        : raw.includes("INVALID_PLAN_FEATURE_FLAGS") || raw.includes("CUSTOMER_FEATURE_ONLY") || raw.includes("PROFESSIONAL_FEATURE_ONLY") ? "Revise os diferenciais selecionados para o público deste plano."
        : raw.includes("INVALID_PLAN_BENEFITS") || raw.includes("INVALID_PLAN_BENEFIT_ITEM") || raw.includes("INVALID_PLAN_BENEFIT") ? "Revise os benefícios: cada linha deve conter de 1 a 240 caracteres, com até 20 itens."
        : raw.includes("PREMIUM_PLAN_NOT_FOUND") ? "O plano selecionado não foi encontrado. Atualize a lista e tente novamente."
        : raw.includes("duplicate key") ? "Já existe um plano com essa chave."
        : raw.includes("admin_save_pecatho_customer_premium_plan") || raw.includes("schema cache") || raw.includes("Could not find the function") ? "A função administrativa do Premium não está disponível no banco. A migration supabase/migrations/20261014153000_customer_premium_admin_catalog.sql precisa estar aplicada no Supabase."
        : raw.includes("permission denied") || raw.includes("insufficient_privilege") ? "O banco recusou a operação por permissão. Verifique a função administrativa e as permissões do papel autenticado."
        : "Não foi possível salvar o plano. Confira os campos e a configuração administrativa do banco.");
    } finally {
      setBusy(false);
    }
  }

  if (authorized === null) return <main className="shell"><section className="card"><p>Validando acesso administrativo...</p></section></main>;
  if (!authorized) return <main className="shell"><section className="card"><h1>Acesso restrito</h1><p>Esta área é exclusiva para administradores do Pecatho.</p><Link href="/login" className="primaryButton">Entrar</Link></section></main>;

  return (
    <main className="shell advertiserDashboard premiumAdminDashboard">
      <nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><div className="navLinks"><Link href="/admin">Administração</Link><Link href="/painel/cliente">Painel do cliente</Link></div></nav>
      <section className="hero premiumAdminHero">
        <div className="eyebrow">SUPERADMIN · GESTÃO COMERCIAL</div>
        <h1>Planos <em>Premium</em></h1>
        <p className="heroCopy">Configure preço, duração e benefícios antes de publicar. Planos inativos não são exibidos aos clientes. A ativação da assinatura depende exclusivamente da confirmação de pagamento recebida e validada pelo webhook do Mercado Pago.</p>
        {error && <p role="alert" className="fieldNote" style={{ border: "1px solid rgba(239,68,68,.35)", padding: 12, borderRadius: 12 }}>{error}</p>}
        {message && <p role="status" className="fieldNote" style={{ border: "1px solid rgba(34,197,94,.35)", padding: 12, borderRadius: 12 }}>{message}</p>}
        <nav className="premiumAdminTabs" aria-label="Categorias de planos">
          <button type="button" className={managementArea === "publication" ? "active" : ""} aria-pressed={managementArea === "publication"} onClick={() => { setManagementArea("publication"); setError(""); setMessage(""); }}>Planos de anunciantes <small>Acompanhantes e vendedores de conteúdo</small></button>
          <button type="button" className={managementArea === "customer" ? "active" : ""} aria-pressed={managementArea === "customer"} onClick={() => { setManagementArea("customer"); setError(""); setMessage(""); }}>Assinaturas Premium <small>Clientes · mensal, trimestral, semestral e anual</small></button>
        </nav>
        {managementArea === "publication" && <>
        <section className="pillars premiumAdminMetrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", margin: "26px 0 18px" }} aria-label="Resumo dos planos de publicação">
          <article className="card" style={{ minHeight: 0 }}><div className="eyebrow">PLANOS DE ANUNCIANTES</div><h2 style={{ marginTop: 0, fontSize: 30 }}>{publicationPlans.length}</h2><p>Planos configurados para os dois públicos</p></article>
          <article className="card" style={{ minHeight: 0 }}><div className="eyebrow">ATIVOS</div><h2 style={{ marginTop: 0, fontSize: 30, color: "#86efac" }}>{publicationActiveCount}</h2><p>Podem ser selecionados em fluxos compatíveis</p></article>
          <article className="card" style={{ minHeight: 0 }}><div className="eyebrow">COM DIFERENCIAIS</div><h2 style={{ marginTop: 0, fontSize: 30 }}>{publicationPlans.filter((plan) => plan.active && (plan.featured_card || plan.search_priority > 0 || plan.show_premium_badge || plan.profile_theme !== "standard")).length}</h2><p>Card especial, prioridade e estilo de perfil</p></article>
        </section>
        <section className="card premiumAdminEditor" id="editor-publicacao">
          <h2>{editingPublicationId ? "Editar plano de publicação" : "Criar plano de publicação"}</h2>
          <p className="fieldNote">Configure diferenciais comerciais para acompanhantes e vendedores de conteúdo. Card especial, prioridade de busca e identidade visual só são aplicados enquanto a publicação vinculada estiver vigente.</p>
          <form onSubmit={(event) => void savePublication(event)} className="premiumAdminForm">
            <label>Público do plano<select required value={publicationAudience} onChange={(event) => setPublicationAudience(event.target.value as "companion" | "content_seller" | "both")}><option value="companion">Acompanhantes</option><option value="content_seller">Vendedores de conteúdo</option><option value="both">Ambos os públicos</option></select></label>
            <label>Nome comercial<input required minLength={3} maxLength={100} value={publicationName} onChange={(event) => setPublicationName(event.target.value)} placeholder="Destaque Premium" /></label>
            <label>Descrição<textarea rows={2} maxLength={500} value={publicationDescription} onChange={(event) => setPublicationDescription(event.target.value)} placeholder="Descreva o que diferencia este plano." /></label>
            <div className="pillars"><label>Preço em reais<input required inputMode="decimal" value={publicationFree ? "0,00" : publicationPrice} disabled={publicationFree} onChange={(event) => setPublicationPrice(event.target.value)} placeholder="49,90" /></label><label>Duração em dias<input required type="number" min={1} max={365} value={publicationDuration} onChange={(event) => setPublicationDuration(event.target.value)} /></label></div>
            <label>Prioridade nas pesquisas (0–100)<input required type="number" min={0} max={100} value={publicationSearchPriority} onChange={(event) => setPublicationSearchPriority(event.target.value)} /><small>Quanto maior o valor, maior a prioridade entre perfis com o mesmo filtro. Planos em destaque aparecem antes dos demais.</small></label>
            <label>Estilo do perfil<select value={publicationTheme} onChange={(event) => setPublicationTheme(event.target.value as "standard" | "highlighted" | "premium")}><option value="standard">Padrão</option><option value="highlighted">Destaque visual</option><option value="premium">Premium</option></select></label>
            <label>Limite de itens na galeria (opcional)<input type="number" min={1} max={500} step={1} value={publicationMaxGalleryItems} onChange={(event) => setPublicationMaxGalleryItems(event.target.value)} placeholder="Sem limite adicional" /><small>Deixe vazio para não aplicar limite específico. Valores permitidos: 1 a 500 itens.</small></label>
            <label className="premiumAdminCheck"><input type="checkbox" checked={publicationFree} onChange={(event) => { setPublicationFree(event.target.checked); if (event.target.checked) setPublicationPrice("0,00"); else if (publicationPrice === "0,00") setPublicationPrice(""); }} /> Plano gratuito</label>
            <label className="premiumAdminCheck"><input type="checkbox" checked={publicationActive} onChange={(event) => setPublicationActive(event.target.checked)} /> Plano ativo</label>
            <label className="premiumAdminCheck"><input type="checkbox" checked={publicationFeatured} onChange={(event) => setPublicationFeatured(event.target.checked)} /> Card especial com destaque visual</label>
            <label className="premiumAdminCheck"><input type="checkbox" checked={publicationBadge} onChange={(event) => setPublicationBadge(event.target.checked)} /> Exibir selo Premium no card</label>
            <label className="premiumAdminCheck"><input type="checkbox" checked={publicationHasVideo} onChange={(event) => setPublicationHasVideo(event.target.checked)} /> Permitir vídeo conforme o plano</label>
            <div className="premiumAdminFormActions"><button className="primaryButton" type="submit" disabled={publicationBusy}>{publicationBusy ? "Salvando…" : editingPublicationId ? "Salvar alterações" : "Criar plano"}</button>{editingPublicationId && <button className="secondaryButton" type="button" disabled={publicationBusy} onClick={resetPublication}>Cancelar edição</button>}</div>
          </form>
        </section>
        <section className="card premiumAdminCatalog" id="catalogo-publicacao">
          <div className="premiumAdminSectionHeader"><h2>Planos de acompanhantes e vendedores</h2><button type="button" className="secondaryButton" disabled={loadingPlans} onClick={() => void load()}>{loadingPlans ? "Atualizando…" : "Atualizar catálogo"}</button></div>
          {publicationPlans.length === 0 ? <p className="fieldNote">Nenhum plano de publicação cadastrado. Crie o primeiro plano acima.</p> : <div className="financeHistory">{publicationPlans.map((plan) => <article key={plan.id}><div><strong>{plan.name}</strong><small>{plan.audience === "companion" ? "Acompanhantes" : plan.audience === "content_seller" ? "Vendedores de conteúdo" : "Ambos os públicos"} · {plan.duration_days} dias · {plan.free ? "Gratuito" : Number(plan.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</small><small>{plan.featured_card ? "Card especial" : "Card padrão"} · prioridade {plan.search_priority} · perfil {plan.profile_theme === "premium" ? "Premium" : plan.profile_theme === "highlighted" ? "Destaque" : "padrão"}{plan.show_premium_badge ? " · selo Premium" : ""}{plan.has_video ? " · vídeo habilitado" : ""}{plan.max_gallery_items != null ? ` · galeria até ${plan.max_gallery_items} itens` : ""}</small><small>{plan.description || "Sem descrição"}</small>{(plan.free && Number(plan.price) !== 0) || (!plan.free && Number(plan.price) <= 0) ? <small style={{ color: "#fca5a5", fontWeight: 800 }}>Configuração comercial inválida: ajuste o preço ou marque como gratuito antes de disponibilizar.</small> : null}</div><span className="financeStatus">{plan.active ? "Ativo" : "Inativo"}</span><button className="secondaryButton" type="button" onClick={() => editPublication(plan)}>Editar</button></article>)}</div>}
        </section>
        </>}
        {managementArea === "customer" && <>
        <section className="pillars premiumAdminMetrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", margin: "26px 0 18px" }} aria-label="Resumo do catálogo">
          <article className="card" style={{ minHeight: 0 }}><div className="eyebrow">CATÁLOGO</div><h2 style={{ marginTop: 0, fontSize: 30 }}>{plans.length}</h2><p>Planos cadastrados</p></article>
          <article className="card" style={{ minHeight: 0 }}><div className="eyebrow">PUBLICADOS</div><h2 style={{ marginTop: 0, fontSize: 30, color: "#86efac" }}>{activeCount}</h2><p>Disponíveis no catálogo, conforme as regras da plataforma</p></article>
          <article className="card" style={{ minHeight: 0 }}><div className="eyebrow">INATIVOS</div><h2 style={{ marginTop: 0, fontSize: 30 }}>{inactiveCount}</h2><p>Preservados para edição ou republicação</p></article>
        </section>
        <section className="premiumAdminCustomerPlans">
        <section className="card premiumAdminEditor" id="editor">
          <h2>{editingId ? "Editar plano" : "Cadastrar novo plano"}</h2>
          <div className="premiumAudienceTabs" role="group" aria-label="Público do plano">{([{value:"customer",label:"Clientes Premium"},{value:"companion",label:"Acompanhantes"},{value:"content_creator",label:"Vendedores de conteúdo"}] as const).map((item) => <button key={item.value} type="button" className={audience === item.value ? "primaryButton" : "secondaryButton"} onClick={() => { if (audience !== item.value) { setAudience(item.value); setFeatureFlags(defaultFeatures(item.value)); } }} aria-pressed={audience === item.value}>{item.label}</button>)}</div>
          <form onSubmit={(event) => void save(event)} style={{ display: "grid", gap: 14 }}>
            <label>Chave única do plano<input required minLength={2} maxLength={50} pattern="[a-z0-9][a-z0-9_-]{1,49}" value={planKey} onChange={(event) => setPlanKey(event.target.value)} placeholder="premium-mensal" /></label>
            <label>Nome comercial<input required minLength={3} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder={audience === "customer" ? "Premium mensal" : audience === "companion" ? "Destaque para acompanhante" : "Perfil Creator Premium"} /></label>
            <label>Descrição<textarea rows={2} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explique a proposta do plano." /></label>
            <div className="pillars">
              <label>Preço em reais<input required inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="19,90" /></label>
              <label>Periodicidade da assinatura<select required value={durationDays} onChange={(event) => setDurationDays(event.target.value)}><option value="30">Mensal · 30 dias</option><option value="90">Trimestral · 90 dias</option><option value="180">Semestral · 180 dias</option><option value="365">Anual · 365 dias</option></select></label>
            </div>
            <label>Detalhamento comercial dos diferenciais (um por linha)<textarea rows={4} maxLength={5000} value={benefitsText} onChange={(event) => setBenefitsText(event.target.value)} placeholder={audience === "customer" ? "Contato privado com vendedores de conteúdo\nAcesso durante o período contratado" : "Card com destaque visual\nPrioridade no catálogo de descoberta"} /></label>
            <p className="fieldNote">Texto livre é apenas descritivo. Somente os diferenciais operacionais habilitados abaixo são concedidos pela plataforma.</p>
            <section className="premiumEntitlementEditor" aria-label="Diferenciais operacionais"><div className="eyebrow">DIFERENCIAIS OPERACIONAIS</div>
              {audience === "customer" ? <label className="premiumFeatureToggle"><input type="checkbox" checked={featureFlags.private_seller_contact} onChange={(event) => setFeatureFlags((old) => ({...old, private_seller_contact:event.target.checked}))} /><span><strong>Contato privado com vendedores de conteúdo</strong><small>Libera o contato Premium durante a vigência da assinatura.</small></span></label> : <>
                <label className="premiumFeatureToggle"><input type="checkbox" checked={featureFlags.featured_card} onChange={(event) => setFeatureFlags((old) => ({...old, featured_card:event.target.checked}))} /><span><strong>Card especial em destaque</strong><small>Aplica moldura e identificação visual Premium nos cards públicos.</small></span></label>
                <label className="premiumFeatureToggle"><input type="checkbox" checked={featureFlags.search_priority} onChange={(event) => setFeatureFlags((old) => ({...old, search_priority:event.target.checked}))} /><span><strong>Prioridade nas pesquisas</strong><small>Prioriza o perfil nas listagens padrão de descoberta.</small></span></label>
                <label className="premiumFeatureToggle"><input type="checkbox" checked={featureFlags.premium_profile} onChange={(event) => setFeatureFlags((old) => ({...old, premium_profile:event.target.checked}))} /><span><strong>Perfil diferenciado</strong><small>Aplica identidade visual Premium no perfil público.</small></span></label>
                <label className="premiumFeatureToggle"><input type="checkbox" checked={featureFlags.profile_badge} onChange={(event) => setFeatureFlags((old) => ({...old, profile_badge:event.target.checked}))} /><span><strong>Selo personalizado</strong><small>Mostra selo configurável no card e no perfil.</small></span></label>
                {featureFlags.profile_badge && <label>Texto do selo<input required minLength={2} maxLength={32} value={badgeLabel} onChange={(event) => setBadgeLabel(event.target.value)} placeholder="Perfil Premium" /></label>}
                <label>Estilo visual<select value={cardStyle} onChange={(event) => setCardStyle(event.target.value as "standard" | "gold" | "obsidian" | "signature")}><option value="standard">Padrão</option><option value="gold">Dourado</option><option value="obsidian">Ônix</option><option value="signature">Signature</option></select></label>
              </>}
            </section>
            <div className="pillars"><label>Ordem de exibição<input type="number" min={0} max={100000} value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} /></label><label style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Publicar para o público selecionado</label></div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="primaryButton" type="submit" disabled={busy}>{busy ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar plano"}</button>
              {editingId && <button className="secondaryButton" type="button" disabled={busy} onClick={reset}>Cancelar edição</button>}
            </div>
          </form>
        </section>
        <section className="card premiumAdminCatalog" id="catalogo">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><h2>Planos cadastrados</h2><button type="button" className="secondaryButton" disabled={loadingPlans} onClick={() => void load()}>{loadingPlans ? "Atualizando…" : "Atualizar catálogo"}</button></div>
          <div className="premiumAudienceTabs" role="group" aria-label="Filtrar catálogo por público">{([{value:"all",label:"Todos"},{value:"customer",label:"Clientes Premium"},{value:"companion",label:"Acompanhantes"},{value:"content_creator",label:"Vendedores de conteúdo"}] as const).map((item) => <button key={item.value} type="button" className={audienceFilter === item.value ? "primaryButton" : "secondaryButton"} onClick={() => setAudienceFilter(item.value)} aria-pressed={audienceFilter === item.value}>{item.label}</button>)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(130px, 180px)", gap: 10, margin: "16px 0" }}>
            <input aria-label="Buscar planos" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, chave ou benefício" style={{ minWidth: 0, width: "100%", background: "#0b0d12", color: "#f6f7fb", border: "1px solid rgba(255,255,255,.14)", borderRadius: 10, padding: "12px 14px" }} />
            <select aria-label="Filtrar por status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")} style={{ minWidth: 0, background: "#0b0d12", color: "#f6f7fb", border: "1px solid rgba(255,255,255,.14)", borderRadius: 10, padding: "12px" }}><option value="all">Todos os status</option><option value="active">Publicados</option><option value="inactive">Inativos</option></select>
          </div>
          {filteredPlans.length === 0 ? <div className="fieldNote" style={{ padding: "20px 0" }}><strong>{plans.length ? "Nenhum plano corresponde aos filtros." : "Nenhum plano configurado."}</strong><p>{plans.length ? "Altere a busca ou o status selecionado." : "Cadastre preço, duração e benefícios antes de disponibilizar a contratação."}</p>{(search || statusFilter !== "all") && <button type="button" className="secondaryButton" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Limpar filtros</button>}</div> : <div className="financeHistory">{filteredPlans.map((plan) => <article key={plan.id}>
            <div><strong>{plan.name}</strong><small>{plan.plan_key} · {plan.duration_days === 30 ? "Mensal" : plan.duration_days === 90 ? "Trimestral" : plan.duration_days === 180 ? "Semestral" : plan.duration_days === 365 ? "Anual" : `${plan.duration_days} dias`} · {Number(plan.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</small><small>{plan.description || "Sem descrição"}</small>{plan.benefits?.length ? <small style={{ display: "block", marginTop: 8, lineHeight: 1.6 }}>Benefícios: {plan.benefits.slice(0, 3).join(" · ")}{plan.benefits.length > 3 ? " · +" + (plan.benefits.length - 3) : ""}</small> : <small style={{ display: "block", marginTop: 8 }}>Sem benefícios cadastrados</small>}</div>
            <span className="financeStatus">{plan.active ? "Publicado" : "Inativo"}</span>
            <button className="secondaryButton" type="button" onClick={() => edit(plan)}>Editar</button>
          </article>)}</div>}
        </section>
        </section>
        </>}
      </section>
    </main>
  );
}
