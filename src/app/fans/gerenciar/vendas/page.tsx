import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SaleRow = {
  id: string;
  buyer_user_id: string;
  post_id: string | null;
  subscription_id: string | null;
  amount: number | string;
  platform_fee: number | string;
  creator_amount: number | string;
  currency: string;
  status: string;
  provider: string | null;
  paid_at: string | null;
  created_at: string;
  access_starts_at: string | null;
  access_ends_at: string | null;
};

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    paid: "Pago",
    pending: "Pendente",
    refunded: "Estornado",
    chargeback: "Contestação",
    cancelled: "Cancelado",
  };
  return labels[status] ?? status;
}

export default async function FansSalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("fans_creators")
    .select("id,display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!creator) redirect("/fans/ativar");

  const admin = createAdminClient();
  const { data: salesData } = await admin
    .from("fans_purchases")
    .select("id,buyer_user_id,post_id,subscription_id,amount,platform_fee,creator_amount,currency,status,provider,paid_at,created_at,access_starts_at,access_ends_at")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const sales = (salesData ?? []) as SaleRow[];
  const paid = sales.filter(s => s.status === "paid");
  const reversed = sales.filter(s => s.status === "refunded" || s.status === "chargeback");
  const pending = sales.filter(s => s.status === "pending");
  const gross = paid.reduce((n, s) => n + Number(s.amount), 0);
  const net = paid.reduce((n, s) => n + Number(s.creator_amount), 0);
  const fees = paid.reduce((n, s) => n + Number(s.platform_fee), 0);
  const reversedGross = reversed.reduce((n, s) => n + Number(s.amount), 0);

  return (
    <main className="shell fansShell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div>
        <div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href="/fans">Visão geral</Link></div>
      </nav>

      <section className="hero fansHero">
        <div className="eyebrow">VENDAS · {creator.display_name}</div>
        <div className="fansMetrics">
          <article className="card"><span className="metricLabel">VENDAS PAGAS</span><strong>{paid.length}</strong><p>Transações confirmadas</p></article>
          <article className="card"><span className="metricLabel">BRUTO CONFIRMADO</span><strong>{money(gross)}</strong><p>Compras efetivamente pagas</p></article>
          <article className="card"><span className="metricLabel">TAXA PECATHO</span><strong>{money(fees)}</strong><p>Retenção registrada nas vendas pagas</p></article>
          <article className="card"><span className="metricLabel">LÍQUIDO DO CRIADOR</span><strong>{money(net)}</strong><p>Antes de recebimentos solicitados</p></article>
        </div>

        <section className="card" style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 920 }}>
            <div className="eyebrow">CONCILIAÇÃO COMERCIAL</div>
            <h1>Vendas e monetização</h1>
            <p>Somente pagamentos confirmados pelo provedor entram na receita paga. Estornos e contestações deixam de compor o saldo de vendas confirmado, mas permanecem no histórico para rastreabilidade.</p>

            <div className="fansMetrics" style={{ marginTop: 20 }}>
              <article className="card"><span className="metricLabel">PENDENTES</span><strong>{pending.length}</strong><p>Aguardando confirmação</p></article>
              <article className="card"><span className="metricLabel">ESTORNOS / CONTESTAÇÕES</span><strong>{reversed.length}</strong><p>{money(reversedGross)} em valor bruto</p></article>
              <article className="card"><span className="metricLabel">OPERAÇÕES</span><strong>{sales.length}</strong><p>Últimas 200 operações</p></article>
            </div>

            <div style={{ marginTop: 24 }}>
              {sales.length === 0 ? <p>Nenhuma venda registrada ainda.</p> : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th align="left">Data</th>
                      <th align="left">Tipo</th>
                      <th align="left">Status</th>
                      <th align="left">Provedor</th>
                      <th align="right">Bruto</th>
                      <th align="right">Taxa</th>
                      <th align="right">Criador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(s => (
                      <tr key={s.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                        <td>{date(s.paid_at || s.created_at)}</td>
                        <td>{s.post_id ? "Conteúdo" : "Assinatura"}</td>
                        <td>{statusLabel(s.status)}</td>
                        <td>{s.provider || "—"}</td>
                        <td align="right">{money(Number(s.amount))}</td>
                        <td align="right">{money(Number(s.platform_fee))}</td>
                        <td align="right">{money(Number(s.creator_amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <p style={{ marginTop: 20 }}>A conciliação de recebimentos é feita separadamente em <Link href="/fans/gerenciar/recebimentos">Recebimentos</Link>, onde solicitações pendentes também reduzem o saldo disponível para novos saques.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
