"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration_days: number;
  creator: { slug: string; display_name: string };
};

export default function FansSubscriptionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const renewal = searchParams.get("renovar") === "1";
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/fans/planos/${params.id}`, { cache: "no-store" })
      .then(async response => {
        const json = await response.json().catch(() => ({}));
        if (response.status === 401) {
          router.push(`/login?next=/fans/assinar/${params.id}${renewal ? "?renovar=1" : ""}`);
          return null;
        }
        if (!response.ok) throw new Error(json.error || "Plano não encontrado.");
        return json as Plan;
      })
      .then(value => { if (alive && value) setPlan(value); })
      .catch(err => { if (alive) setError(err instanceof Error ? err.message : "Não foi possível carregar o plano."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [params.id, renewal, router]);

  async function subscribe() {
    if (!plan || processing) return;
    setProcessing(true);
    setError("");
    try {
      const intent = await fetch("/api/fans/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id, renewal }),
      });
      const intentBody = await intent.json().catch(() => ({}));
      if (intent.status === 401) {
        router.push(`/login?next=/fans/assinar/${plan.id}${renewal ? "?renovar=1" : ""}`);
        return;
      }
      if (!intent.ok) throw new Error(intentBody.error || "Não foi possível iniciar a assinatura.");

      const provider = await fetch("/api/fans/checkout/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: intentBody.order?.id }),
      });
      const providerBody = await provider.json().catch(() => ({}));
      if (!provider.ok || !providerBody.checkout_url) throw new Error(providerBody.error || "Não foi possível abrir o checkout.");
      window.location.assign(providerBody.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar a assinatura.");
      setProcessing(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-slate-50 px-4 py-12"><div className="mx-auto max-w-xl rounded-3xl border bg-white p-8"><p className="text-sm text-slate-500">Carregando plano…</p></div></main>;
  if (error || !plan) return <main className="min-h-screen bg-slate-50 px-4 py-12"><div className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center"><p className="text-sm text-red-600">{error || "Plano não encontrado."}</p><Link href="/fans" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Voltar ao Fans</Link></div></main>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-xl">
        <Link href={`/fans/${plan.creator.slug}`} className="text-sm font-semibold text-slate-700">← Voltar para {plan.creator.display_name}</Link>
        <article className="mt-5 overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="bg-slate-950 p-7 text-white sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Pecatho Fans · {renewal ? "Renovação" : "Assinatura"}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{plan.name}</h1>
            <p className="mt-2 text-sm text-slate-300">Plano de {plan.creator.display_name}</p>
          </div>
          <div className="p-7 sm:p-9">
            {plan.description && <p className="text-sm leading-6 text-slate-600">{plan.description}</p>}
            <div className="mt-6 rounded-2xl border bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Investimento</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: plan.currency || "BRL" }).format(Number(plan.price || 0))}</p>
              <p className="mt-1 text-sm text-slate-500">{renewal ? `Mais ${plan.duration_days} dias após a confirmação do pagamento.` : `Acesso por ${plan.duration_days} dias após a confirmação do pagamento.`}</p>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">{renewal ? "A renovação é manual e somente estende uma assinatura existente depois da confirmação oficial do pagamento." : "A assinatura só será ativada após a confirmação oficial do pagamento pelo provedor. Iniciar o checkout não libera conteúdo."}</p>
            <button onClick={subscribe} disabled={processing} className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{processing ? "Preparando checkout…" : renewal ? "Continuar para renovação" : "Continuar para pagamento"}</button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        </article>
      </section>
    </main>
  );
}
