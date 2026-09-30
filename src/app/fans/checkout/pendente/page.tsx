import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = { order?: string; product_type?: string };

function isContent(productType: string | undefined) {
  return productType === "digital_content" || productType === "profile_media";
}

export default function CheckoutPendingPage({ searchParams }: { searchParams: SearchParams }) {
  const content = isContent(searchParams.product_type);
  const order = searchParams.order;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{content ? "Pecatho · Conteúdo" : "Pecatho Fans · Checkout"}</p>
        <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-700">…</div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">Pagamento pendente</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">O provedor ainda não confirmou o pagamento. Não é necessário realizar uma nova compra agora. Assim que houver confirmação oficial, o acesso será atualizado.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {order ? <Link href={"/fans/checkout/sucesso?order=" + encodeURIComponent(order)} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Acompanhar pagamento</Link> : null}
          <Link href={content ? "/conteudos" : "/fans"} className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-900">{content ? "Voltar aos conteúdos" : "Voltar ao Fans"}</Link>
        </div>
      </section>
    </main>
  );
}
