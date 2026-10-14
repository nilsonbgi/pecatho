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
  benefits: string[] | null;
};

type PremiumSubscription = {
  id: string;
  plan_id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  paid_amount: number | string;
  created_at: string;
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
      const response = await fetch("/api/cliente/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível iniciar o pagamento.");
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
          <p className="fieldNote">O prazo foi calculado a partir da confirmação do pagamento. Não há renovação automática habilitada.</p>
        </article>
      ) : loading ? null : data?.plans?.length ? (
        <div className="pillars">
          {data.plans.map((plan) => {
            const benefits = Array.isArray(plan.benefits) ? plan.benefits : [];
            return (
              <article className="card" key={plan.id} style={{ border: "1px solid rgba(231,195,63,.28)" }}>
                <div className="eyebrow">ASSINATURA POR {plan.duration_days} DIAS</div>
                <h3>{plan.name}</h3>
                <p className="financeBig">{money(plan.price, plan.currency)}</p>
                {plan.description && <p>{plan.description}</p>}
                {benefits.length > 0 ? <ul>{benefits.map((benefit, index) => <li key={plan.id + "-benefit-" + index}>{benefit}</li>)}</ul> : <p className="fieldNote">Os benefícios deste plano serão informados antes da contratação.</p>}
                <button className="primaryButton" type="button" disabled={buying !== null} onClick={() => void subscribe(plan)}>
                  {buying === plan.id ? "Preparando pagamento..." : "Assinar com Mercado Pago"}
                </button>
              </article>
            );
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
