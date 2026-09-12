import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SubscriptionRow = {
  id: string;
  subscriber_user_id: string;
  plan_id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  auto_renew: boolean;
  created_at: string;
};

type PlanRow = { id: string; name: string; price: number; currency: string; duration_days: number };

type PurchaseRow = {
  subscription_id: string | null;
  status: string;
  amount: number;
  paid_at: string | null;
  created_at: string;
};

const money = (value: number, currency = "BRL") => new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(Number(value || 0));
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

function maskUserId(value: string) {
  if (!value) return "—";
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function statusLabel(status: string, endsAt: string | null) {
  if (status === "active" && endsAt && new Date(endsAt).getTime() < Date.now()) return "Expirado";
  if (status === "active") return "Ativo";
  if (status === "pending") return "Pendente";
  if (status === "expired") return "Expirado";
  if (status === "refunded") return "Estornado";
  return status;
}

export default async function FansSubscribersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase.from("fans_creators").select("id,display_name").eq("user_id", user.id).maybeSingle();
  if (!creator) redirect("/fans/ativar");

  const admin = createAdminClient();
  const [{ data: subscriptionData }, { data: planData }] = await Promise.all([
    admin.from("fans_subscriptions").select("id,subscriber_user_id,plan_id,status,starts_at,ends_at,auto_renew,created_at").eq("creator_id", creator.id).order("created_at", { ascending: false }).limit(500),
    admin.from("fans_plans").select("id,name,price,currency,duration_days").eq("creator_id", creator.id),
  ]);

  const subscriptions = (subscriptionData ?? []) as SubscriptionRow[];
  const plans = (planData ?? []) as PlanRow[];
  const planById = new Map(plans.map(plan => [plan.id, plan]));
  const subscriptionIds = subscriptions.map(subscription => subscription.id);

  const { data: purchaseData } = subscriptionIds.length > 0
    ? await admin.from("fans_purchases").select("subscription_id,status,amount,paid_at,created_at").in("subscription_id", subscriptionIds).order("created_at", { ascending: false })
    : { data: [] as PurchaseRow[] };

  const purchases = (purchaseData ?? []) as PurchaseRow[];
  const purchaseBySubscription = new Map<string, PurchaseRow[]>();
  for (const purchase of purchases) {
    if (!purchase.subscription_id) continue;
    const rows = purchaseBySubscription.get(purchase.subscription_id) ?? [];
    rows.push(purchase);
    purchaseBySubscription.set(purchase.subscription_id, rows);
  }

  const active = subscriptions.filter(subscription => subscription.status === "active" && (!subscription.ends_at || new Date(subscription.ends_at).getTime() >= Date.now()));
  const expired = subscriptions.filter(subscription => subscription.status === "expired" || (subscription.status === "active" && !!subscription.ends_at && new Date(subscription.ends_at).getTime() < Date.now()));
  const pending = subscriptions.filter(subscription => subscription.status === "pending");
  const uniqueActiveSubscribers = new Set(active.map(subscription => subscription.subscriber_user_id)).size;
  const recurring = active.filter(subscription => subscription.auto_renew).length;

  return (
    <main className="shell fansShell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div>
        <div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href="/fans">Visão geral</Link></div>
      </nav>

      <section className="hero fansHero">
        <div className="eyebrow">ASSINANTES · {creator.display_name}</div>

        <section className="fansMetrics">
          <article className="card"><span className="metricLabel">ASSINATURAS ATIVAS</span><strong>{active.length}</strong><p>{uniqueActiveSubscribers} assinante(s) com acesso vigente</p></article>
          <article className="card"><span className="metricLabel">EXPIRADAS</span><strong>{expired.length}</strong><p>Histórico de assinaturas encerradas</p></article>
          <article className="card"><span className="metricLabel">PENDENTES</span><strong>{pending.length}</strong><p>Registros aguardando confirmação</p></article>
          <article className="card"><span className="metricLabel">RENOVAÇÃO</span><strong>{recurring}</strong><p>Assinaturas marcadas para renovação</p></article>
        </section>

        <section className="card" style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            <div className="eyebrow">AUDIÊNCIA E RELACIONAMENTO</div>
            <h1>Seus assinantes</h1>
            <p>Este painel mostra somente assinaturas vinculadas ao seu espaço Fans. O identificador do assinante é mascarado para preservar a privacidade; pagamentos e períodos de acesso são os registros oficiais da operação.</p>

            <div style={{ marginTop: 24 }}>
              {subscriptions.length === 0 ? <div className="card"><p>Nenhuma assinatura registrada ainda.</p><p style={{ marginTop: 8 }}>Quando um fã concluir uma assinatura e o pagamento for confirmado, ela aparecerá aqui.</p></div> : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th align="left">Assinante</th>
                      <th align="left">Plano</th>
                      <th align="left">Situação</th>
                      <th align="left">Acesso</th>
                      <th align="left">Último pagamento</th>
                      <th align="right">Compras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map(subscription => {
                      const plan = planById.get(subscription.plan_id);
                      const subscriptionPurchases = purchaseBySubscription.get(subscription.id) ?? [];
                      const paidPurchases = subscriptionPurchases.filter(purchase => purchase.status === "paid");
                      const lastPaid = paidPurchases[0]?.paid_at ?? null;
                      const label = statusLabel(subscription.status, subscription.ends_at);
                      return (
                        <tr key={subscription.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "14px 8px 14px 0", fontFamily: "monospace", fontSize: 13 }}>{maskUserId(subscription.subscriber_user_id)}</td>
                          <td style={{ padding: "14px 8px" }}><strong>{plan?.name || "Plano indisponível"}</strong><div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{plan ? money(Number(plan.price), plan.currency) : "—"}</div></td>
                          <td style={{ padding: "14px 8px" }}>{label}{subscription.auto_renew ? <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>Renovação automática</div> : <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>Renovação manual</div>}</td>
                          <td style={{ padding: "14px 8px", whiteSpace: "nowrap" }}>{date(subscription.starts_at)}<br /><span style={{ color: "#64748b" }}>até {date(subscription.ends_at)}</span></td>
                          <td style={{ padding: "14px 8px", whiteSpace: "nowrap" }}>{date(lastPaid)}</td>
                          <td align="right" style={{ padding: "14px 0 14px 8px" }}>{paidPurchases.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="eyebrow">VISÃO OPERACIONAL</div>
          <h2>Como interpretar este painel</h2>
          <p>Uma assinatura ativa representa acesso vigente conforme o período registrado. Renovações geram novos registros de compra vinculados à mesma assinatura, permitindo acompanhar o histórico sem apagar períodos anteriores.</p>
          <p style={{ marginTop: 10 }}>Estornos e chargebacks permanecem refletidos no histórico financeiro e podem alterar a situação da assinatura conforme os períodos pagos remanescentes.</p>
          <div className="heroActions" style={{ marginTop: 18 }}><Link className="primaryButton" href="/fans/gerenciar/vendas">Ver vendas</Link><Link className="secondaryButton" href="/fans/gerenciar/recebimentos">Ver recebimentos</Link></div>
        </section>
      </section>
    </main>
  );
}
