"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type SellerReputation = {
  average_rating: number | null;
  review_count: number;
  verified_sales_count: number;
  trust_badge: boolean;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
  }>;
};

type Product = {
  id: string;
  title: string;
  description: string | null;
  product_type: string;
  price: number | string;
  currency: string;
  owner_type: "advertiser" | "creator";
  owner_id: string;
  cover_url: string | null;
  file_count: number;
  media_types: string[];
  owner_name: string;
  owner_slug: string;
};

function formatPrice(value: number | string, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(Number(value));
}

function productLabel(type: string) {
  if (type === "package") return "PACOTE EXCLUSIVO";
  if (type === "single_video") return "VÍDEO EXCLUSIVO";
  return "IMAGEM EXCLUSIVA";
}

function mediaLabel(type: string) {
  if (type === "video") return "vídeo";
  if (type === "audio") return "áudio";
  if (type === "document") return "arquivo";
  return "imagem";
}

export default function DigitalContentProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reputation, setReputation] = useState<SellerReputation | null>(null);
  const [reputationLoading, setReputationLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(
          `/api/conteudos/public/${encodeURIComponent(params.id)}`,
          { cache: "no-store" },
        );
        const body = await response.json();

        if (!response.ok || !body.product) {
          throw new Error(body.error || "Conteúdo não encontrado.");
        }

        if (active) setProduct(body.product as Product);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o conteúdo.",
          );
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (!product) return;

    let active = true;
    setReputationLoading(true);

    fetch(
      `/api/conteudos/seller-reputation?owner_type=${encodeURIComponent(product.owner_type)}&owner_id=${encodeURIComponent(product.owner_id)}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar a reputação.");
        return response.json() as Promise<{ reputation?: SellerReputation | null }>;
      })
      .then((body) => {
        if (active) setReputation(body.reputation ?? null);
      })
      .catch(() => {
        if (active) setReputation(null);
      })
      .finally(() => {
        if (active) setReputationLoading(false);
      });

    return () => {
      active = false;
    };
  }, [product]);

  async function buy() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/conteudos/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: params.id }),
      });
      const body = await response.json();

      if (response.status === 401) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }

      if (!response.ok) {
        throw new Error(body.error || "Não foi possível iniciar a compra.");
      }

      if (body.already_owned && body.sale_id) {
        window.location.href = `/conteudos/minhas-compras?sale=${encodeURIComponent(body.sale_id)}`;
        return;
      }

      const providerResponse = await fetch("/api/conteudos/checkout/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: body.order_id }),
      });
      const providerBody = await providerResponse.json();

      if (!providerResponse.ok || !providerBody.checkout_url) {
        throw new Error(providerBody.error || "Checkout indisponível.");
      }

      window.location.href = providerBody.checkout_url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível iniciar a compra.",
      );
      setBusy(false);
    }
  }

  if (error && !product) {
    return (
      <main className="min-h-screen bg-[#07070b] px-4 py-12 text-white">
        <div className="mx-auto max-w-xl rounded-[30px] border border-white/10 bg-white/[.04] p-8 text-center shadow-2xl">
          <p className="text-sm font-semibold text-red-300">{error}</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07070b] p-6 text-white">
        <p className="text-sm text-slate-400">Carregando conteúdo…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07070b] px-4 py-8 text-white sm:py-12">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-white/[.04] shadow-2xl">
        <div className="grid lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative min-h-[420px] overflow-hidden bg-gradient-to-br from-violet-950/70 via-slate-950 to-fuchsia-950/40">
            {product.cover_url ? (
              <img
                src={product.cover_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,.42),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(217,70,239,.25),transparent_38%)]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/35 to-black/10" />

            <div className="relative flex min-h-[420px] flex-col justify-between p-7 sm:p-10">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[10px] font-black tracking-[.16em] backdrop-blur">
                  {productLabel(product.product_type)}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/80 backdrop-blur">
                  Conteúdo protegido
                </span>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-300">
                  PECATHO · CONTEÚDO EXCLUSIVO
                </p>
                <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-[-.045em] sm:text-5xl">
                  {product.title}
                </h1>
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-10">
            <div className="mb-5 flex items-center justify-between gap-3">
              <Link
                href={product.owner_type === "advertiser" ? `/anunciantes/${product.owner_slug}` : `/fans/${product.owner_slug}`}
                className="text-xs font-black text-white/60 no-underline transition hover:text-violet-200"
              >
                ← Voltar ao perfil
              </Link>
              <Link
                href={product.owner_type === "advertiser"
                  ? `/conteudos?owner_type=advertiser&owner_id=${encodeURIComponent(product.owner_id)}`
                  : `/conteudos?owner_type=creator&owner_id=${encodeURIComponent(product.owner_id)}`}
                className="text-xs font-black text-violet-200 no-underline transition hover:text-white"
              >
                Ver loja do vendedor →
              </Link>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black tracking-[.12em] text-violet-200">
                VENDEDOR · {product.owner_name}
              </span>
              {product.owner_slug ? (
                <Link href={product.owner_type === "advertiser" ? `/anunciantes/${product.owner_slug}` : `/fans/${product.owner_slug}`} className="text-xs font-black text-violet-200 underline underline-offset-4">
                  Ver perfil →
                </Link>
              ) : null}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>
                {product.owner_type === "creator"
                  ? "Conteúdo de criador"
                  : "Conteúdo de anunciante"}
              </span>
              <span className="text-white/20">•</span>
              <span>
                {product.file_count} arquivo{product.file_count === 1 ? "" : "s"}
              </span>
            </div>

            {!reputationLoading && reputation?.trust_badge ? (
              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/[.06] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/15 text-sm text-emerald-300">
                    ✓
                  </span>
                  <span className="text-[10px] font-black tracking-[.1em] text-emerald-200">
                    VENDEDOR DE CONTEÚDO VERIFICADO
                  </span>
                  {reputation.average_rating !== null ? (
                    <span className="rounded-full bg-white/[.08] px-2.5 py-1 text-xs font-black text-white">
                      ★ {reputation.average_rating.toFixed(1)} · {reputation.review_count} {reputation.review_count === 1 ? "avaliação" : "avaliações"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  {reputation.verified_sales_count} {reputation.verified_sales_count === 1 ? "venda confirmada" : "vendas confirmadas"} de conteúdo no ecossistema Pecatho.
                  {reputation.review_count > 0 ? " O rating é atribuído por compradores com compra verificada." : ""}
                </p>
              </div>
            ) : null}

            {!reputationLoading && reputation && reputation.reviews.length > 0 ? (
              <section className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <div className="text-[10px] font-black uppercase tracking-[.14em] text-white/40">
                  Avaliações de compradores
                </div>
                <div className="mt-3 space-y-3">
                  {reputation.reviews.slice(0, 4).map((review) => (
                    <article key={review.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black tracking-wide text-amber-300">
                          {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-[.1em] text-emerald-300/80">
                          COMPRA VERIFICADA
                        </span>
                      </div>
                      {review.comment ? (
                        <p className="mt-2 text-xs leading-5 text-white/55">
                          “{review.comment}”
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <p className="mt-6 whitespace-pre-wrap text-[15px] leading-7 text-slate-300">
              {product.description ||
                "Conteúdo digital exclusivo disponível para compra."}
            </p>

            {product.media_types.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.media_types.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs font-semibold text-slate-300"
                  >
                    {mediaLabel(type)}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-end justify-between gap-5">
                <div>
                  <span className="block text-[10px] font-black tracking-[.16em] text-slate-500">
                    ACESSO EXCLUSIVO
                  </span>
                  <strong className="mt-1 block text-3xl font-black tracking-tight">
                    {formatPrice(product.price, product.currency)}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() => void buy()}
                  disabled={busy}
                  className="rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-white/10 transition hover:bg-violet-100 disabled:cursor-wait disabled:opacity-50"
                >
                  {busy ? "Preparando checkout…" : "Comprar agora"}
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </p>
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <p className="text-xs font-black text-white">Pagamento confirmado</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  A liberação acontece somente após a confirmação do pagamento.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <p className="text-xs font-black text-white">Acesso protegido</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Os arquivos originais não ficam expostos por URL pública.
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-violet-300/10 bg-violet-400/[.04] p-4 text-xs leading-5 text-slate-400">
              <strong className="text-white">Compra vinculada ao vendedor.</strong> Este conteúdo foi publicado por {product.owner_name} e o acesso adquirido fica associado à sua conta Pecatho.
              <div className="mt-3">
                <Link
                  href={product.owner_type === "advertiser"
                    ? `/conteudos?owner_type=advertiser&owner_id=${encodeURIComponent(product.owner_id)}`
                    : `/conteudos?owner_type=creator&owner_id=${encodeURIComponent(product.owner_id)}`}
                  className="font-black text-violet-200 no-underline hover:text-white"
                >
                  Explorar outros conteúdos de {product.owner_name} →
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              Depois da compra, seus arquivos ficam disponíveis em
              <span className="font-semibold text-slate-300"> Minhas compras</span>
              por links temporários de acesso.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
