import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ owner_type?: string; owner_id?: string }>;
};

export default async function ConteudosPage({ searchParams }: Props) {
  const params = await searchParams;
  const ownerType = params.owner_type === "advertiser" || params.owner_type === "creator" ? params.owner_type : null;
  const ownerId = typeof params.owner_id === "string" && /^[0-9a-f-]{36}$/i.test(params.owner_id) ? params.owner_id : null;

  const supabase = await createClient();

  let query = supabase
    .from("digital_content_products")
    .select("id,title,description,product_type,price,currency,owner_type,owner_id")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);

  if (ownerType && ownerId) {
    query = query.eq("owner_type", ownerType).eq("owner_id", ownerId);
  }

  const { data: products } = await query;

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
                    <Link href={sellerProfileHref} className="text-xs font-black text-white underline decoration-violet-300/50 underline-offset-4">
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(products ?? []).map((p) => (
            <Link
              key={p.id}
              href={`/conteudos/${p.id}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="text-[10px] font-black tracking-[.14em] text-violet-600">
                {p.product_type === "package"
                  ? "PACOTE"
                  : p.product_type === "single_video"
                    ? "VÍDEO"
                    : "IMAGEM"}
              </div>
              <h2 className="mt-2 text-lg font-black text-slate-950">{p.title}</h2>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                {p.description || "Conteúdo digital exclusivo."}
              </p>
              <div className="mt-5 flex items-center justify-between">
                <strong className="text-lg">
                  R$ {Number(p.price).toFixed(2).replace(".", ",")}
                </strong>
                <span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                  Ver conteúdo
                </span>
              </div>
            </Link>
          ))}
        </div>

        {(products ?? []).length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-lg font-black text-slate-900">
              {scoped ? "Esta loja ainda não tem conteúdos publicados." : "Ainda não há conteúdos publicados para venda."}
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
