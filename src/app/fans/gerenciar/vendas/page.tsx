import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

export default async function FansSalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: creator } = await supabase.from("fans_creators").select("id,display_name").eq("user_id", user.id).maybeSingle();
  if (!creator) redirect("/fans/ativar");
  const admin = createAdminClient();
  const { data: sales } = await admin.from("fans_purchases").select("id,buyer_user_id,post_id,subscription_id,amount,platform_fee,creator_amount,currency,status,provider,paid_at,created_at").eq("creator_id", creator.id).order("created_at", { ascending: false }).limit(100);
  const paid = (sales || []).filter(s => s.status === "paid");
  const gross = paid.reduce((n, s) => n + Number(s.amount), 0);
  const net = paid.reduce((n, s) => n + Number(s.creator_amount), 0);
  const fees = paid.reduce((n, s) => n + Number(s.platform_fee), 0);
  return <main className="shell fansShell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div><div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href="/fans">Visão geral</Link></div></nav><section className="hero fansHero"><div className="eyebrow">VENDAS · {creator.display_name}</div><div className="fansMetrics"><article className="card"><span className="metricLabel">VENDAS PAGAS</span><strong>{paid.length}</strong><p>Transações confirmadas</p></article><article className="card"><span className="metricLabel">BRUTO</span><strong>{money(gross)}</strong><p>Valor recebido dos compradores</p></article><article className="card"><span className="metricLabel">TAXA PECATHO</span><strong>{money(fees)}</strong><p>Retenção registrada</p></article><article className="card"><span className="metricLabel">LÍQUIDO DO CRIADOR</span><strong>{money(net)}</strong><p>Antes de eventual saque</p></article></div><section className="card" style={{ overflowX: "auto" }}><div style={{ minWidth: 760 }}><div className="eyebrow">HISTÓRICO</div><h1>Vendas e monetização</h1><p>Somente pagamentos confirmados pelo provedor entram nos totais pagos. Estornos deixam de representar receita disponível.</p><div style={{ marginTop: 24 }}>{(sales || []).length === 0 ? <p>Nenhuma venda registrada ainda.</p> : <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th align="left">Data</th><th align="left">Tipo</th><th align="left">Status</th><th align="right">Bruto</th><th align="right">Taxa</th><th align="right">Criador</th></tr></thead><tbody>{(sales || []).map(s => <tr key={s.id} style={{ borderTop: "1px solid #e5e7eb" }}><td>{date(s.paid_at || s.created_at)}</td><td>{s.post_id ? "Conteúdo" : "Assinatura"}</td><td>{s.status}</td><td align="right">{money(Number(s.amount))}</td><td align="right">{money(Number(s.platform_fee))}</td><td align="right">{money(Number(s.creator_amount))}</td></tr>)}</tbody></table>}</div></div></section></section></main>;
}
