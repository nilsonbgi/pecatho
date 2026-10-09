"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Benefit = {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  discount_type: "fixed" | "percentage";
  discount_value: number | string;
  partner_venue_id: string | null;
  max_redemptions: number | null;
  redeemed_count: number;
  starts_at: string;
  ends_at: string | null;
};

type UserCoupon = {
  id: string;
  benefit_id: string;
  coupon_code: string | null;
  points_spent: number;
  issued_at: string;
  redeemed_at: string | null;
};

type Venue = { id: string; name: string };

function discountLabel(type: string, value: number | string) {
  const amount = Number(value);
  return type === "percentage"
    ? amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "% de desconto"
    : amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + " de desconto";
}

function dateLabel(value: string | null) {
  if (!value) return "Sem data de expiração definida";
  return new Date(value).toLocaleDateString("pt-BR");
}

function errorLabel(message: string) {
  if (message.includes("INSUFFICIENT_POINTS")) return "Você ainda não tem pontos suficientes para esse benefício.";
  if (message.includes("BENEFIT_LIMIT_REACHED")) return "Esse benefício atingiu o limite de resgates.";
  if (message.includes("BENEFIT_UNAVAILABLE")) return "Esse benefício não está mais disponível.";
  if (message.includes("CUSTOMER_ACCOUNT_REQUIRED")) return "O resgate está disponível apenas para contas de cliente.";
  if (message.includes("AUTHENTICATION_REQUIRED")) return "Sua sessão expirou. Entre novamente.";
  return "Não foi possível concluir o resgate. Atualize a página e tente novamente.";
}

export default function PecathoBenefits({ initialPoints = 0 }: { initialPoints?: number }) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [points, setPoints] = useState(initialPoints);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const benefitMap = useMemo(() => new Map(benefits.map((item) => [item.id, item])), [benefits]);
  const venueMap = useMemo(() => new Map(venues.map((item) => [item.id, item.name])), [venues]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const now = new Date().toISOString();
    const [{ data: benefitRows, error: benefitError }, { data: couponRows, error: couponError }, { data: pointRow }, { data: venueRows }] = await Promise.all([
      supabase.from("pecatho_reward_benefits").select("id,name,description,points_cost,discount_type,discount_value,partner_venue_id,max_redemptions,redeemed_count,starts_at,ends_at").eq("active", true).lte("starts_at", now).or("ends_at.is.null,ends_at.gt." + now).order("points_cost", { ascending: true }),
      supabase.from("pecatho_user_coupons").select("id,benefit_id,coupon_code,points_spent,issued_at,redeemed_at").order("issued_at", { ascending: false }).limit(30),
      supabase.from("pecatho_user_points").select("balance").maybeSingle(),
      supabase.from("partner_venues").select("id,name").eq("status", "published"),
    ]);
    if (benefitError) throw benefitError;
    if (couponError) throw couponError;
    setBenefits((benefitRows ?? []) as Benefit[]);
    setCoupons((couponRows ?? []) as UserCoupon[]);
    setPoints(Number(pointRow?.balance ?? initialPoints));
    setVenues((venueRows ?? []) as Venue[]);
  }, [initialPoints]);

  useEffect(() => {
    let active = true;
    void load().catch(() => { if (active) setError("Não foi possível carregar o catálogo de benefícios."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  async function redeem(benefit: Benefit) {
    setRedeeming(benefit.id);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("redeem_pecatho_benefit", { p_benefit_id: benefit.id });
      if (rpcError) throw rpcError;
      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.coupon_code) throw new Error("REDEMPTION_RESULT_MISSING");
      setNotice("Benefício resgatado. Seu código é " + result.coupon_code + ". Guarde-o e apresente ao parceiro indicado nas condições.");
      setPoints(Number(result.points_balance ?? Math.max(0, points - benefit.points_cost)));
      await load();
    } catch (e) {
      setError(errorLabel(e instanceof Error ? e.message : ""));
    } finally {
      setRedeeming(null);
    }
  }

  return (
    <section className="card" id="beneficios">
      <div className="eyebrow">PROGRAMA DE BENEFÍCIOS</div>
      <h2>Troque pontos por vantagens reais</h2>
      <p>Cada avaliação aprovada de uma interação verificada rende 10 pontos, seja a nota alta ou baixa. Os pontos não são concedidos por avaliações sem comprovação e podem ser estornados se a avaliação perder a elegibilidade. Os benefícios exibidos estão dentro do período de validade e têm custo e limite definidos antes do resgate.</p>
      <div className="pillars" style={{ marginTop: 18 }}>
        <article className="card">
          <div className="cardIcon">✦</div>
          <h3>Seu saldo disponível</h3>
          <p className="financeBig">{points.toLocaleString("pt-BR")} pontos</p>
          <p className="fieldNote">O saldo é atualizado após cada resgate confirmado.</p>
        </article>
        <article className="card">
          <div className="cardIcon">✓</div>
          <h3>Regras transparentes</h3>
          <p>Sem sorteios, sem compra obrigatória de chances e sem recompensa por avaliação positiva. Cada resgate é registrado no histórico.</p>
        </article>
      </div>
      {notice && <p role="status" className="fieldNote" style={{ border: "1px solid rgba(34,197,94,.35)", padding: 12, borderRadius: 12 }}>{notice}</p>}
      {error && <p role="alert" className="fieldNote" style={{ border: "1px solid rgba(239,68,68,.35)", padding: 12, borderRadius: 12 }}>{error}</p>}
      <h3 style={{ marginTop: 24 }}>Benefícios disponíveis</h3>
      {loading ? <p className="fieldNote">Carregando benefícios...</p> : benefits.length === 0 ? <p className="fieldNote">Ainda não há benefícios ativos para resgate. Quando o Pecatho ou um parceiro publicar uma oferta com regras e validade definidas, ela aparecerá aqui.</p> : (
        <div className="pillars">
          {benefits.map((benefit) => {
            const soldOut = benefit.max_redemptions !== null && benefit.redeemed_count >= benefit.max_redemptions;
            const venueName = benefit.partner_venue_id ? venueMap.get(benefit.partner_venue_id) : null;
            const canRedeem = points >= benefit.points_cost && !soldOut && (!benefit.partner_venue_id || Boolean(venueName));
            return (
              <article className="card" key={benefit.id}>
                <div className="eyebrow">{venueName ? "BENEFÍCIO DE PARCEIRO" : "BENEFÍCIO PECATHO"}</div>
                <h3>{benefit.name}</h3>
                <p className="financeBig">{discountLabel(benefit.discount_type, benefit.discount_value)}</p>
                {benefit.description && <p>{benefit.description}</p>}
                {venueName && <p><strong>Parceiro:</strong> {venueName}</p>}
                <p><strong>Custo:</strong> {benefit.points_cost.toLocaleString("pt-BR")} pontos</p>
                <p className="fieldNote">Válido até: {dateLabel(benefit.ends_at)}{benefit.max_redemptions !== null ? " · " + Math.max(0, benefit.max_redemptions - benefit.redeemed_count) + " resgate(s) restante(s)" : ""}</p>
                <button className="primaryButton" type="button" disabled={!canRedeem || redeeming !== null} onClick={() => void redeem(benefit)}>
                  {redeeming === benefit.id ? "Resgatando..." : soldOut ? "Limite atingido" : points < benefit.points_cost ? "Pontos insuficientes" : "Resgatar benefício"}
                </button>
              </article>
            );
          })}
        </div>
      )}
      <h3 style={{ marginTop: 28 }}>Meus cupons</h3>
      {coupons.length === 0 ? <p className="fieldNote">Seus cupons resgatados aparecerão aqui, com código e data de emissão.</p> : (
        <div className="financeHistory">
          {coupons.map((coupon) => {
            const benefit = benefitMap.get(coupon.benefit_id);
            return <article key={coupon.id}>
              <div><strong>{benefit?.name ?? "Benefício Pecatho"}</strong><small>Emitido em {new Date(coupon.issued_at).toLocaleDateString("pt-BR")} · {coupon.points_spent} pontos utilizados</small></div>
              <strong style={{ letterSpacing: ".08em" }}>{coupon.coupon_code ?? "Código indisponível"}</strong>
              <span className="financeStatus">{coupon.redeemed_at ? "Utilizado" : "Disponível"}</span>
            </article>;
          })}
        </div>
      )}
      <p className="fieldNote" style={{ marginTop: 18 }}>Os cupons de parceiros são vantagens promocionais conforme as regras publicadas pelo parceiro. A contratação de serviços presenciais é negociada diretamente com o estabelecimento; o Pecatho não cobra antecipadamente por esse serviço.</p>
    </section>
  );
}
