import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number | string | null | undefined, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.trim() || "BRL",
  }).format(Number(value || 0));
}

function date(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(parsed);
}

function daysRemaining(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(Math.ceil((parsed.getTime() - Date.now()) / 86_400_000), 0);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Ativa",
    canceled: "Cancelada",
    cancelled: "Cancelada",
    expired: "Expirada",
    pending: "Pendente",
    paused: "Pausada",
  };
  return labels[status.toLowerCase()] ?? status;
}

export default async function MyFansSubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/fans/minhas-assinaturas");

  const { data: subscriptions, error } = await supabase
    .from("fans_subscriptions")
    .select(
      "id, creator_id, plan_id, status, starts_at, ends_at, auto_renew, created_at, updated_at, fans_creators(slug, display_name, status), fans_plans(name, price, currency, duration_days, status)",
    )
    .eq("subscriber_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fans/minhas-assinaturas] Falha ao carregar assinaturas:", error);
  }

  const rows = (subscriptions ?? []).map((subscription) => {
    const creator = Array.isArray(subscription.fans_creators)
      ? subscription.fans_creators[0]
      : subscription.fans_creators;
    const plan = Array.isArray(subscription.fans_plans)
      ? subscription.fans_plans[0]
      : subscription.fans_plans;
    const remaining = daysRemaining(subscription.ends_at);

    return {
      ...subscription,
      creator,
      plan,
      remaining,
    };
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
            Pecatho Fans
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Minhas assinaturas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Acompanhe seus planos, validade e renovação automática.
          </p>
        </div>
        <Link
          href="/fans"
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
        >
          Explorar Fans
        </Link>
      </div>

      {error ? (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6 text-sm text-amber-100">
          Não foi possível carregar suas assinaturas neste momento. Atualize a página
          ou tente novamente mais tarde.
        </section>
      ) : rows.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h2 className="text-xl font-semibold text-white">Nenhuma assinatura encontrada</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Quando você assinar um plano, ele aparecerá nesta área.
          </p>
          <Link
            href="/fans"
            className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Conhecer criadores
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((subscription) => (
            <article
              key={subscription.id}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Criador</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    {subscription.creator?.display_name ?? "Criador indisponível"}
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-neutral-300">
                  {statusLabel(subscription.status)}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500">Plano</p>
                  <p className="mt-1 font-medium text-white">
                    {subscription.plan?.name ?? "Plano indisponível"}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500">Valor</p>
                  <p className="mt-1 font-medium text-white">
                    {money(subscription.plan?.price, subscription.plan?.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500">Início</p>
                  <p className="mt-1 text-neutral-200">{date(subscription.starts_at)}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Validade</p>
                  <p className="mt-1 text-neutral-200">{date(subscription.ends_at)}</p>
                </div>
              </div>

              {subscription.remaining !== null && subscription.status === "active" ? (
                <p className="mt-5 text-sm text-neutral-300">
                  {subscription.remaining === 0
                    ? "A assinatura vence hoje."
                    : `${subscription.remaining} dia(s) restante(s).`}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-sm text-neutral-400">
                  Renovação automática: {subscription.auto_renew ? "Ativa" : "Desativada"}
                </span>
                {subscription.creator?.slug ? (
                  <Link
                    href={`/fans/${subscription.creator.slug}`}
                    className="text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
                  >
                    Ver perfil
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
