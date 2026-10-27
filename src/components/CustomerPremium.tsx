"use client";

import { useEffect, useState } from "react";

type PremiumPlan = {
  id: string;
  plan_key: string;
  name: string;
  description: string | null;
  price: number | string;
  currency: string;
  duration_days: number;
  discount_percent: number;
  billing_options?: Record<string, { discount_percent: number }> | null;
  benefits: string[] | null;
  feature_flags?: { private_seller_contact?: boolean } | null;
};

type PremiumSubscription = {
  id: string;
  plan_id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  paid_amount: number | string;
  created_at: string;
  plan?: PremiumPlan | null;
};

type PremiumResponse = {
  plans: PremiumPlan[];
  subscriptions: PremiumSubscription[];
  current: PremiumSubscription | null;
};

function money(value: number | string, currency = "BRL") {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency });
}

function date(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "Aguardando confirmação";
}

export default function CustomerPremium() {
  const [data, setData] = useState<PremiumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [durationDays, setDurationDays] = useState(30);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/cliente/premium", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar o Premium.");
        if (mounted) setData(payload as PremiumResponse);
      })
      .catch((e: unknown) => {
        if (mounted) setError(e instanceof Error ? e.message : "Não foi possível carregar o Premium.");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function subscribe(plan: PremiumPlan) {
    setBuying(plan.id);
    setError("");
    try {
      const params = new URLSearchParams(window.location.search);
      const creatorId = params.get("creator_id");
      const response = await fetch("/api/cliente/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id, duration_days: durationDays, ...(creatorId ? { creator_id: creatorId } : {}) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = typeof payload.detail === "string" && payload.detail.trim() ? ` Detalhe técnico: ${payload.detail.slice(0, 500)}` : "";
        throw new Error((payload.error || "Não foi possível iniciar o pagamento.") + detail);
      }
      if (typeof payload.checkout_url !== "string") throw new Error("O Mercado Pago não retornou o checkout.");
      window.location.assign(payload.checkout_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível iniciar o pagamento.");
      setBuying(null);
    }
  }

  return (
    <section className="card" id="premium" aria-labelledby="customer-premium-title">
      <div className="eyebrow">PECATHO PREMIUM</div>
      <h2 id="customer-premium-title">Mais vantagens na sua experiência</h2>
      <p>Consulte os planos disponíveis e os benefícios incluídos antes de pagar. A contratação é processada pelo Mercado Pago; o Premium só é ativado depois que o Pecatho confirma o pagamento pelo webhook.</p>

      {error && <p role="alert" className="fieldNote" style={{ border: "1px solid rgba(239,68,68,.35)", borderRadius: 12, padding: 12 }}>{error}</p>}

      {loading ? <p className="fieldNote">Consultando planos e situação da assinatura...</p> : data?.current ? (
        <article className="card" style={{ border: "1px solid rgba(231,195,63,.55)", background: "linear-gradient(135deg,rgba(231,195,63,.10),rgba(0,3,9,.18))" }}>
          <div className="eyebrow">ASSINATURA ATIVA</div>
          <h3>Seu Premium está ativo</h3>
          <p>Válido até <strong>{date(data.current.ends_at)}</strong>.</p>
          {data.current.plan?.description && <p>{data.current.plan.description}</p>}
          {data.current.plan?.feature_flags?.private_seller_contact && <p>✓ Contato privado com vendedores de conteúdo liberado durante a vigência.</p>}
          {data.current.plan?.benefits?.length ? <ul>{data.current.plan.benefits.map((benefit, index) => <li key={"active-premium-benefit-" + index}>{benefit}</li>)}</ul> : null}
          <p className="fieldNote">O prazo foi calculado a partir da confirmação do pagamento. Não há renovação automática habilitada.</p>
        </article>
      ) : loading ? null : data?.plans?.length ? (
        <div className="pillars">
          {data.plans.filter((plan) => plan.duration_days === 30).slice(0, 1).map((plan) => {
            const benefits = Array.isArray(plan.benefits) ? plan.benefits : [];
            const terms = [
              { days: 30, label: "Mensal", discount: 0 },
              { days: 90, label: "Trimestral", discount: Number(plan.billing_options?.["90"]?.discount_percent ?? 0) },
              { days: 180, label: "Semestral", discount: Number(plan.billing_options?.["180"]?.discount_percent ?? 0) },
              { days: 365, label: "Anual", discount: Number(plan.billing_options?.["365"]?.discount_percent ?? 0) },
            ];
            const selected = terms.find((term) => term.days === durationDays) ?? terms[0];
            const billingMonths = durationDays === 365 ? 12 : durationDays / 30;
            const total = Math.round(Number(plan.price) * billingMonths * (1 - selected.discount / 100) * 100) / 100;
            const configured = durationDays === 30 || selected.discount > 0;
            return <article className="card" key={plan.id} style={{ border: "1px solid rgba(231,195,63,.42)", gridColumn: "1 / -1" }}>
              <div className="eyebrow">UM ÚNICO PLANO · PECATHO PREMIUM</div><h3>{plan.name}</h3>
              {plan.description && <p>{plan.description}</p>}
              <label style={{ display: "grid", gap: 8, maxWidth: 460 }}>Período de contratação
                <select value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))} style={{ width: "100%", padding: 12, borderRadius: 10, background: "#0b0d12", color: "#f6f7fb", border: "1px solid rgba(231,195,63,.35)" }}>
                  {terms.map((term) => <option key={term.days} value={term.days}>{term.label}{term.days === 30 ? " · sem desconto" : term.discount > 0 ? " · " + term.discount.toLocaleString("pt-BR") + "% de desconto" : " · desconto não configurado"}</option>)}
                </select>
              </label>
              {selected.discount > 0 && <p className="fieldNote" style={{ color: "#86efac", fontWeight: 800 }}>Economize {selected.discount.toLocaleString("pt-BR")}% em relação ao preço proporcional mensal.</p>}
              {durationDays > 30 && selected.discount > 0 && <p style={{ color: "#a6aab5", textDecoration: "line-through" }}>De {money(Number(plan.price) * billingMonths, plan.currency)}</p>}
              <p className="financeBig">{money(total, plan.currency)} <span className="fieldNote" style={{ fontSize: 14, fontWeight: 400 }}>/{selected.label.toLocaleLowerCase("pt-BR")}</span></p>
              <p className="fieldNote">Todos os períodos oferecem os mesmos benefícios e privilégios. O valor exibido é o total do período selecionado.</p>
              {plan.feature_flags?.private_seller_contact && <p>✓ Contato privado com vendedores de conteúdo durante a vigência.</p>}
              {benefits.length > 0 ? <ul>{benefits.map((benefit, index) => <li key={plan.id + "-benefit-" + index}>{benefit}</li>)}</ul> : null}
              <button className="primaryButton" type="button" disabled={buying !== null || !configured} onClick={() => void subscribe(plan)}>{buying === plan.id ? "Preparando pagamento..." : configured ? "Assinar com Mercado Pago" : "Período em configuração"}</button>
            </article>;
          })}
        </div>
      ) : (
        <div className="card">
          <h3>Planos em configuração</h3>
          <p className="fieldNote">A contratação está protegida contra ativações sem pagamento, mas ainda não há um plano comercial ativo para oferecer. Os planos precisam ter preço, duração e benefícios aprovados antes de aparecerem para os clientes.</p>
        </div>
      )}

      {data?.subscriptions?.some((item) => item.status === "pending") && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Pagamento em processamento</h3>
          <p className="fieldNote">Existe uma tentativa de contratação aguardando confirmação. Os benefícios Premium ainda não estão liberados. Consulte novamente após a confirmação do Mercado Pago.</p>
        </div>
      )}
    </section>
  );
}
