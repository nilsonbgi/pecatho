"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ContentSellerReview from "@/components/ContentSellerReview";

type Purchase = {
  id: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  created_at: string;
  product: {
    id: string;
    title: string;
    description: string | null;
    product_type: string;
    price: number;
    currency: string;
    owner_type: string;
    owner_id: string;
    seller: { name: string; href: string } | null;
  };
  files: {
    count: number;
    mediaTypes: string[];
  };
};

type Download = {
  id: string;
  filename: string;
  url: string;
  expires_in: number;
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(value);
}

function dateTime(value: string | null) {
  if (!value) return "Pagamento confirmado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function typeLabel(type: string) {
  if (type === "single_image") return "Imagem exclusiva";
  if (type === "single_video") return "Vídeo exclusivo";
  return "Pacote exclusivo";
}

function mediaLabel(types: string[]) {
  const labels = types.map((type) => {
    if (type === "image") return "imagem";
    if (type === "video") return "vídeo";
    if (type === "audio") return "áudio";
    return type;
  });
  return labels.length ? labels.join(" · ") : "conteúdo digital";
}

export default function MinhasComprasClient() {
  const params = useSearchParams();
  const sale = params.get("sale");

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [selectedSale, setSelectedSale] = useState(sale ?? "");
  const [loading, setLoading] = useState(true);
  const [loadingDownloads, setLoadingDownloads] = useState(false);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [mediaPurchases, setMediaPurchases] = useState<Array<{
    id: string; media_id: string; amount: number; currency: string; purchased_at: string; expires_at: string | null;
    kind: string; url: string; access_expires_in: number; profile: { slug: string; display_name: string | null };
  }>>([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState("");

  const selectedPurchase = useMemo(
    () => purchases.find((purchase) => purchase.id === selectedSale) ?? null,
    [purchases, selectedSale],
  );

  async function loadDownloads(saleId: string) {
    setSelectedSale(saleId);
    setDownloads([]);
    setDownloadError("");
    setLoadingDownloads(true);

    try {
      const response = await fetch(
        `/api/conteudos/download?sale_id=${encodeURIComponent(saleId)}`,
        { cache: "no-store" },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível liberar os arquivos.");
      setDownloads(body.downloads ?? []);
    } catch (downloadFailure) {
      setDownloadError(
        downloadFailure instanceof Error
          ? downloadFailure.message
          : "Não foi possível liberar os arquivos.",
      );
    } finally {
      setLoadingDownloads(false);
    }
  }

  useEffect(() => {
    fetch("/api/anunciantes/media/purchases", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Não foi possível carregar sua galeria adquirida.");
        setMediaPurchases(body.purchases ?? []);
      })
      .catch((failure) => setMediaError(failure instanceof Error ? failure.message : "Não foi possível carregar sua galeria adquirida."))
      .finally(() => setMediaLoading(false));

    fetch("/api/conteudos/minhas-compras", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Não foi possível carregar suas compras.");
        setPurchases(body.purchases ?? []);

        const initialSale = sale ?? body.purchases?.[0]?.id ?? "";
        if (initialSale) {
          await loadDownloads(initialSale);
        }
      })
      .catch((loadFailure) => {
        setError(
          loadFailure instanceof Error
            ? loadFailure.message
            : "Não foi possível carregar suas compras.",
        );
      })
      .finally(() => setLoading(false));
  }, [sale]);

  return (
    <main className="min-h-screen bg-[#07070a] px-4 py-8 text-white sm:px-6 sm:py-12">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="text-[10px] font-black tracking-[0.28em] text-violet-400">
            PECATHO · BIBLIOTECA
          </div>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                Minhas compras
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Todo conteúdo digital adquirido fica reunido aqui. O arquivo original permanece
                protegido e cada acesso gera um link temporário de download.
              </p>
            </div>
            <Link
              href="/conteudos"
              className="inline-flex w-fit rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Explorar conteúdos
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-sm text-white/60">
            Carregando sua biblioteca…
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-sm font-semibold text-red-200">
            {error}
          </div>
        ) : purchases.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <div className="text-4xl">◈</div>
            <h2 className="mt-4 text-xl font-black">Sua biblioteca ainda está vazia</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
              Quando uma compra de conteúdo for confirmada, ela aparecerá aqui para acesso.
            </p>
            <Link
              href="/conteudos"
              className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white hover:bg-violet-500"
            >
              Ver conteúdos
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <div className="space-y-3">
              {purchases.map((purchase) => {
                const active = purchase.id === selectedSale;
                return (
                  <button
                    key={purchase.id}
                    type="button"
                    onClick={() => loadDownloads(purchase.id)}
                    className={`w-full rounded-2xl border p-5 text-left transition ${
                      active
                        ? "border-violet-400/60 bg-violet-500/10 shadow-[0_0_40px_rgba(139,92,246,0.12)]"
                        : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
                          {typeLabel(purchase.product.product_type)}
                        </span>
                        <h2 className="mt-1 truncate text-base font-black">{purchase.product.title}</h2>
                        {purchase.product.seller ? (
                          <span className="mt-1 block truncate text-[10px] font-black uppercase tracking-[.12em] text-violet-300">
                            {purchase.product.seller.name}
                          </span>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-sm font-black">
                        {money(purchase.amount, purchase.currency)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
                      <span>{dateTime(purchase.paid_at)}</span>
                      <span>{purchase.files.count} arquivo{purchase.files.count === 1 ? "" : "s"}</span>
                      <span>{mediaLabel(purchase.files.mediaTypes)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 sm:p-7">
              {selectedPurchase ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-black tracking-[0.2em] text-emerald-300">
                        COMPRA CONFIRMADA
                      </div>
                      <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                        {selectedPurchase.product.title}
                      </h2>
                      {selectedPurchase.product.seller ? (
                        <div className="mt-2">
                          <Link
                            href={selectedPurchase.product.seller.href}
                            className="text-xs font-black text-violet-300 hover:text-violet-200"
                          >
                            Ver perfil de {selectedPurchase.product.seller.name} →
                          </Link>
                        </div>
                      ) : null}
                    </div>
                    <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-300">
                      PAGO
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-violet-400/10 bg-violet-500/[0.06] p-4 text-xs leading-5 text-white/50">
                    Compra vinculada ao vendedor. Seu acesso permanece associado à sua conta Pecatho.
                  </div>
                  {selectedPurchase.product.seller ? (
                    <ContentSellerReview
                      sourceType="digital_content"
                      sourceId={selectedPurchase.id}
                      sellerName={selectedPurchase.product.seller.name}
                    />
                  ) : null}

                  {selectedPurchase.product.description ? (
                    <p className="mt-4 text-sm leading-6 text-white/55">
                      {selectedPurchase.product.description}
                    </p>
                  ) : null}

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[10px] font-black uppercase tracking-wider text-white/35">
                        Valor
                      </div>
                      <div className="mt-1 text-sm font-black">
                        {money(selectedPurchase.amount, selectedPurchase.currency)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[10px] font-black uppercase tracking-wider text-white/35">
                        Arquivos
                      </div>
                      <div className="mt-1 text-sm font-black">
                        {selectedPurchase.files.count}
                      </div>
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                      Acesso ao conteúdo
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/40">
                      Gere os links protegidos somente quando precisar baixar. Eles expiram após
                      alguns minutos por segurança.
                    </p>

                    {loadingDownloads ? (
                      <div className="mt-5 rounded-2xl bg-white/[0.05] p-4 text-sm text-white/60">
                        Liberando arquivos…
                      </div>
                    ) : downloadError ? (
                      <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
                        {downloadError}
                      </div>
                    ) : downloads.length === 0 ? (
                      <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                        O pagamento foi confirmado, mas não há arquivos disponíveis nesta compra.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {downloads.map((download) => (
                          <a
                            key={download.id}
                            href={download.url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-violet-400/40 hover:bg-violet-500/10"
                          >
                            <span className="min-w-0">
                              <strong className="block truncate text-sm">{download.filename}</strong>
                              <small className="text-xs text-white/40">
                                Link válido por {Math.round(download.expires_in / 60)} minutos
                              </small>
                            </span>
                            <span className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950">
                              Baixar
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="grid min-h-[360px] place-items-center text-center text-sm text-white/45">
                  Selecione uma compra para acessar os arquivos.
                </div>
              )}
            </section>
          </div>
        )}

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.05] p-6 sm:p-7">
          <div>
            <div className="text-[10px] font-black tracking-[0.2em] text-violet-300">GALERIA ADQUIRIDA</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Fotos e vídeos comprados</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Conteúdos pagos diretamente no perfil das anunciantes também ficam reunidos aqui. Os arquivos permanecem privados e cada visualização gera um link temporário.</p>
          </div>
          {mediaLoading ? <div className="mt-5 rounded-2xl bg-white/[0.04] p-4 text-sm text-white/55">Carregando sua galeria adquirida…</div>
          : mediaError ? <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{mediaError}</div>
          : mediaPurchases.length === 0 ? <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/45">Você ainda não comprou fotos ou vídeos exclusivos diretamente de uma anunciante.</div>
          : <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{mediaPurchases.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
              <div className="aspect-[4/5] bg-black">{item.kind === "video" ? <video src={item.url} controls playsInline preload="metadata" className="h-full w-full object-cover" /> : <img src={item.url} alt={item.profile.display_name ? `Conteúdo comprado de ${item.profile.display_name}` : "Conteúdo comprado"} className="h-full w-full object-cover" />}</div>
              <div className="p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">COMPRA CONFIRMADA</div>
                <div className="mt-1 font-black">{item.profile.display_name || "Anunciante Pecatho"}</div>
                <div className="mt-1 text-xs text-white/40">{item.kind === "video" ? "Vídeo exclusivo" : "Imagem exclusiva"} · {money(item.amount, item.currency)}</div>
                <ContentSellerReview
                  sourceType="profile_media"
                  sourceId={item.id}
                  sellerName={item.profile.display_name}
                />
                <div className="mt-3 flex items-center justify-between gap-3"><Link href={`/anunciantes/${item.profile.slug}#galeria`} className="text-xs font-black text-violet-300 hover:text-violet-200">Ver perfil</Link><a href={item.url} target="_blank" rel="noreferrer" download className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">Abrir / baixar</a></div>
                <div className="mt-2 text-[10px] text-white/30">Link de acesso válido por {Math.round(item.access_expires_in / 60)} minutos.</div>
              </div>
            </article>
          ))}</div>}
        </section>

        <div className="mt-8">
          <Link href="/" className="text-sm font-bold text-violet-300 hover:text-violet-200">
            Voltar ao Pecatho
          </Link>
        </div>
      </section>
    </main>
  );
}
