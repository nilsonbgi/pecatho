"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Payout = { id: string; creator_id: string; amount: number; currency: string; status: string; provider: string | null; provider_reference: string | null; requested_at: string; processed_at: string | null; rejection_reason: string | null };
type Creator = { id: string; display_name: string; slug: string; user_id: string };

const statusLabel: Record<string,string> = { requested: "Solicitado", approved: "Aprovado", processing: "Em processamento", paid: "Pago", rejected: "Rejeitado", failed: "Falhou", cancelled: "Cancelado" };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminPayoutsPage() {
  const supabase = createClient();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [creators, setCreators] = useState<Record<string, Creator>>({});
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const { data, error: e } = await supabase.from("fans_payout_requests").select("id,creator_id,amount,currency,status,provider,provider_reference,requested_at,processed_at,rejection_reason").order("requested_at", { ascending: false });
    if (e) { setError(e.message); return; }
    const rows = (data || []) as Payout[];
    setPayouts(rows);
    const ids = [...new Set(rows.map(r => r.creator_id))];
    if (!ids.length) { setCreators({}); return; }
    const { data: cdata } = await supabase.from("fans_creators").select("id,display_name,slug,user_id").in("id", ids);
    const map: Record<string, Creator> = {};
    for (const c of (cdata || []) as Creator[]) map[c.id] = c;
    setCreators(map);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) { setAuthorized(false); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["super_admin","admin","finance"]).limit(1).maybeSingle();
      if (!mounted) return;
      setAuthorized(Boolean(role));
      if (role) await load();
    })();
    return () => { mounted = false; };
  }, []);

  async function action(row: Payout, name: "approve"|"reject"|"start"|"pay"|"fail"|"cancel") {
    let provider: string | null = null;
    let reference: string | null = null;
    let reason: string | null = null;
    if (["reject","fail","cancel"].includes(name)) {
      reason = window.prompt("Informe o motivo da decisão:")?.trim() || null;
      if (!reason) return;
    }
    if (name === "pay") {
      provider = window.prompt("Provedor do pagamento (ex.: banco, PIX, Mercado Pago):")?.trim() || null;
      reference = window.prompt("Referência/ID do pagamento:")?.trim() || null;
      if (!provider || !reference) return;
    }
    setBusy(row.id); setError(""); setMessage("");
    try {
      const { error: e } = await supabase.rpc("admin_fans_payout_action", { p_payout_id: row.id, p_action: name, p_provider: provider, p_provider_reference: reference, p_reason: reason });
      if (e) throw e;
      setMessage("Operação de recebimento registrada com sucesso.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível concluir a operação."); }
    finally { setBusy(null); }
  }

  const filtered = useMemo(() => filter === "all" ? payouts : payouts.filter(p => p.status === filter), [payouts, filter]);
  const totals = useMemo(() => ({ requested: payouts.filter(p => ["requested","approved","processing"].includes(p.status)).reduce((s,p)=>s+Number(p.amount),0), paid: payouts.filter(p=>p.status==="paid").reduce((s,p)=>s+Number(p.amount),0) }), [payouts]);

  if (authorized === null) return <main className="shell"><section className="hero"><h1>Carregando recebimentos...</h1></section></main>;
  if (!authorized) return <main className="shell"><section className="hero"><h1>Acesso restrito.</h1><p>Esta área é exclusiva de administração financeira.</p><Link href="/admin" className="primaryButton">Voltar</Link></section></main>;
  return <main className="shell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><Link href="/admin" className="navCta">Administração</Link></nav><section className="hero" style={{maxWidth:1500}}><div className="eyebrow">FANS · FINANCEIRO · RECEBIMENTOS</div><h1>Controle de <em>recebimentos.</em></h1><p className="heroCopy">Fila operacional para análise, aprovação, processamento e liquidação dos valores solicitados pelos criadores. Cada decisão é protegida no banco e registrada em auditoria.</p>{message && <p className="formSuccess">{message}</p>}{error && <p className="formError">{error}</p>}<div className="formGrid" style={{marginBottom:20}}><div className="publicationBox"><strong>Em aberto</strong><div style={{fontSize:24,marginTop:6}}>{money.format(totals.requested)}</div></div><div className="publicationBox"><strong>Total pago</strong><div style={{fontSize:24,marginTop:6}}>{money.format(totals.paid)}</div></div><label>Filtrar status<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos</option>{Object.entries(statusLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></div><div className="authCard" style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:950}}><thead><tr><th align="left">Solicitação</th><th align="left">Criador</th><th align="left">Valor</th><th align="left">Status</th><th align="left">Solicitado em</th><th align="left">Ação</th></tr></thead><tbody>{filtered.map(row => { const creator=creators[row.creator_id]; return <tr key={row.id} style={{borderTop:"1px solid #e5e7eb"}}><td style={{padding:"14px 8px"}}><code>{row.id.slice(0,8)}</code><br/><small>{row.provider_reference || "sem referência"}</small></td><td style={{padding:"14px 8px"}}><strong>{creator?.display_name || "Criador"}</strong><br/><small>{creator?.slug || row.creator_id.slice(0,8)}</small></td><td style={{padding:"14px 8px"}}>{money.format(Number(row.amount))}</td><td style={{padding:"14px 8px"}}>{statusLabel[row.status] || row.status}{row.rejection_reason && <><br/><small>{row.rejection_reason}</small></>}</td><td style={{padding:"14px 8px"}}>{new Date(row.requested_at).toLocaleString("pt-BR")}</td><td style={{padding:"14px 8px"}}><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{row.status==="requested" && <><button className="secondaryButton" disabled={busy===row.id} onClick={()=>void action(row,"approve")}>Aprovar</button><button className="secondaryButton" disabled={busy===row.id} onClick={()=>void action(row,"reject")}>Rejeitar</button></>}{row.status==="approved" && <><button className="secondaryButton" disabled={busy===row.id} onClick={()=>void action(row,"start")}>Iniciar</button><button className="secondaryButton" disabled={busy===row.id} onClick={()=>void action(row,"cancel")}>Cancelar</button></>}{row.status==="processing" && <><button className="primaryButton" disabled={busy===row.id} onClick={()=>void action(row,"pay")}>Marcar como pago</button><button className="secondaryButton" disabled={busy===row.id} onClick={()=>void action(row,"fail")}>Falha</button></>}{row.status==="failed" && <button className="secondaryButton" disabled={busy===row.id} onClick={()=>void action(row,"start")}>Reprocessar</button>}</div></td></tr>})}</tbody></table>{!filtered.length && <p>Nenhuma solicitação neste filtro.</p>}</div></section></main>;
}
