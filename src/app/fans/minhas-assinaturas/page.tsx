import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function money(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(Number(value || 0));
}

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value)) : "—";
}

export default async function MyFansSubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/fans/minhas-assinaturas");

  const admin = createAdminClient();
  const { data: subscriptions, error } = await admin
    .from("fans_subscriptions")
    .select("id,creator_id,plan_id,status,starts_at,ends_at,auto_renew,created_at,updated_at")
    .eq("subscriber_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = await Promise.all((subscriptions ?? []).map(async subscription => {
    const [{ data: creator }, { data: plan }] = await Promise.all([
      admin.from("fans_creators").select("slug,display_name,status").eq("id", subscription.creator_id).maybeSingle(),
      admin.from("fans_plans").select("name,price,currency,duration_days,status").eq("id", subscription.plan_id).maybeSingle(),
    ]);
    const active = subscription.status === "active" && (!subscription.starts_at || new Date(subscription.starts_at).getTime() <= Date.now()) && (!subscription.ends_at || new Date(subscription.ends_at).getTime() >= Date.now());
    return { ...subscription, creator, plan, active };
  }));

  const activeCount = rows.filter(row => row.active).length;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <nav className="mx-auto mb-8 flex max-w-6xl items-center justify-between gap-4">
        <Link href="/fans" className="font-semibold text-slate-900">Pecatho <span className="text-slate-500">Fans</span></Link>
        <div className="flex flex-wrap gap-2 text-sm"><Link href="/fans" className="rounded-lg border bg-white px-3 py-2">Explorar</Link><Link href="/painel" className="rounded-lg bg-slate-900 px-3 py-2 text-white">Painel Pecatho</Link></div>
      </nav>

      <section className="mx-auto max-w-6xl">
        <header className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Pecatho Fans · Área do fã</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Minhas assinaturas</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Acompanhe os acessos adquiridos, os períodos de validade e o estado real de cada assinatura.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm"><span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">{activeCount} ativa(s)</span><span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">{rows.length} registro(s)</span></div>
        </header>

        <section className="mt-6 grid gap-4">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white p-10 text-center"><h2 className="text-xl font-bold text-slate-950">Você ainda não possui assinaturas</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Explore os criadores do Pecatho Fans e escolha um plano. A assinatura somente será criada após a confirmação oficial do pagamento.</p><Link href="/anunciantes" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Explorar Pecatho</Link></div>
          ) : rows.map(row => (
            <article key={row.id} className="rounded-2xl border bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{row.active ? "ATIVA" : row.status.toUpperCase()}</span>{row.auto_renew && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">RENOVAÇÃO AUTOMÁTICA</span>}</div><h2 className="mt-3 text-xl font-bold text-slate-950">{row.plan?.name || "Plano indisponível"}</h2><p className="mt-1 text-sm text-slate-600">{row.creator?.display_name || "Criador indisponível"}</p></div>
                <div className="text-left lg:text-right"><p className="text-2xl font-bold text-slate-950">{row.plan ? money(Number(row.plan.price), String(row.plan.currency || "BRL").trim() || "BRL") : "—"}</p><p className="text-sm text-slate-500">{row.plan ? `${row.plan.duration_days} dias` : "Plano indisponível"}</p></div>
              </div>
              <div className="mt-6 grid gap-3 border-t pt-5 text-sm sm:grid-cols-3"><div><span className="text-slate-500">Início</span><p className="mt-1 font-semibold text-slate-900">{date(row.starts_at)}</p></div><div><span className="text-slate-500">Término</span><p className="mt-1 font-semibold text-slate-900">{date(row.ends_at)}</p></div><div><span className="text-slate-500">Renovação</span><p className="mt-1 font-semibold text-slate-900">{row.auto_renew ? "Automática" : "Manual"}</p></div></div>
              {row.creator?.slug && <div className="mt-5"><Link href={`/fans/${row.creator.slug}`} className="inline-flex rounded-xl border px-4 py-2.5 text-sm font-semibold text-slate-900">Ver criador e conteúdo</Link></div>}
            </article>
          ))}
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">O estado exibido nesta área é derivado do registro de assinatura no banco. O retorno do checkout, isoladamente, não concede acesso.</p>
      </section>
    </main>
  );
}
