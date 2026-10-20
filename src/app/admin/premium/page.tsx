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
  const activeCount = plans.filter((plan) => plan.active).length;
  const inactiveCount = plans.length - activeCount;
  const filteredPlans = plans.filter((plan) => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const statusMatches = statusFilter === "all" || (statusFilter === "active" ? plan.active : !plan.active);
    const searchable = [plan.name, plan.plan_key, plan.description ?? "", ...(plan.benefits ?? [])].join(" ").toLocaleLowerCase("pt-BR");
    return statusMatches && (!term || searchable.includes(term));
  });

  async function load() {
    setLoadingPlans(true);
    const { data, error: loadError } = await supabase
      .from("pecatho_customer_premium_plans")
      .select("id,plan_key,name,description,price,currency,duration_days,benefits,active,sort_order,updated_at")
      .order("sort_order", { ascending: true }).order("price", { ascending: true });
    setLoadingPlans(false);
    if (loadError) throw loadError;
    setPlans((data ?? []) as PremiumPlan[]);
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
      });
      if (rpcError) throw rpcError;
      setMessage(active ? "Plano salvo e publicado para os clientes." : "Plano salvo como inativo; ele não aparece no painel do cliente.");
      reset();
      await load();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      setError(raw.includes("ADMIN_REQUIRED") ? "Seu usuário não tem permissão para administrar o Premium."
        : raw.includes("INVALID_PLAN_KEY") ? "A chave deve usar 2 a 50 caracteres: letras minúsculas, números, hífen ou sublinhado."
        : raw.includes("INVALID_PLAN_PRICE") ? "O preço deve ser maior que zero e não ultrapassar R$ 10.000,00."
        : raw.includes("INVALID_PLAN_DURATION") ? "A duração deve ficar entre 1 e 365 dias."
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
        <section className="pillars premiumAdminMetrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", margin: "26px 0 18px" }} aria-label="Resumo do catálogo">
          <article className="card" style={{ minHeight: 0 }}><div className="eyebrow">CATÁLOGO</div><h2 style={{ marginTop: 0, fontSize: 30 }}>{plans.length}</h2><p>Planos cadastrados</p></article>
          <article className="card" style={{ minHeight: 0 }}><div className="eyebrow">PUBLICADOS</div><h2 style={{ marginTop: 0, fontSize: 30, color: "#86efac" }}>{activeCount}</h2><p>Disponíveis no catálogo, conforme as regras da plataforma</p></article>
          <article className="card" style={{ minHeight: 0 }}><div className="eyebrow">INATIVOS</div><h2 style={{ marginTop: 0, fontSize: 30 }}>{inactiveCount}</h2><p>Preservados para edição ou republicação</p></article>
        </section>
        <section className="card premiumAdminEditor" id="editor">
          <h2>{editingId ? "Editar plano" : "Cadastrar novo plano"}</h2>
          <form onSubmit={(event) => void save(event)} style={{ display: "grid", gap: 14 }}>
            <label>Chave única do plano<input required minLength={2} maxLength={50} pattern="[a-z0-9][a-z0-9_-]{1,49}" value={planKey} onChange={(event) => setPlanKey(event.target.value)} placeholder="premium-mensal" /></label>
            <label>Nome comercial<input required minLength={3} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Premium mensal" /></label>
            <label>Descrição<textarea rows={2} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explique a proposta do plano." /></label>
            <div className="pillars">
              <label>Preço em reais<input required inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="19,90" /></label>
              <label>Duração em dias<input required type="number" min={1} max={365} value={durationDays} onChange={(event) => setDurationDays(event.target.value)} /></label>
            </div>
            <label>Benefícios incluídos (um por linha)<textarea rows={4} maxLength={5000} value={benefitsText} onChange={(event) => setBenefitsText(event.target.value)} placeholder={"Descontos em benefícios selecionados\nOfertas exclusivas para clientes Premium"} /></label>
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Publicar este plano no painel do cliente</label>
            <p className="fieldNote">A duração é contratada por período fixo. Esta versão não configura renovação automática. Não publique descontos ou presentes até que as regras operacionais correspondentes estejam implementadas e validadas.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="primaryButton" type="submit" disabled={busy}>{busy ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar plano"}</button>
              {editingId && <button className="secondaryButton" type="button" disabled={busy} onClick={reset}>Cancelar edição</button>}
            </div>
          </form>
        </section>
        <section className="card premiumAdminCatalog" id="catalogo">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><h2>Planos cadastrados</h2><button type="button" className="secondaryButton" disabled={loadingPlans} onClick={() => void load()}>{loadingPlans ? "Atualizando…" : "Atualizar catálogo"}</button></div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(130px, 180px)", gap: 10, margin: "16px 0" }}>
            <input aria-label="Buscar planos" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, chave ou benefício" style={{ minWidth: 0, width: "100%", background: "#0b0d12", color: "#f6f7fb", border: "1px solid rgba(255,255,255,.14)", borderRadius: 10, padding: "12px 14px" }} />
            <select aria-label="Filtrar por status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")} style={{ minWidth: 0, background: "#0b0d12", color: "#f6f7fb", border: "1px solid rgba(255,255,255,.14)", borderRadius: 10, padding: "12px" }}><option value="all">Todos os status</option><option value="active">Publicados</option><option value="inactive">Inativos</option></select>
          </div>
          {filteredPlans.length === 0 ? <div className="fieldNote" style={{ padding: "20px 0" }}><strong>{plans.length ? "Nenhum plano corresponde aos filtros." : "Nenhum plano configurado."}</strong><p>{plans.length ? "Altere a busca ou o status selecionado." : "Cadastre preço, duração e benefícios antes de disponibilizar a contratação."}</p>{(search || statusFilter !== "all") && <button type="button" className="secondaryButton" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Limpar filtros</button>}</div> : <div className="financeHistory">{filteredPlans.map((plan) => <article key={plan.id}>
            <div><strong>{plan.name}</strong><small>{plan.plan_key} · {plan.duration_days} dias · {Number(plan.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</small><small>{plan.description || "Sem descrição"}</small>{plan.benefits?.length ? <small style={{ display: "block", marginTop: 8, lineHeight: 1.6 }}>Benefícios: {plan.benefits.slice(0, 3).join(" · ")}{plan.benefits.length > 3 ? " · +" + (plan.benefits.length - 3) : ""}</small> : <small style={{ display: "block", marginTop: 8 }}>Sem benefícios cadastrados</small>}</div>
            <span className="financeStatus">{plan.active ? "Publicado" : "Inativo"}</span>
            <button className="secondaryButton" type="button" onClick={() => edit(plan)}>Editar</button>
          </article>)}</div>}
        </section>
      </section>
    </main>
  );
}
