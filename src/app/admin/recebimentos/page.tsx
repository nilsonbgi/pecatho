"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Payout = {
  id: string;
  creator_id: string | null;
  seller_user_id: string | null;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  provider_reference: string | null;
  requested_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
};

type Creator = { id: string; display_name: string; slug: string; user_id: string };
type Profile = { id: string; display_name: string | null; email: string | null };
type FinancialSummary = {
  fansGross: number; fansPlatformFees: number; sellerGross: number; sellerPlatformFees: number;
  gross: number; platformFees: number; net: number; outstanding: number; paidOut: number; available: number;
};
type ParticipantSummary = {
  participant_type: "unified"; participant_id: string; user_id: string; display_name: string;
  gross_sales: number; platform_fees: number; provider_fees: number; net_earned: number;
  outstanding_payouts: number; paid_out: number; available: number;
  fans_gross_sales: number; fans_platform_fees: number; content_gross_sales: number; content_platform_fees: number;
};

const statusLabel: Record<string, string> = {
  requested: "Solicitado",
  approved: "Aprovado",
  processing: "Em processamento",
  paid: "Pago",
  rejected: "Rejeitado",
  failed: "Falhou",
  cancelled: "Cancelado",
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminPayoutsPage() {
  const supabase = createClient();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [creators, setCreators] = useState<Record<string, Creator>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [financial, setFinancial] = useState<FinancialSummary>({
    fansGross: 0, fansPlatformFees: 0, sellerGross: 0, sellerPlatformFees: 0,
    gross: 0, platformFees: 0, net: 0, outstanding: 0, paidOut: 0, available: 0,
  });
  const [participants, setParticipants] = useState<ParticipantSummary[]>([]);

  async function load() {
    setError("");

    const { data, error: e } = await supabase
      .from("fans_payout_requests")
      .select("id,creator_id,seller_user_id,amount,currency,status,provider,provider_reference,requested_at,processed_at,rejection_reason")
      .order("requested_at", { ascending: false });

    if (e) {
      setError(e.message);
      return;
    }

    const rows = (data || []) as Payout[];
    setPayouts(rows);

    const { data: overview, error: overviewError } = await supabase.rpc("admin_fans_financial_overview");
    if (overviewError) {
      setError(overviewError.message);
      return;
    }

    const summaryRows = (overview || []) as ParticipantSummary[];
    setParticipants(summaryRows);
    const sum = (rows: ParticipantSummary[], key: keyof ParticipantSummary) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);
    const fansGross = summaryRows.reduce((total, row) => total + Number(row.fans_gross_sales || 0), 0);
    const fansPlatformFees = summaryRows.reduce((total, row) => total + Number(row.fans_platform_fees || 0), 0);
    const sellerGross = summaryRows.reduce((total, row) => total + Number(row.content_gross_sales || 0), 0);
    const sellerPlatformFees = summaryRows.reduce((total, row) => total + Number(row.content_platform_fees || 0), 0);
    const outstanding = rows.filter((row) => ["requested", "approved", "processing"].includes(row.status)).reduce((total, row) => total + Number(row.amount), 0);
    const paidOut = rows.filter((row) => row.status === "paid").reduce((total, row) => total + Number(row.amount), 0);
    setFinancial({
      fansGross, fansPlatformFees,
      sellerGross, sellerPlatformFees,
      gross: sum(summaryRows, "gross_sales"), platformFees: sum(summaryRows, "platform_fees"),
      net: sum(summaryRows, "net_earned"), outstanding, paidOut, available: sum(summaryRows, "available"),
    });

    const creatorIds = [...new Set(rows.map((row) => row.creator_id).filter((id): id is string => Boolean(id)))];
    if (creatorIds.length) {
      const { data: creatorData } = await supabase
        .from("fans_creators")
        .select("id,display_name,slug,user_id")
        .in("id", creatorIds);

      const creatorMap: Record<string, Creator> = {};
      for (const creator of (creatorData || []) as Creator[]) creatorMap[creator.id] = creator;
      setCreators(creatorMap);
    } else {
      setCreators({});
    }

    const sellerIds = [...new Set(rows.map((row) => row.seller_user_id).filter((id): id is string => Boolean(id)))];
    if (sellerIds.length) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id,display_name,email")
        .in("id", sellerIds);

      const profileMap: Record<string, Profile> = {};
      for (const profile of (profileData || []) as Profile[]) profileMap[profile.id] = profile;
      setProfiles(profileMap);
    } else {
      setProfiles({});
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!user) {
        setAuthorized(false);
        return;
      }

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["super_admin", "admin", "finance"])
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      setAuthorized(Boolean(role));
      if (role) await load();
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function action(
    row: Payout,
    name: "approve" | "reject" | "start" | "pay" | "fail" | "cancel",
  ) {
    let provider: string | null = null;
    let reference: string | null = null;
    let reason: string | null = null;

    if (["reject", "fail", "cancel"].includes(name)) {
      reason = window.prompt("Informe o motivo da decisão:")?.trim() || null;
      if (!reason) return;
    }

    if (name === "pay") {
      provider = window.prompt("Provedor do pagamento (ex.: banco, PIX, Mercado Pago):")?.trim() || null;
      reference = window.prompt("Referência/ID do pagamento:")?.trim() || null;
      if (!provider || !reference) return;
    }

    setBusy(row.id);
    setError("");
    setMessage("");

    try {
      const { error: rpcError } = await supabase.rpc("admin_fans_payout_action", {
        p_payout_id: row.id,
        p_action: name,
        p_provider: provider,
        p_provider_reference: reference,
        p_reason: reason,
      });

      if (rpcError) throw rpcError;

      setMessage("Operação de recebimento registrada com sucesso.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir a operação.");
    } finally {
      setBusy(null);
    }
  }

  const filtered = useMemo(
    () => filter === "all" ? payouts : payouts.filter((payout) => payout.status === filter),
    [payouts, filter],
  );

  const totals = useMemo(() => ({
    requested: payouts
      .filter((payout) => ["requested", "approved", "processing"].includes(payout.status))
      .reduce((sum, payout) => sum + Number(payout.amount), 0),
    paid: payouts
      .filter((payout) => payout.status === "paid")
      .reduce((sum, payout) => sum + Number(payout.amount), 0),
  }), [payouts]);

  if (authorized === null) {
    return <main className="shell"><section className="hero"><h1>Carregando recebimentos...</h1></section></main>;
  }

  if (!authorized) {
    return (
      <main className="shell">
        <section className="hero">
          <h1>Acesso restrito.</h1>
          <p>Esta área é exclusiva de administração financeira.</p>
          <Link href="/admin" className="primaryButton">Voltar</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div>
        <Link href="/admin" className="navCta">Administração</Link>
      </nav>

      <section className="hero" style={{ maxWidth: 1500 }}>
        <div className="eyebrow">PECATHO · FINANCEIRO · RECEBIMENTOS</div>
        <h1>Controle de <em>recebimentos.</em></h1>
        <p className="heroCopy">
          Fila única para os recebimentos de criadores e vendedores de conteúdo. Cada decisão
          passa pelas regras financeiras do banco e gera registro de auditoria.
        </p>

        {message && <p className="formSuccess">{message}</p>}
        {error && <p className="formError">{error}</p>}

        <div className="formGrid" style={{ marginBottom: 20 }}>
          <div className="publicationBox">
            <strong>Saldo disponível para repasse</strong>
            <div style={{ fontSize: 24, marginTop: 6 }}>{money.format(financial.available)}</div>
            <small>Após comissões e solicitações em aberto</small>
          </div>
          <div className="publicationBox">
            <strong>Aguardando liberação</strong>
            <div style={{ fontSize: 24, marginTop: 6 }}>{money.format(financial.outstanding)}</div>
            <small>Solicitado, aprovado ou em processamento</small>
          </div>
          <div className="publicationBox">
            <strong>Comissões Pecatho · Fans</strong>
            <div style={{ fontSize: 24, marginTop: 6 }}>{money.format(financial.fansPlatformFees)}</div>
            <small>Valores registrados no ledger</small>
          </div>
          <div className="publicationBox">
            <strong>Comissões Pecatho · Conteúdo</strong>
            <div style={{ fontSize: 24, marginTop: 6 }}>{money.format(financial.sellerPlatformFees)}</div>
            <small>Vendas de conteúdo pagas</small>
          </div>
          <div className="publicationBox">
            <strong>Total já repassado</strong>
            <div style={{ fontSize: 24, marginTop: 6 }}>{money.format(financial.paidOut)}</div>
          </div>
          <label>
            Filtrar status
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">Todos</option>
              {Object.entries(statusLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="authCard" style={{ overflowX: "auto", marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>Posição financeira por participante</h2>
          <p style={{ marginTop: 0 }}>Valores líquidos após comissão do Pecatho, taxas do provedor, estornos e solicitações já reservadas.</p>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1250 }}>
            <thead><tr>
              <th align="left">Participante</th><th align="left">Origem</th><th align="left">Vendas brutas</th>
              <th align="left">Comissão Pecatho</th><th align="left">Líquido</th><th align="left">Em solicitação</th>
              <th align="left">Já pago</th><th align="left">Disponível</th>
            </tr></thead>
            <tbody>{participants.map((participant) => (
              <tr key={participant.participant_type + ":" + participant.participant_id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={{ padding: "12px 8px" }}><strong>{participant.display_name}</strong></td>
                <td style={{ padding: "12px 8px" }}>{"Acompanhante / Fans + Conteúdo"}</td>
                <td style={{ padding: "12px 8px" }}>{money.format(Number(participant.gross_sales))}</td>
                <td style={{ padding: "12px 8px" }}>{money.format(Number(participant.platform_fees))}</td>
                <td style={{ padding: "12px 8px" }}>{money.format(Number(participant.net_earned))}</td>
                <td style={{ padding: "12px 8px" }}>{money.format(Number(participant.outstanding_payouts))}</td>
                <td style={{ padding: "12px 8px" }}>{money.format(Number(participant.paid_out))}</td>
                <td style={{ padding: "12px 8px" }}><strong>{money.format(Number(participant.available))}</strong></td>
              </tr>
            ))}</tbody>
          </table>
          {!participants.length && <p>Nenhum participante com movimentação financeira registrada.</p>}
        </div>

        <div className="authCard" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead>
              <tr>
                <th align="left">Solicitação</th>
                <th align="left">Origem</th>
                <th align="left">Vendedor / criador</th>
                <th align="left">Valor</th>
                <th align="left">Status</th>
                <th align="left">Solicitado em</th>
                <th align="left">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const creator = row.creator_id ? creators[row.creator_id] : undefined;
                const profile = row.seller_user_id ? profiles[row.seller_user_id] : undefined;
                const isSeller = Boolean(row.seller_user_id);

                return (
                  <tr key={row.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "14px 8px" }}>
                      <code>{row.id.slice(0, 8)}</code>
                      <br />
                      <small>{row.provider_reference || "sem referência"}</small>
                    </td>

                    <td style={{ padding: "14px 8px" }}>
                      <span className="financeStatus">
                        {isSeller ? "Conteúdo" : "Fans"}
                      </span>
                    </td>

                    <td style={{ padding: "14px 8px" }}>
                      <strong>
                        {isSeller
                          ? profile?.display_name || profile?.email || "Vendedor de conteúdo"
                          : creator?.display_name || "Criador"}
                      </strong>
                      <br />
                      <small>
                        {isSeller
                          ? profile?.email || row.seller_user_id?.slice(0, 8)
                          : creator?.slug || row.creator_id?.slice(0, 8)}
                      </small>
                    </td>

                    <td style={{ padding: "14px 8px" }}>{money.format(Number(row.amount))}</td>

                    <td style={{ padding: "14px 8px" }}>
                      {statusLabel[row.status] || row.status}
                      {row.rejection_reason && <><br /><small>{row.rejection_reason}</small></>}
                    </td>

                    <td style={{ padding: "14px 8px" }}>
                      {new Date(row.requested_at).toLocaleString("pt-BR")}
                    </td>

                    <td style={{ padding: "14px 8px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {row.status === "requested" && (
                          <>
                            <button className="secondaryButton" disabled={busy === row.id} onClick={() => void action(row, "approve")}>Aprovar</button>
                            <button className="secondaryButton" disabled={busy === row.id} onClick={() => void action(row, "reject")}>Rejeitar</button>
                          </>
                        )}

                        {row.status === "approved" && (
                          <>
                            <button className="secondaryButton" disabled={busy === row.id} onClick={() => void action(row, "start")}>Iniciar</button>
                            <button className="secondaryButton" disabled={busy === row.id} onClick={() => void action(row, "cancel")}>Cancelar</button>
                          </>
                        )}

                        {row.status === "processing" && (
                          <>
                            <button className="primaryButton" disabled={busy === row.id} onClick={() => void action(row, "pay")}>Marcar como pago</button>
                            <button className="secondaryButton" disabled={busy === row.id} onClick={() => void action(row, "fail")}>Falha</button>
                          </>
                        )}

                        {row.status === "failed" && (
                          <button className="secondaryButton" disabled={busy === row.id} onClick={() => void action(row, "start")}>Reprocessar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filtered.length && <p>Nenhuma solicitação neste filtro.</p>}
        </div>
      </section>
    </main>
  );
}
