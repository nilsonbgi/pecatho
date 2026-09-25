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

  return (
    <section
      id="conteudo-exclusivo"
      className="relative overflow-hidden rounded-[30px] border border-violet-200/20 bg-gradient-to-br from-[#09090f] via-[#151022] to-[#2a1240] p-5 text-white shadow-[0_24px_70px_rgba(76,29,149,.18)] sm:p-8"
    >
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -bottom-28 -left-16 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-black tracking-[.22em] text-violet-300">
              LOJA PRIVADA · PECATHO
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.055em] sm:text-3xl">
              Conteúdo exclusivo
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Conteúdos exclusivos vendidos diretamente por este perfil. O preço é definido pelo
              próprio vendedor e o acesso é liberado somente após a confirmação do pagamento.
            </p>
          </div>
          {products.length > 3 && compact ? (
            <Link
              href={`/conteudos?owner_type=${encodeURIComponent(ownerType)}&owner_id=${encodeURIComponent(ownerId)}`}
              className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-black text-white no-underline transition hover:bg-white/10"
            >
              Ver todos deste perfil
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
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
                  className="group relative min-h-72 overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-white no-underline transition duration-200 hover:-translate-y-1 hover:border-violet-300/40"
                >
                  <div className="absolute inset-0">
                    {product.cover_url ? (
                      <img
                        src={product.cover_url}
                        alt=""
                        className="h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-105 group-hover:opacity-55"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/10" />
                  </div>

                  <div className="relative flex min-h-72 flex-col justify-between p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-2.5 py-1 text-[9px] font-black tracking-[.12em] text-violet-100 backdrop-blur">
                        {typeLabel[product.product_type]}
                      </span>
                      <span className="rounded-full bg-black/55 px-3 py-1.5 text-sm font-black backdrop-blur">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: product.currency || "BRL",
                        }).format(Number(product.price))}
                      </span>
                    </div>

                    <div>
                      <h3 className="line-clamp-2 text-lg font-black tracking-[-.025em]">
                        {product.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/65">
                        {product.description || "Conteúdo digital exclusivo disponível para compra."}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-black">
                        <span className="text-white/55">
                          {product.product_type === "package" ? "Pacote de arquivos" : "Acesso individual"}
                        </span>
                        <span className="text-violet-200 transition group-hover:translate-x-0.5">
                          Ver e comprar →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
        </div>

        {!compact && products.length > 3 ? (
          <div className="mt-5 text-center">
            <Link href="/conteudos" className="text-xs font-black text-violet-200 no-underline hover:text-white">
              Explorar outros conteúdos do Pecatho →
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
