"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

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
  active: boolean;
};

type Venue = { id: string; name: string };

const money = (type: string, value: number | string) => type === "percentage"
  ? Number(value).toLocaleString("pt-BR") + "%"
  : Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminBenefitsPage() {
  const supabase = createClient();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsCost, setPointsCost] = useState("100");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("percentage");
  const [discountValue, setDiscountValue] = useState("10");
  const [venueId, setVenueId] = useState("");
  const [limit, setLimit] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const [{ data: benefitRows, error: benefitError }, { data: venueRows }] = await Promise.all([
      supabase.from("pecatho_reward_benefits").select("id,name,description,points_cost,discount_type,discount_value,partner_venue_id,max_redemptions,redeemed_count,starts_at,ends_at,active").order("created_at", { ascending: false }),
      supabase.from("partner_venues").select("id,name").eq("status", "published").order("name"),
    ]);
    if (benefitError) throw benefitError;
    setBenefits((benefitRows ?? []) as Benefit[]);
    setVenues((venueRows ?? []) as Venue[]);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) { setAuthorized(false); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["super_admin", "admin"]).limit(1).maybeSingle();
      if (!mounted) return;
      setAuthorized(Boolean(role));
      if (role) {
        try { await load(); } catch { if (mounted) setError("Não foi possível carregar benefícios e parceiros."); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const { data, error: rpcError } = await supabase.rpc("admin_save_pecatho_benefit", {
        p_name: name.trim(),
        p_description: description.trim() || null,
        p_points_cost: Number(pointsCost),
        p_discount_type: discountType,
        p_discount_value: Number(discountValue.replace(",", ".")),
        p_partner_venue_id: venueId || null,
        p_max_redemptions: limit ? Number(limit) : null,
        p_starts_at: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
        p_ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      });
      if (rpcError) throw rpcError;
      if (!data) throw new Error("Não foi possível confirmar o cadastro.");
      setName(""); setDescription(""); setVenueId(""); setLimit(""); setStartsAt(""); setEndsAt("");
      setMessage("Benefício cadastrado e publicado no catálogo conforme a data de início.");
      await load();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      setError(raw.includes("ADMIN_REQUIRED") ? "Seu usuário não tem permissão para administrar benefícios." : raw.includes("PARTNER_VENUE_UNAVAILABLE") ? "O parceiro selecionado não está publicado." : "Não foi possível salvar. Confira os campos e as datas.");
    } finally { setBusy(false); }
  }

  async function toggle(item: Benefit) {
    setBusy(true); setError(""); setMessage("");
    try {
      const { error: rpcError } = await supabase.rpc("admin_set_pecatho_benefit_active", { p_benefit_id: item.id, p_active: !item.active });
      if (rpcError) throw rpcError;
      setMessage(item.active ? "Benefício desativado." : "Benefício ativado.");
      await load();
    } catch (e) {
      setError(e instanceof Error && e.message.includes("ADMIN_REQUIRED") ? "Seu usuário não tem permissão para administrar benefícios." : "Não foi possível alterar o status do benefício.");
    } finally { setBusy(false); }
  }

  if (authorized === null) return <main className="shell advertiserDashboard"><section className="card">Verificando acesso administrativo...</section></main>;
  if (!authorized) return <main className="shell advertiserDashboard"><section className="card"><h1>Acesso restrito</h1><p>Esta área é exclusiva para administradores do Pecatho.</p><Link className="secondaryButton" href="/painel">Voltar ao painel</Link></section></main>;

  return (
    <main className="shell advertiserDashboard">
      <nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><div className="navLinks"><Link href="/admin">Administração</Link><Link href="/painel/cliente">Área do cliente</Link></div></nav>
      <section className="hero">
        <div className="eyebrow">GESTÃO COMERCIAL · PONTOS PECATHO</div>
        <h1>Benefícios e cupons</h1>
        <p className="heroCopy">Publique vantagens com custo em pontos, valor de desconto, parceiro e limites explícitos. Não há sorteios: cada cliente resgata um benefício disponível mediante saldo suficiente.</p>
        {error && <p role="alert" className="fieldNote">{error}</p>}
        {message && <p role="status" className="fieldNote">{message}</p>}
        <form className="card" onSubmit={save}>
          <h2>Novo benefício</h2>
          <div className="formGrid">
            <label>Nome da oferta<input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Desconto exclusivo no parceiro" /></label>
            <label>Custo em pontos<input required type="number" min="1" max="1000000" value={pointsCost} onChange={(e) => setPointsCost(e.target.value)} /></label>
            <label>Tipo de desconto<select value={discountType} onChange={(e) => setDiscountType(e.target.value as "fixed" | "percentage")}><option value="percentage">Percentual (%)</option><option value="fixed">Valor fixo (R$)</option></select></label>
            <label>Valor do desconto<input required inputMode="decimal" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} /></label>
            <label>Parceiro responsável<select required value={venueId} onChange={(e) => setVenueId(e.target.value)}><option value="">Selecione uma casa publicada</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select></label>
            <label>Limite total de resgates<input type="number" min="1" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Sem limite" /></label>
            <label>Início da oferta<input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></label>
            <label>Fim da oferta<input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></label>
          </div>
          <label>Condições e descrição<textarea rows={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Informe onde usar, restrições, condições mínimas e como o parceiro validará o código." /></label>
          <button className="primaryButton" type="submit" disabled={busy}>{busy ? "Salvando..." : "Publicar benefício"}</button>
        </form>
        <section className="card" style={{ marginTop: 20 }}>
          <h2>Ofertas cadastradas</h2>
          {benefits.length === 0 ? <p className="fieldNote">Nenhum benefício cadastrado.</p> : <div className="financeHistory">{benefits.map((item) => <article key={item.id}>
            <div><strong>{item.name}</strong><small>{item.points_cost} pontos · {money(item.discount_type, item.discount_value)} · {item.redeemed_count}{item.max_redemptions === null ? "" : " / " + item.max_redemptions} resgates</small><small>{item.description || "Sem descrição adicional."}</small></div>
            <span className="financeStatus">{item.active ? "Ativo" : "Inativo"}</span>
            <button type="button" className="secondaryButton" disabled={busy} onClick={() => void toggle(item)}>{item.active ? "Desativar" : "Ativar"}</button>
          </article>)}</div>}
        </section>
      </section>
    </main>
  );
}
