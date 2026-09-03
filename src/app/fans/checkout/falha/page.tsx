import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CheckoutResultPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pecatho Fans · Checkout</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Pagamento não concluído</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">O pagamento não foi confirmado. Você pode retornar ao conteúdo e tentar novamente, se desejar.</p>
        <Link href="/fans" className="mt-7 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Voltar ao Fans</Link>
      </section>
    </main>
  );
}
