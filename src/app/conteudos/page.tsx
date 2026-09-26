import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ owner_type?: string; owner_id?: string }>;
};

function formatPrice(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

function productLabel(productType: string) {
  if (productType === "package") return "PACOTE";
  if (productType === "single_video") return "VÍDEO";
  return "IMAGEM";
}

export default async function ConteudosPage({ searchParams }: Props) {
  const params = await searchParams;
  const ownerType =
    params.owner_type === "advertiser" || params.owner_type === "creator"
      ? params.owner_type
      : null;
  const ownerId =
    typeof params.owner_id === "string" && /^[0-9a-f-]{36}$/i.test(params.owner_id)
      ? params.owner_id
      : null;

  const supabase = await createClient();
  const admin = createAdminClient();

  let query = supabase
    .from("digital_content_products")
    .select(
      "id,title,description,product_type,price,currency,owner_type,owner_id,cover_bucket,cover_path",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);

  if (ownerType && ownerId) {
    query = query.eq("owner_type", ownerType).eq("owner_id", ownerId);
  }

  const { data: products } = await query;

  const productsWithCovers = await Promise.all(
    (products ?? []).map(async (product) => {
      let coverUrl: string | null = null;

      if (product.cover_bucket && product.cover_path) {
        const { data: signed } = await admin.storage
          .from(product.cover_bucket)
          .createSignedUrl(product.cover_path, 300);
        coverUrl = signed?.signedUrl ?? null;
      }

      return { ...product, coverUrl };
    }),
  );

  const scoped = Boolean(ownerType && ownerId);
  let sellerName = "";
  let sellerProfileHref = "";

  if (scoped && ownerType === "advertiser" && ownerId) {
    const { data: owner } = await supabase
      .from("advertiser_profiles")
      .select("display_name,title,slug")
      .eq("id", ownerId)
      .eq("status", "published")
      .maybeSingle();
    sellerName = owner?.display_name || owner?.title || "Anunciante";
    sellerProfileHref = owner?.slug ? `/anunciantes/${owner.slug}` : "";
  } else if (scoped && ownerType === "creator" && ownerId) {
    const { data: owner } = await supabase
      .from("fans_creators")
      .select("display_name,slug")
      .eq("id", ownerId)
      .eq("status", "active")
      .maybeSingle();
    sellerName = owner?.display_name || "Criador";
    sellerProfileHref = owner?.slug ? `/fans/${owner.slug}` : "";
  }

  const sellerMap = new Map<string, { name: string; href: string }>();

  if (!scoped && productsWithCovers.length > 0) {
    const advertiserIds = [
      ...new Set(
        productsWithCovers
          .filter((product) => product.owner_type === "advertiser")
          .map((product) => product.owner_id),
      ),
    ];
    const creatorIds = [
      ...new Set(
        productsWithCovers
          .filter((product) => product.owner_type === "creator")
          .map((product) => product.owner_id),
      ),
    ];

    const [{ data: advertisers }, { data: creators }] = await Promise.all([
      advertiserIds.length
        ? admin
            .from("advertiser_profiles")
            .select("id,display_name,title,slug")
            .in("id", advertiserIds)
            .eq("status", "published")
        : Promise.resolve({ data: [] as Array<{ id: string; display_name: string | null; title: string | null; slug: string | null }> }),
      creatorIds.length
        ? admin
            .from("fans_creators")
            .select("id,display_name,slug")
            .in("id", creatorIds)
            .eq("status", "active")
        : Promise.resolve({ data: [] as Array<{ id: string; display_name: string | null; slug: string | null }> }),
    ]);

    for (const advertiser of advertisers ?? []) {
      sellerMap.set(advertiser.id, {
        name: advertiser.display_name || advertiser.title || "Anunciante",
        href: advertiser.slug ? `/anunciantes/${advertiser.slug}` : "",
      });
    }

    for (const creator of creators ?? []) {
      sellerMap.set(creator.id, {
        name: creator.display_name || "Criador",
        href: creator.slug ? `/fans/${creator.slug}` : "",
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[30px] bg-[#090a0f] p-7 text-white sm:p-10">
          <div className="text-[10px] font-black tracking-[.2em] text-violet-300">
            PECATHO · LOJA
          </div>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-[-.06em]">
                {scoped ? "Loja deste perfil" : "Conteúdo exclusivo"}
              </h1>
              {scoped && sellerName ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black tracking-[.12em] text-violet-200">
                    VENDEDOR · {sellerName.toUpperCase()}
                  </span>
                  {sellerProfileHref ? (
                    <Link
                      href={sellerProfileHref}
                      className="text-xs font-black text-white underline decoration-violet-300/50 underline-offset-4"
                    >
                      Voltar ao perfil →
                    </Link>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                {scoped
                  ? "Conteúdos publicados diretamente por este anunciante ou criador. Cada item possui preço próprio e é liberado somente após a confirmação do pagamento."
                  : "Imagens, vídeos e pacotes publicados por anunciantes e criadores. Escolha, pague e receba o acesso aos arquivos após a confirmação."}
              </p>
            </div>
            {scoped && (
              <Link
                href="/conteudos"
                className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[.06] px-5 py-3 text-xs font-black text-white no-underline transition hover:bg-white/10"
              >
                Ver toda a loja →
              </Link>
            )}
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-500">
            {scoped
              ? `${productsWithCovers.length} conteúdo(s) deste vendedor`
              : `${productsWithCovers.length} conteúdo(s) disponíveis`}
          </div>
          {!scoped ? (
            <div className="text-xs text-slate-400">
              A loja global é uma vitrine complementar. Os perfis dos vendedores concentram a experiência principal.
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {productsWithCovers.map((p) => {
            const seller = sellerMap.get(p.owner_id);
            return (
              <article
                key={p.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
              <Link href={`/conteudos/${p.id}`} className="block no-underline">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                {p.coverUrl ? (
                  <img
                    src={p.coverUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-950 via-violet-950/80 to-slate-900 px-6 text-center">
                    <div>
                      <div className="text-[10px] font-black tracking-[.22em] text-violet-300">
                        PECATHO · EXCLUSIVO
                      </div>
                      <div className="mt-2 text-2xl font-black text-white">
                        {productLabel(p.product_type)}
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1.5 text-[9px] font-black tracking-[.14em] text-white backdrop-blur">
                  {productLabel(p.product_type)}
                </div>
                <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-slate-950 shadow-lg">
                  {formatPrice(p.price)}
                </div>
              </div>
              </Link>

              <div className="p-5">
                {!scoped && seller ? (
                  <div className="mb-3 flex items-center justify-between gap-3">
                    {seller.href ? (
                      <Link
                        href={seller.href}
                        className="min-w-0 truncate text-[10px] font-black uppercase tracking-[.12em] text-slate-500 no-underline hover:text-violet-700"
                      >
                        {seller.name}
                      </Link>
                    ) : (
                      <span className="min-w-0 truncate text-[10px] font-black uppercase tracking-[.12em] text-slate-500">
                        {seller.name}
                      </span>
                    )}
                    <span className="shrink-0 text-[9px] font-bold text-slate-400">
                      {p.owner_type === "creator" ? "CRIADOR" : "ANUNCIANTE"}
                    </span>
                  </div>
                ) : null}

                <h2 className="line-clamp-2 text-lg font-black tracking-tight text-slate-950">
                  {p.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                  {p.description || "Conteúdo digital exclusivo."}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[.12em] text-violet-600">
                    {scoped
                      ? "Venda direta deste perfil"
                      : p.owner_type === "creator"
                        ? "Criador"
                        : "Anunciante"}
                  </span>
                  <span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white transition group-hover:bg-violet-700">
                    Ver conteúdo
                  </span>
                </div>
              </div>
            </article>
            );
          })}
        </div>

        {productsWithCovers.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-lg font-black text-slate-900">
              {scoped
                ? "Esta loja ainda não tem conteúdos publicados."
                : "Ainda não há conteúdos publicados para venda."}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {scoped
                ? "Quando este perfil publicar novos conteúdos, eles aparecerão aqui automaticamente."
                : "Novos conteúdos publicados por anunciantes e criadores aparecerão aqui automaticamente."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
