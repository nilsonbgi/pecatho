"use client";

type ReferralRow = {
  registered_at: string;
  first_paid_at: string | null;
  status: string;
  commission_amount: number | string;
  reversed_amount: number | string;
  net_commission: number | string;
};

type DashboardSummary = {
  total_referrals: number;
  registered_referrals: number;
  qualified_referrals: number;
  total_commission: number | string;
  reversed_commission: number | string;
  net_commission: number | string;
  referrals: ReferralRow[];
};

const money = (value: number | string) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "Ainda não";

const statusLabel: Record<string, string> = {
  registered: "Cadastro realizado",
  qualified: "Convertido em cliente pagante",
};

export default function AffiliateDashboardCard({ summary }: { summary: DashboardSummary | null }) {
  const data = summary ?? {
    total_referrals: 0,
    registered_referrals: 0,
    qualified_referrals: 0,
    total_commission: 0,
    reversed_commission: 0,
    net_commission: 0,
    referrals: [],
  };

  return (
    <article className="card" aria-labelledby="affiliate-dashboard-title">
      <div className="cardIcon">%</div>
      <h2 id="affiliate-dashboard-title">Meu programa de indicação</h2>
      <p>Acompanhe os cadastros atribuídos ao seu link e as comissões efetivamente registradas. A comissão corresponde a 10% da receita líquida elegível do Pecatho.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, margin: "18px 0" }}>
        <div><strong style={{ display: "block", fontSize: 24 }}>{data.total_referrals}</strong><span className="fieldNote">Indicações totais</span></div>
        <div><strong style={{ display: "block", fontSize: 24 }}>{data.registered_referrals}</strong><span className="fieldNote">Cadastros aguardando conversão</span></div>
        <div><strong style={{ display: "block", fontSize: 24 }}>{data.qualified_referrals}</strong><span className="fieldNote">Conversões pagas</span></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, padding: 14, borderRadius: 12, background: "rgba(231,195,63,.08)" }}>
        <div><span className="fieldNote">Comissões geradas</span><strong style={{ display: "block" }}>{money(data.total_commission)}</strong></div>
        <div><span className="fieldNote">Estornos</span><strong style={{ display: "block" }}>{money(data.reversed_commission)}</strong></div>
        <div><span className="fieldNote">Comissão líquida registrada</span><strong style={{ display: "block" }}>{money(data.net_commission)}</strong></div>
      </div>
      <h3 style={{ marginTop: 22 }}>Indicações recentes</h3>
      {data.referrals.length === 0 ? (
        <p className="fieldNote">Você ainda não possui indicações registradas.</p>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {data.referrals.map((referral, index) => (
            <div key={`${referral.registered_at}-${index}`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, alignItems: "center", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.12)" }}>
              <div>
                <strong>{statusLabel[referral.status] || "Em acompanhamento"}</strong>
                <div className="fieldNote">Cadastro: {date(referral.registered_at)} · Primeiro pagamento: {date(referral.first_paid_at)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>{money(referral.net_commission)}</strong>
                <div className="fieldNote">Comissão líquida</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="fieldNote" style={{ marginTop: 14 }}>Por privacidade, o painel não exibe nome, e-mail, telefone ou outros dados pessoais das pessoas indicadas. A comissão só é registrada após a confirmação de um pagamento elegível.</p>
    </article>
  );
}
