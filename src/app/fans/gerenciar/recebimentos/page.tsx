import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

export default async function FansReceiptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: creator } = await supabase.from("fans_creators").select("id,display_name").eq("user_id", user.id).maybeSingle();
  if (!creator) redirect("/fans/ativar");
  const admin = createAdminClient();
  const { data: ledger } = await admin.from("fans_financial_ledger").select("id,entry_type,direction,amount,currency,status,provider,provider_reference,occurred_at,created_at").eq("creator_id", creator.id).order("occurred_at", { ascending: false }).limit(200);
  const posted = (ledger || []).filter(e => e.status === "posted");
  const credits = posted.filter(e => e.direction === "credit").reduce((n, e) => n + Number(e.amount), 0);
  const debits = posted.filter(e => e.direction === "debit").reduce((n, e) => n + Number(e.amount), 0);
  const available = Math.max(credits - debits, 0);
  const { data: payouts } = await admin.from("fans_payout_requests").select("id,amount,currency,status,provider,provider_reference,requested_at,processed_at,rejection_reason").eq("creator_id", creator.id).order("requested_at", { ascending: false }).limit(50);
  return <main className="shell fansShell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div><div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href="/fans">Visão geral</Link></div></nav><section className="hero fansHero"><div className="eyebrow">RECEBIMENTOS · {creator.display_name}</div><div className="fansMetrics"><article className="card"><span className="metricLabel">CRÉDITOS</span><strong>{money(credits)}</strong><p>Movimentos financeiros postados</p></article><article className="card"><span className="metricLabel">DÉBITOS</span><strong>{money(debits)}</strong><p>Taxas e reversões registradas</p></article><article className="card"><span className="metricLabel">SALDO CONTÁBIL</span><strong>{money(available)}</strong><p>Antes de solicitações de saque</p></article><article className="card"><span className="metricLabel">SOLICITAÇÕES</span><strong>{(payouts || []).length}</strong><p>Histórico de recebimentos</p></article></div><section className="card" style={{ overflowX: "auto" }}><div style={{ minWidth: 760 }}><div className="eyebrow">EXTRATO</div><h1>Extrato financeiro</h1><p>O extrato é alimentado pelo ledger financeiro imutável da operação. Nenhum saldo é calculado a partir de valores enviados pelo navegador.</p><div style={{ marginTop: 24 }}>{posted.length === 0 ? <p>Nenhum movimento financeiro registrado ainda.</p> : <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th align="left">Data</th><th align="left">Evento</th><th align="left">Direção</th><th align="right">Valor</th><th align="left">Provedor</th></tr></thead><tbody>{posted.map(e => <tr key={e.id} style={{ borderTop: "1px solid #e5e7eb" }}><td>{date(e.occurred_at)}</td><td>{e.entry_type}</td><td>{e.direction === "credit" ? "Crédito" : "Débito"}</td><td align="right">{money(Number(e.amount))}</td><td>{e.provider || "—"}</td></tr>)}</tbody></table>}</div></div></section><section className="card" style={{ marginTop: 20, overflowX: "auto" }}><div style={{ minWidth: 760 }}><div className="eyebrow">SAQUES</div><h2>Solicitações de recebimento</h2><p>O pedido de saque continua sujeito às regras operacionais e antifraude da Pecatho.</p><div style={{ marginTop: 20 }}>{(payouts || []).length === 0 ? <p>Nenhuma solicitação registrada ainda.</p> : <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th align="left">Solicitado</th><th align="right">Valor</th><th align="left">Status</th><th align="left">Processado</th></tr></thead><tbody>{payouts.map(p => <tr key={p.id} style={{ borderTop: "1px solid #e5e7eb" }}><td>{date(p.requested_at)}</td><td align="right">{money(Number(p.amount))}</td><td>{p.status}</td><td>{date(p.processed_at)}</td></tr>)}</tbody></table>}</div></div></section></section></main>;
}
