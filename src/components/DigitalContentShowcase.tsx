"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OwnerType = "advertiser" | "creator";

type Product = {
  id: string;
  title: string;
  description: string | null;
  product_type: "single_image" | "single_video" | "package";
  price: number | string;
  currency: string;
  cover_url?: string | null;
};

const typeLabel: Record<Product["product_type"], string> = {
  single_image: "IMAGEM EXCLUSIVA",
  single_video: "VÍDEO EXCLUSIVO",
  package: "PACOTE EXCLUSIVO",
};

export default function DigitalContentShowcase({
  ownerType,
  ownerId,
  compact = false,
}: {
  ownerType: OwnerType;
  ownerId: string;
  compact?: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch(
      `/api/conteudos/public?owner_type=${encodeURIComponent(ownerType)}&owner_id=${encodeURIComponent(ownerId)}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar os conteúdos.");
        return response.json() as Promise<{ products?: Product[] }>;
      })
      .then((data) => {
        if (active) setProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ownerId, ownerType]);

  if (!loading && products.length === 0) return null;

  const visible = compact ? products.slice(0, 3) : products;
  const sellerLabel = ownerType === "creator" ? "criador" : "anunciante";

  return (
    <section
      id="conteudo-exclusivo"
      className="relative overflow-hidden rounded-[32px] border border-violet-200/20 bg-gradient-to-br from-[#08080d] via-[#151022] to-[#2a1240] p-5 text-white shadow-[0_28px_90px_rgba(76,29,149,.2)] sm:p-8"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1.5 text-[9px] font-black tracking-[.18em] text-violet-200">
                LOJA PRIVADA · PECATHO
              </span>
              <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[9px] font-bold tracking-[.12em] text-white/60">
                VENDA DIRETA DO PERFIL
              </span>
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-[-.06em] sm:text-4xl">
              Conteúdo exclusivo
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Materiais exclusivos disponibilizados diretamente por este {sellerLabel}.
              Cada item possui preço próprio e é liberado somente após a confirmação do pagamento.
            </p>
          </div>

          {!loading && products.length > 0 ? (
            <Link
              href={`/conteudos?owner_type=${encodeURIComponent(ownerType)}&owner_id=${encodeURIComponent(ownerId)}`}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[.06] px-5 py-3 text-xs font-black text-white no-underline transition hover:border-violet-300/40 hover:bg-white/10"
            >
              <span>Ver loja deste perfil</span>
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
          ) : null}
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {loading
            ? [1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                />
              ))
            : visible.map((product) => (
                <Link
                  key={product.id}
                  href={`/conteudos/${product.id}`}
                  className="group relative min-h-72 overflow-hidden rounded-[24px] border border-white/10 bg-black/20 text-white no-underline transition duration-300 hover:-translate-y-1.5 hover:border-violet-300/45 hover:shadow-[0_18px_45px_rgba(124,58,237,.18)]"
                >
                  <div className="absolute inset-0">
                    {product.cover_url ? (
                      <img
                        src={product.cover_url}
                        alt=""
                        className="h-full w-full object-cover opacity-45 transition duration-700 group-hover:scale-105 group-hover:opacity-60"
                      />
                    ) : (
                      <div className="h-full w-full bg-[radial-gradient(circle_at_35%_25%,rgba(139,92,246,.3),transparent_32%),linear-gradient(135deg,#11111b,#251034)]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/10" />
                  </div>

                  <div className="relative flex min-h-72 flex-col justify-between p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-2.5 py-1 text-[9px] font-black tracking-[.12em] text-violet-100 backdrop-blur">
                        {typeLabel[product.product_type]}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-sm font-black backdrop-blur">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: product.currency || "BRL",
                        }).format(Number(product.price))}
                      </span>
                    </div>

                    <div>
                      <h3 className="line-clamp-2 text-xl font-black tracking-[-.035em]">
                        {product.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/65">
                        {product.description ||
                          "Conteúdo digital exclusivo disponível para compra."}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-black">
                        <span className="text-white/50">
                          {product.product_type === "package"
                            ? "Pacote exclusivo"
                            : "Acesso individual"}
                        </span>
                        <span className="text-violet-200 transition group-hover:translate-x-1">
                          Ver e comprar →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
        </div>

        {compact && products.length > 3 ? (
          <div className="mt-5 flex justify-center">
            <Link
              href={`/conteudos?owner_type=${encodeURIComponent(ownerType)}&owner_id=${encodeURIComponent(ownerId)}`}
              className="rounded-xl bg-white px-5 py-3 text-xs font-black text-slate-950 no-underline transition hover:bg-violet-100"
            >
              Ver todos os conteúdos deste perfil · {products.length} disponíveis
            </Link>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-black tracking-[.14em] text-violet-300">COMPRA DIRETA</p>
            <p className="mt-1 text-xs leading-5 text-white/55">O valor é definido pelo próprio vendedor.</p>
          </div>
          <div>
            <p className="text-[10px] font-black tracking-[.14em] text-violet-300">PAGAMENTO</p>
            <p className="mt-1 text-xs leading-5 text-white/55">A liberação ocorre somente após confirmação.</p>
          </div>
          <div>
            <p className="text-[10px] font-black tracking-[.14em] text-violet-300">ACESSO</p>
            <p className="mt-1 text-xs leading-5 text-white/55">Arquivos protegidos e disponíveis na sua área de compras.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
