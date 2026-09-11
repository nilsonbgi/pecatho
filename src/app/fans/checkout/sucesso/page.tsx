"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type CheckoutStatus = {
  order: {
    id: string;
    order_number: string;
    status: string;
    total: number;
    currency: string;
    product_type: "post" | "subscription" | null;
    product_id: string | null;
    title: string | null;
    updated_at: string;
  };
  payment: {
    status: string;
    provider: string | null;
    provider_payment_id: string | null;
    payment_method: string | null;
    paid_at: string | null;
    updated_at: string;
  } | null;
  entitlement: {
    entitled: boolean;
    subscription_id: string | null;
    purchase_id: string | null;
    ends_at: string | null;
  };
};

export const dynamic = "force-dynamic";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL" }).format(Number(value || 0));
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [data, setData] = useState<CheckoutStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const checkStatus = useCallback(async () => {
    if (!orderId) {
      setError("Pedido não informado.");
      setLoading(false);
      return;
    }

    setChecking(true);
    try {
      const response = await fetch(`/api/fans/checkout/status?order=${encodeURIComponent(orderId)}`, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível consultar o pagamento.");
      setData(body as CheckoutStatus);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível consultar o pagamento.");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, [orderId]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (!data || data.entitlement.entitled) return;
    if (!["pending", "awaiting_payment", "authorized"].includes(data.order.status) && !["pending", "authorized"].includes(data.payment?.status ?? "")) return;

    const interval = window.setInterval(() => void checkStatus(), 5000);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 60000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [data, checkStatus]);

  const confirmed = !!data?.entitlement.entitled;
  const failed = data?.order.status === "failed" || data?.payment?.status === "failed" || data?.order.status === "refunded" || data?.payment?.status === "refunded" || data?.payment?.status === "chargeback";
  const pending = !confirmed && !failed;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-xl rounded-3xl border bg-white p-7 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pecatho Fans · Checkout</p>

        {loading ? (
          <div className="py-10 text-center">
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Consultando pagamento</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">Estamos consultando o status oficial do pedido.</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Não foi possível confirmar agora</h1>
            <p className="mt-4 text-sm leading-6 text-red-600">{error}</p>
            <button onClick={() => void checkStatus()} disabled={checking} className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{checking ? "Consultando…" : "Consultar novamente"}</button>
          </div>
        ) : confirmed ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">Acesso confirmado</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">O pagamento foi confirmado oficialmente e o seu acesso já está ativo.</p>
            {data?.order.title && <p className="mt-3 font-semibold text-slate-950">{data.order.title}</p>}
            {data && <p className="mt-2 text-sm text-slate-500">{money(Number(data.order.total), data.order.currency)}</p>}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {data?.order.product_type === "subscription" && data.order.product_id && <Link href={data.entitlement.subscription_id ? `/fans` : `/fans`} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Acessar o Fans</Link>}
              {data?.order.product_type === "post" && data.order.product_id && <Link href={`/fans/publicacoes/${data.order.product_id}`} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Abrir conteúdo</Link>}
              <Link href="/fans/gerenciar" className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-900">Meu Fans</Link>
            </div>
          </div>
        ) : failed ? (
          <div className="py-8 text-center">
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Pagamento não confirmado</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">O pagamento não foi confirmado e nenhum acesso foi liberado por esta operação.</p>
            <Link href="/fans" className="mt-7 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Voltar ao Fans</Link>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-xl text-amber-700">…</div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">Pagamento em confirmação</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">O provedor ainda não confirmou a operação. O Pecatho continuará verificando por alguns instantes. O conteúdo não é liberado antes da confirmação oficial.</p>
            {data?.order.title && <p className="mt-4 font-semibold text-slate-950">{data.order.title}</p>}
            <button onClick={() => void checkStatus()} disabled={checking} className="mt-6 rounded-xl border px-5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50">{checking ? "Consultando…" : "Atualizar status"}</button>
          </div>
        )}
      </section>
    </main>
  );
}
