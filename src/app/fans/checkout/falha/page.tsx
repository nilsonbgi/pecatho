import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = { product_type?: string };

function isContent(productType: string | undefined) {
  return productType === "digital_content" || productType === "profile_media";
}

export default function CheckoutFailurePage({ searchParams }: { searchParams: SearchParams }) {
  const content = isContent(searchParams.product_type);
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{content ? "Pecatho · Conteúdo" : "Pecatho Fans · Checkout"}</p>
        <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-700">×</div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">Pagamento não concluído</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">O pagamento não foi confirmado. Nenhum acesso ou conteúdo é liberado enquanto a operação não estiver oficialmente confirmada.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={content ? "/conteudos" : "/fans"} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">{content ? "Voltar aos conteúdos" : "Voltar ao Fans"}</Link>
          <Link href="/conteudos/minhas-compras" className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-900">Minhas compras</Link>
        </div>
      </section>
    </main>
  );
}
