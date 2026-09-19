"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Offer = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  currency: string;
  status: "active" | "inactive";
};

export default function FansVideoCallCheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?next=/fans/videochamadas/${params.id}`);
        return;
      }
      const { data, error: queryError } = await supabase
        .from("fans_live_offers")
        .select("id,creator_id,title,description,duration_minutes,price,currency,status")
        .eq("id", params.id)
        .eq("status", "active")
        .maybeSingle();
      if (queryError || !data) setError("Esta oferta não está disponível.");
      else setOffer(data as Offer);
      setLoading(false);
    }
    void load();
  }, [params.id, router]);

  async function checkout() {
    if (!offer || paying) return;
    setPaying(true);
    setError("");
    try {
      const response = await fetch("/api/fans/live/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: offer.id }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error || "Não foi possível criar o pagamento.");
        setPaying(false);
        return;
      }

      const providerResponse = await fetch("/api/fans/checkout/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: result.session.order_id }),
      });
      const providerResult = await providerResponse.json().catch(() => null);
      if (!providerResponse.ok || !providerResult?.checkout_url) {
        setError(providerResult?.error || "Não foi possível abrir o checkout do provedor.");
        setPaying(false);
        return;
      }

      window.location.href = providerResult.checkout_url;
    } catch {
      setError("Não foi possível iniciar o pagamento.");
      setPaying(false);
    }
  }

  const money = (value: number, currency: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(Number(value || 0));

  if (loading) return <main className="mx-auto min-h-screen max-w-3xl px-4 py-12"><p className="text-slate-600">Carregando oferta...</p></main>;

  if (!offer) return <main className="mx-auto min-h-screen max-w-3xl px-4 py-12"><Link href="/fans" className="text-sm font-semibold text-slate-900">← Voltar ao Fans</Link><div className="mt-8 rounded-2xl border bg-white p-8"><h1 className="text-2xl font-bold text-slate-950">Oferta indisponível</h1><p className="mt-2 text-slate-600">{error || "Esta oferta não está mais disponível."}</p></div></main>;

  return <main className="mx-auto min-h-screen max-w-3xl bg-slate-50 px-4 py-10 sm:px-6">
    <Link href="/fans" className="text-sm font-semibold text-slate-900">← Pecatho Fans</Link>
    <section className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="bg-slate-950 px-6 py-8 text-white sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Videochamada privada</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{offer.title}</h1>
        <p className="mt-3 text-slate-300">{offer.duration_minutes} minutos · pagamento único</p>
      </div>
      <div className="p-6 sm:p-8">
        {offer.description && <p className="text-sm leading-7 text-slate-600">{offer.description}</p>}
        <div className="mt-6 rounded-2xl border bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Valor</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{money(Number(offer.price), offer.currency)}</p>
        </div>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          O acesso à videochamada não é liberado pela criação do pedido. A chamada somente ficará disponível depois que o Pecatho confirmar o pagamento pelo provedor.
        </div>
        {error && <p className="mt-4 text-sm font-medium text-red-700">{error}</p>}
        <button onClick={() => void checkout()} disabled={paying} className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {paying ? "Abrindo pagamento..." : `Pagar ${money(Number(offer.price), offer.currency)}`}
        </button>
      </div>
    </section>
  </main>;
}
