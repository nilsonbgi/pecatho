"use client";

import { useEffect, useState } from "react";

type Audience = "companion" | "content_creator";
type FeatureFlags = { featured_card?: boolean; search_priority?: boolean; premium_profile?: boolean; profile_badge?: boolean };
type Plan = {
  id: string; name: string; description: string | null; price: number | string; currency: string;
  duration_days: number; benefits: string[] | null; audience: Audience; feature_flags: FeatureFlags;
  card_style: string; badge_label: string | null; sort_order: number;
};
type Subscription = {
  id: string; plan_id: string; audience: Audience; status: string; starts_at: string | null;
  ends_at: string | null; paid_amount: number | string; plan: Plan | null;
};
type Payload = { audiences: Audience[]; profile_status?: string | null; creator_status?: string | null; plans: Plan[]; subscriptions: Subscription[]; current?: Subscription[] };

const periodLabel = (days: number) => days === 30 ? "Mensal" : days === 90 ? "Trimestral" : days === 180 ? "Semestral" : days === 365 ? "Anual" : days + " dias";
const money = (value: number | string, currency = "BRL") => Number(value).toLocaleString("pt-BR", { style: "currency", currency });
const date = (value: string | null) => value ? new Date(value).toLocaleDateString("pt-BR") : "Aguardando pagamento";

export default function ProfessionalPremiumPlans() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [audience, setAudience] = useState<Audience>("content_creator");

  useEffect(() => {
    let mounted = true;
    fetch("/api/professional-premium", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar os planos profissionais.");
        if (mounted) {
          setData(payload as Payload);
          if (payload.audiences?.length && !payload.audiences.includes(audience)) setAudience(payload.audiences[0]);
        }
      })
      .catch((e: unknown) => { if (mounted) setError(e instanceof Error ? e.message : "Não foi possível carregar os planos."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const current = (data?.current ?? []).filter((item) => item.audience === audience);
  const plans = (data?.plans ?? []).filter((plan) => plan.audience === audience).sort((a, b) => a.sort_order - b.sort_order || Number(a.price) - Number(b.price));
  const statusAllowsPurchase = audience === "companion" ? data?.profile_status === "published" : data?.creator_status === "active";

  async function subscribe(plan: Plan) {
    setBuying(plan.id); setError("");
    try {
      const response = await fetch("/api/professional-premium", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan_id: plan.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível iniciar a contratação.");
      if (typeof payload.checkout_url !== "string") throw new Error("O Mercado Pago não retornou o checkout.");
      window.location.assign(payload.checkout_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível iniciar a contratação.");
      setBuying(null);
    }
  }

  return <section className="professionalPremiumPanel" aria-labelledby="professional-premium-title">
    <style>{`
      .professionalPremiumPanel{margin-top:24px;padding:clamp(18px,3vw,28px);border:1px solid rgba(231,195,63,.2);border-radius:22px;background:radial-gradient(ellipse at 0 0,rgba(231,195,63,.08),transparent 55%),linear-gradient(145deg,#14151b,#0b0c10);color:#f4f4f5}
      .professionalPremiumPanel *{box-sizing:border-box}.professionalPremiumPanel .pp-kicker{color:#e7c33f;font-size:10px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}
      .professionalPremiumPanel h2{margin:7px 0 8px;font-size:clamp(24px,3vw,32px);letter-spacing:-.045em;color:#faf8f0}
      .professionalPremiumPanel p{color:#a6aab5;font-size:12px;line-height:1.7}
      .professionalPremiumPanel .pp-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}
      .professionalPremiumPanel .pp-tabs button{border:1px solid rgba(255,255,255,.14);border-radius:10px;background:rgba(255,255,255,.035);color:#ddd;padding:10px 13px;font-size:11px;font-weight:800;cursor:pointer}
      .professionalPremiumPanel .pp-tabs button[aria-pressed=true]{border-color:#e7c33f;background:rgba(231,195,63,.12);color:#f6d76e}
      .professionalPremiumPanel .pp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr));gap:12px;margin-top:15px}
      .professionalPremiumPanel .pp-plan{display:flex;flex-direction:column;min-width:0;padding:18px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.025)}
      .professionalPremiumPanel .pp-plan h3{font-size:17px;color:#fff;margin:8px 0}
      .professionalPremiumPanel .pp-price{font-size:29px;font-weight:900;letter-spacing:-.05em;color:#f3d36a}
      .professionalPremiumPanel .pp-period{font-size:10px;color:#aaa;margin-top:3px}
      .professionalPremiumPanel .pp-features{display:grid;gap:7px;margin:14px 0;padding:0;list-style:none}
      .professionalPremiumPanel .pp-features li{font-size:11px;line-height:1.5;color:#dedfe4;display:flex;gap:8px}
      .professionalPremiumPanel .pp-features li:before{content:"✓";color:#e7c33f;font-weight:900}
      .professionalPremiumPanel .pp-button{width:100%;margin-top:auto;min-height:43px;border:1px solid #e7c33f;border-radius:10px;background:#e7c33f;color:#111;font-size:11px;font-weight:900;cursor:pointer}
      .professionalPremiumPanel .pp-button:disabled{opacity:.5;cursor:not-allowed}
      .professionalPremiumPanel .pp-alert{padding:12px;border:1px solid rgba(248,113,113,.3);border-radius:11px;color:#fecaca}
      .professionalPremiumPanel .pp-active{padding:15px;border:1px solid rgba(134,239,172,.25);border-radius:14px;background:rgba(34,197,94,.06)}
      .professionalPremiumPanel .pp-active strong{color:#a7f3d0}
      @media(max-width:520px){.professionalPremiumPanel{padding:16px}.professionalPremiumPanel .pp-grid{grid-template-columns:1fr}}
    `}</style>
    <div className="pp-kicker">Monetização · planos profissionais</div>
    <h2 id="professional-premium-title">Dê mais visibilidade ao seu perfil</h2>
    <p>Escolha diferenciais configurados pelo Pecatho. A assinatura e seus benefícios só entram em vigor após a confirmação do pagamento e deixam de valer no vencimento, após reembolso integral ou em caso de chargeback.</p>
    {error && <p className="pp-alert" role="alert">{error}</p>}
    {loading ? <p>Carregando planos e vigência...</p> : !data?.audiences?.length ? <p>Para contratar, mantenha um perfil de acompanhante publicado ou um perfil de vendedor de conteúdo ativo.</p> : <>
      <div className="pp-tabs" role="group" aria-label="Tipo de plano">
        {data.audiences.includes("companion") && <button type="button" aria-pressed={audience === "companion"} onClick={() => setAudience("companion")}>Acompanhante</button>}
        {data.audiences.includes("content_creator") && <button type="button" aria-pressed={audience === "content_creator"} onClick={() => setAudience("content_creator")}>Vendedor de conteúdo</button>}
      </div>
      {current.map((item) => {
        const flags = item.plan?.feature_flags ?? {};
        const activeBenefits = [
          flags.featured_card ? "Card especial em destaque" : "",
          flags.search_priority ? "Prioridade nas pesquisas padrão" : "",
          flags.premium_profile ? "Perfil com identidade visual diferenciada" : "",
          flags.profile_badge ? (item.plan?.badge_label || "Selo Premium") : "",
        ].filter(Boolean);
        return <article className="pp-active" key={item.id}><strong>Assinatura ativa · {item.plan?.name ?? "Plano profissional"}</strong><p>Válida até {date(item.ends_at)}. Os diferenciais abaixo foram vinculados à compra confirmada.</p>{item.plan?.description && <p>{item.plan.description}</p>}{activeBenefits.length > 0 && <ul className="pp-features">{activeBenefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>}{item.plan?.benefits?.length ? <ul className="pp-features">{item.plan.benefits.map((benefit, index) => <li key={item.id + "-description-" + index}>{benefit}</li>)}</ul> : null}</article>;
      })}
      {audience === "companion" && data.profile_status !== "published" && <p>O catálogo está disponível para consulta, mas a contratação de destaque só pode ser concluída depois que seu anúncio estiver publicado.</p>}
      {audience === "content_creator" && data.creator_status !== "active" && <p>O catálogo está disponível para consulta, mas a contratação exige que o perfil de vendedor esteja ativo.</p>}
      {plans.length ? <div className="pp-grid">{plans.map((plan) => {
        const flags = plan.feature_flags ?? {};
        const benefits = Array.isArray(plan.benefits) ? plan.benefits : [];
        const operational = [
          flags.featured_card ? "Card especial em destaque" : "",
          flags.search_priority ? "Prioridade nas pesquisas padrão" : "",
          flags.premium_profile ? "Identidade visual diferenciada no perfil" : "",
          flags.profile_badge ? (plan.badge_label || "Selo Premium") : "",
        ].filter(Boolean);
        return <article className="pp-plan" key={plan.id} data-style={plan.card_style}>
          <div className="pp-kicker">{periodLabel(plan.duration_days)} · {audience === "companion" ? "ACOMPANHANTE" : "CREATOR"}</div>
          <h3>{plan.name}</h3><div className="pp-price">{money(plan.price, plan.currency)}</div><div className="pp-period">por {periodLabel(plan.duration_days).toLowerCase()} · sem renovação automática</div>
          {plan.description && <p>{plan.description}</p>}
          <ul className="pp-features">{[...operational, ...benefits].map((benefit, index) => <li key={plan.id + "-" + index}>{benefit}</li>)}</ul>
          <button className="pp-button" type="button" disabled={!statusAllowsPurchase || buying !== null} onClick={() => void subscribe(plan)}>{buying === plan.id ? "Preparando checkout..." : statusAllowsPurchase ? "Contratar com Mercado Pago" : "Perfil precisa estar ativo"}</button>
        </article>;
      })}</div> : <p>Nenhum plano ativo para este público no momento. A administração pode cadastrar planos e publicar os diferenciais disponíveis.</p>}
      {data.subscriptions?.some((item) => item.audience === audience && item.status === "pending") && <p>Existe uma contratação aguardando pagamento. Os diferenciais ainda não foram liberados.</p>}
    </>}
  </section>;
}
