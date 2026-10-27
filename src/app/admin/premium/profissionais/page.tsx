"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Audience = "companion" | "content_creator";
type CardStyle = "standard" | "gold" | "obsidian" | "signature";
type Plan = {
  id: string; plan_key: string; name: string; description: string | null; price: number | string;
  duration_days: number; benefits: string[] | null; active: boolean; sort_order: number;
  audience: "customer" | Audience; feature_flags: Record<string, boolean> | null;
  card_style: CardStyle; badge_label: string | null;
};

const money = (v: number | string) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminProfessionalPremiumPage() {
  const supabase = useMemo(() => createClient(), []);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [audience, setAudience] = useState<Audience>("companion");
  const [planKey, setPlanKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [benefits, setBenefits] = useState("");
  const [active, setActive] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [priority, setPriority] = useState(false);
  const [profile, setProfile] = useState(false);
  const [badge, setBadge] = useState(false);
  const [cardStyle, setCardStyle] = useState<CardStyle>("gold");
  const [badgeLabel, setBadgeLabel] = useState("Premium");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase.from("pecatho_customer_premium_plans")
      .select("id,plan_key,name,description,price,duration_days,benefits,active,sort_order,audience,feature_flags,card_style,badge_label")
      .in("audience", ["companion", "content_creator"]).order("sort_order", { ascending: true }).order("price", { ascending: true });
    if (loadError) setError("Não foi possível carregar os planos. Confirme se a migration de diferenciais Premium foi aplicada.");
    else setPlans((data ?? []) as Plan[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) { setAuthorized(false); setLoading(false); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["super_admin", "admin"]).limit(1).maybeSingle();
      if (!mounted) return;
      setAuthorized(Boolean(role));
      if (role) await load();
      else setLoading(false);
    })();
    return () => { mounted = false; };
  }, [load, supabase]);

  function reset() {
    setEditingId(null); setPlanKey(""); setName(""); setDescription(""); setPrice(""); setDuration("30");
    setBenefits(""); setActive(false); setFeatured(false); setPriority(false); setProfile(false); setBadge(false);
    setCardStyle("gold"); setBadgeLabel("Premium");
  }

  function edit(plan: Plan) {
    setEditingId(plan.id); setAudience(plan.audience as Audience); setPlanKey(plan.plan_key); setName(plan.name);
    setDescription(plan.description ?? ""); setPrice(String(plan.price)); setDuration(String(plan.duration_days));
    setBenefits((plan.benefits ?? []).join("\n")); setActive(plan.active);
    setFeatured(Boolean(plan.feature_flags?.featured_card)); setPriority(Boolean(plan.feature_flags?.search_priority));
    setProfile(Boolean(plan.feature_flags?.premium_profile)); setBadge(Boolean(plan.feature_flags?.profile_badge));
    setCardStyle(plan.card_style ?? "standard"); setBadgeLabel(plan.badge_label ?? "Premium");
    setError(""); setMessage("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const amount = Number(price.trim().replace(/\\s/g, "").replace(",", "."));
    const featureFlags = { private_seller_contact: false, featured_card: featured, search_priority: priority, premium_profile: profile, profile_badge: badge };
    try {
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Informe um preço maior que zero.");
      if (badge && badgeLabel.trim().length < 2) throw new Error("Informe o texto do selo Premium.");
      const { error: saveError } = await supabase.rpc("admin_save_pecatho_customer_premium_plan", {
        p_plan_id: editingId, p_plan_key: planKey.trim().toLowerCase(), p_name: name.trim(),
        p_description: description.trim() || null, p_price: amount, p_duration_days: Number(duration),
        p_benefits: benefits.split("\n").map((v) => v.trim()).filter(Boolean), p_active: active,
        p_audience: audience, p_feature_flags: featureFlags, p_card_style: cardStyle,
        p_badge_label: badge ? badgeLabel.trim() : null, p_sort_order: 0
      });
      if (saveError) throw saveError;
      setMessage(active ? "Plano profissional salvo e publicado." : "Plano salvo como inativo.");
      reset(); await load();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      setError(raw.includes("PLAN_AUDIENCE_LOCKED") ? "O público deste plano não pode ser alterado porque já possui assinaturas." :
        raw.includes("PREMIUM_PLAN_NEEDS_OPERATIONAL_FEATURE") ? "Ative ao menos um diferencial antes de publicar o plano." :
        raw.includes("PREMIUM_BADGE_LABEL_REQUIRED") ? "Informe o texto do selo Premium." :
        raw.includes("INVALID_PLAN_KEY") ? "A chave deve ter 2 a 50 caracteres: letras minúsculas, números, hífen ou sublinhado." :
        "Não foi possível salvar. Confirme se a migration Premium está aplicada e revise os campos.");
    } finally { setBusy(false); }
  }

  if (authorized === false) return <main className="shell"><section className="card"><h1>Acesso restrito</h1><p>Esta área exige permissão administrativa.</p><Link href="/admin/premium">Voltar ao Premium</Link></section></main>;
  return <main className="shell" style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 18px", color: "#f4f4f5" }}>
    <nav className="topbar"><div className="brand">Pecatho · Administração</div><div className="navLinks"><Link href="/admin/premium">Catálogo Premium</Link><Link href="/admin">Painel administrativo</Link></div></nav>
    <section className="hero"><div className="eyebrow">CATÁLOGO PREMIUM PROFISSIONAL</div><h1>Diferenciais que <em>geram visibilidade.</em></h1><p className="heroCopy">Configure planos distintos para acompanhantes e vendedores de conteúdo. Os benefícios só entram em vigor após a confirmação do pagamento e expiram com a assinatura.</p></section>
    {error && <p role="alert" className="formError">{error}</p>}{message && <p role="status" className="formSuccess">{message}</p>}
    <section className="card" style={{ marginBottom: 22 }}><h2>{editingId ? "Editar plano profissional" : "Novo plano profissional"}</h2>
      <form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 14 }}>
        <label>Público<select value={audience} onChange={e=>setAudience(e.target.value as Audience)}><option value="companion">Acompanhantes</option><option value="content_creator">Vendedores de conteúdo</option></select></label>
        <label>Chave única<input required minLength={2} maxLength={50} value={planKey} onChange={e=>setPlanKey(e.target.value)} placeholder="premium-destaque" /></label>
        <label>Nome do plano<input required minLength={3} maxLength={100} value={name} onChange={e=>setName(e.target.value)} /></label>
        <label>Preço em R$<input required inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="49,90" /></label>
        <label>Periodicidade<select value={duration} onChange={e=>setDuration(e.target.value)}><option value="30">Mensal · 30 dias</option><option value="90">Trimestral · 90 dias</option><option value="180">Semestral · 180 dias</option><option value="365">Anual · 365 dias</option></select></label>
        <label>Estilo do card<select value={cardStyle} onChange={e=>setCardStyle(e.target.value as CardStyle)}><option value="standard">Padrão</option><option value="gold">Dourado</option><option value="obsidian">Obsidiana</option><option value="signature">Signature</option></select></label>
        <label style={{ gridColumn: "1 / -1" }}>Descrição<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} /></label>
        <label style={{ gridColumn: "1 / -1" }}>Benefícios adicionais (um por linha)<textarea value={benefits} onChange={e=>setBenefits(e.target.value)} rows={3} /></label>
        <fieldset style={{ gridColumn: "1 / -1", display: "grid", gap: 10, border: "1px solid #444", borderRadius: 12, padding: 14 }}><legend>Diferenciais operacionais</legend>
          <label><input type="checkbox" checked={featured} onChange={e=>setFeatured(e.target.checked)} /> Card especial em destaque</label>
          <label><input type="checkbox" checked={priority} onChange={e=>setPriority(e.target.checked)} /> Prioridade no resultado das pesquisas</label>
          <label><input type="checkbox" checked={profile} onChange={e=>setProfile(e.target.checked)} /> Perfil com identidade visual diferenciada</label>
          <label><input type="checkbox" checked={badge} onChange={e=>setBadge(e.target.checked)} /> Selo Premium no perfil e no card</label>
          {badge && <label>Texto do selo<input required minLength={2} maxLength={32} value={badgeLabel} onChange={e=>setBadgeLabel(e.target.value)} /></label>}
        </fieldset>
        <label style={{ gridColumn: "1 / -1" }}><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} /> Publicar plano para contratação</label>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" }}><button className="primaryButton" disabled={busy}>{busy ? "Salvando..." : editingId ? "Salvar alterações" : "Criar plano"}</button>{editingId && <button type="button" className="secondaryButton" onClick={reset}>Cancelar edição</button>}</div>
      </form>
    </section>
    <section className="card"><h2>Planos cadastrados</h2>{loading ? <p>Carregando catálogo...</p> : plans.length ? <div style={{ display: "grid", gap: 12 }}>{plans.map(plan=><article key={plan.id} className="card" style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) auto", gap:12, alignItems:"center" }}><div><strong>{plan.name}</strong><p>{plan.audience === "companion" ? "Acompanhantes" : "Vendedores de conteúdo"} · {money(plan.price)} · {plan.duration_days} dias · {plan.active ? "Ativo" : "Inativo"}</p><p>{[plan.feature_flags?.featured_card && "Card em destaque",plan.feature_flags?.search_priority && "Prioridade na busca",plan.feature_flags?.premium_profile && "Perfil diferenciado",plan.feature_flags?.profile_badge && (plan.badge_label || "Selo Premium")].filter(Boolean).join(" · ") || "Sem diferenciais operacionais"}</p></div><button type="button" className="secondaryButton" onClick={()=>edit(plan)}>Editar</button></article>)}</div> : <p>Nenhum plano profissional cadastrado. Crie o primeiro acima.</p>}</section>
  </main>;
}
