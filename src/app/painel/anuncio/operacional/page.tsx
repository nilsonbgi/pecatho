"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Slot = { start: string; end: string };
type DaySchedule = { enabled: boolean; allDay: boolean; slots: Slot[] };
type Schedule = Record<string, DaySchedule>;
type Price = { minutes: number; price: number };

type Advertiser = { id: string; title: string | null; pricing: unknown; payment_options: unknown; availability: string | null };
type Address = { zipcode: string | null; street: string | null; number: string | null; complement: string | null; city_id: number | null; state_id: number | null; latitude: number | null; longitude: number | null; location_visibility: string | null; public_latitude: number | null; public_longitude: number | null };

const days = [["mon", "Segunda"], ["tue", "Terça"], ["wed", "Quarta"], ["thu", "Quinta"], ["fri", "Sexta"], ["sat", "Sábado"], ["sun", "Domingo"]] as const;
const paymentLabels: Record<string, string> = { cash: "Dinheiro", credit: "Cartão de crédito", debit: "Cartão de débito", pix: "Pix" };
const periodOptions = [15, 20, 30, 45, 60, 90, 120, 180, 240];

function newDay(): DaySchedule { return { enabled: false, allDay: false, slots: [{ start: "09:00", end: "18:00" }] }; }
function initialSchedule(): Schedule { return Object.fromEntries(days.map(([key]) => [key, newDay()])); }
function asObject(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function normalizeSchedule(value: unknown): Schedule {
  const base = initialSchedule();
  const source = asObject(value);
  for (const [key] of days) {
    const raw = asObject(source[key]);
    const rawSlots = Array.isArray(raw.slots) ? raw.slots : [];
    const slots = rawSlots.map((slot) => { const s = asObject(slot); return { start: typeof s.start === "string" ? s.start : "09:00", end: typeof s.end === "string" ? s.end : "18:00" }; }).filter((s) => s.start < s.end);
    base[key] = { enabled: raw.enabled === true, allDay: raw.allDay === true, slots: slots.length ? slots : [{ start: "09:00", end: "18:00" }] };
  }
  return base;
}
function normalizePrices(value: unknown): Price[] {
  if (!Array.isArray(value)) return [{ minutes: 15, price: 0 }];
  const seen = new Set<number>();
  const result = value.map((row) => { const r = asObject(row); return { minutes: Number(r.minutes), price: Number(r.price) }; }).filter((p) => periodOptions.includes(p.minutes) && Number.isFinite(p.price) && p.price >= 0).filter((p) => { if (seen.has(p.minutes)) return false; seen.add(p.minutes); return true; });
  return result.length ? result : [{ minutes: 15, price: 0 }];
}

export default function OperationalPage() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Advertiser | null>(null);
  const [schedule, setSchedule] = useState<Schedule>(() => initialSchedule());
  const [prices, setPrices] = useState<Price[]>([{ minutes: 15, price: 0 }]);
  const [payments, setPayments] = useState<Record<string, boolean>>({ cash: false, credit: false, debit: false, pix: false });
  const [creditFee, setCreditFee] = useState(0);
  const [location, setLocation] = useState<Address | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const [{ data: p, error: pe }, { data: a, error: ae }] = await Promise.all([
        supabase.from("advertiser_profiles").select("id,title,pricing,payment_options,availability").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_addresses").select("zipcode,street,number,complement,city_id,state_id,latitude,longitude,location_visibility,public_latitude,public_longitude").eq("user_id", user.id).eq("address_type", "primary").maybeSingle(),
      ]);
      if (pe || ae) setError("Não foi possível carregar toda a configuração operacional.");
      if (p) {
        setProfile(p as Advertiser);
        const pricing = asObject(p.pricing);
        const paymentOptions = asObject(p.payment_options);
        setPrices(normalizePrices(pricing.periods));
        setSchedule(normalizeSchedule(pricing.schedule));
        if (paymentOptions.methods && typeof paymentOptions.methods === "object" && !Array.isArray(paymentOptions.methods)) setPayments(paymentOptions.methods as Record<string, boolean>);
        setCreditFee(Number(paymentOptions.credit_fee_percent) || 0);
      }
      setLocation((a || null) as Address | null);
      setBusy(false);
    })();
  }, [supabase]);

  function updateDay(key: string, patch: Partial<DaySchedule>) { setSchedule((current) => ({ ...current, [key]: { ...current[key], ...patch } })); }
  function addSlot(key: string) { setSchedule((current) => ({ ...current, [key]: { ...current[key], slots: [...current[key].slots, { start: "19:00", end: "22:00" }] } })); }
  function updateSlot(key: string, index: number, patch: Partial<Slot>) { setSchedule((current) => ({ ...current, [key]: { ...current[key], slots: current[key].slots.map((slot, i) => i === index ? { ...slot, ...patch } : slot) } })); }
  function removeSlot(key: string, index: number) { setSchedule((current) => ({ ...current, [key]: { ...current[key], slots: current[key].slots.filter((_, i) => i !== index) } })); }
  function addPrice() {
    const next = periodOptions.find((minutes) => !prices.some((p) => p.minutes === minutes));
    if (next) setPrices((current) => [...current, { minutes: next, price: 0 }]);
  }
  function updatePrice(index: number, patch: Partial<Price>) { setPrices((current) => current.map((p, i) => i === index ? { ...p, ...patch } : p)); }

  function validate(): string | null {
    for (const [key, label] of days) {
      const day = schedule[key];
      if (!day.enabled || day.allDay) continue;
      if (!day.slots.length) return `Informe pelo menos um horário para ${label}.`;
      for (const slot of day.slots) if (!slot.start || !slot.end || slot.start >= slot.end) return `O horário de ${label} possui um intervalo inválido.`;
      for (let i = 1; i < day.slots.length; i++) if (day.slots[i - 1].end > day.slots[i].start) return `Os horários de ${label} não podem se sobrepor.`;
    }
    const minutes = prices.map((p) => p.minutes);
    if (new Set(minutes).size !== minutes.length) return "Não é permitido cadastrar o mesmo período de preço duas vezes.";
    if (prices.some((p) => !periodOptions.includes(p.minutes) || !Number.isFinite(p.price) || p.price < 0)) return "Revise os períodos e valores de preço.";
    if (!Object.values(payments).some(Boolean)) return "Selecione pelo menos uma forma de pagamento.";
    if (payments.credit && (creditFee < 0 || creditFee > 100)) return "A taxa do cartão de crédito deve estar entre 0% e 100%.";
    return null;
  }

  async function save() {
    if (!profile) { setError("Crie o rascunho do anúncio primeiro."); return; }
    const validation = validate();
    if (validation) { setError(validation); return; }
    setSaving(true); setError(""); setMessage("");
    const cleanSchedule = Object.fromEntries(days.map(([key]) => {
      const day = schedule[key];
      return [key, { enabled: day.enabled, allDay: day.enabled && day.allDay, slots: day.enabled && !day.allDay ? day.slots : [] }];
    }));
    const cleanPrices = [...prices].sort((a, b) => a.minutes - b.minutes).map((p) => ({ minutes: p.minutes, price: Number(p.price.toFixed(2)) }));
    const pricing = { ...asObject(profile.pricing), periods: cleanPrices, schedule: cleanSchedule };
    const payment_options = { ...asObject(profile.payment_options), methods: payments, credit_fee_percent: payments.credit ? Number(creditFee.toFixed(2)) : 0 };
    const { error: e } = await supabase.from("advertiser_profiles").update({ pricing, payment_options, availability: JSON.stringify(cleanSchedule) }).eq("id", profile.id);
    if (e) setError(e.message); else { setMessage("Configuração operacional salva com sucesso."); setProfile((current) => current ? { ...current, pricing, payment_options, availability: JSON.stringify(cleanSchedule) } : current); }
    setSaving(false);
  }

  async function submit() {
    if (!profile) return;
    const validation = validate();
    if (validation) { setError(validation); return; }
    setSaving(true); setError("");
    const response = await fetch("/api/painel/anuncio/enviar-analise", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Não foi possível enviar para análise."); else setMessage("Anúncio enviado para análise da equipe Pecatho.");
    setSaving(false);
  }

  if (busy) return <main className="shell"><section className="hero"><h1>Carregando configuração...</h1></section></main>;

  return <main className="shell">
    <nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><div className="navLinks"><Link href="/painel">Painel</Link><Link href="/painel/anuncio">Voltar ao anúncio</Link><Link href="/painel/anuncio/revisao">Revisar antes de enviar</Link></div></nav>
    <section className="hero" style={{ maxWidth: 1200 }}>
      <div className="eyebrow">CONFIGURAÇÃO OPERACIONAL</div>
      <h1>Disponibilidade, <em>preços e pagamentos.</em></h1>
      <p className="heroCopy">Configure vários intervalos por dia, atendimento 24 horas, preços por período e formas de pagamento. Tudo permanece vinculado ao mesmo anúncio.</p>
      {(message || error) && <div className="card" style={{ marginBottom: 16 }}><strong>{message || error}</strong></div>}

      <section className="authCard"><h2>Disponibilidade por dia</h2><p className="fieldNote">Você pode cadastrar mais de um intervalo no mesmo dia. “24 horas” elimina os intervalos daquele dia.</p>
        {days.map(([key, label]) => { const day = schedule[key]; return <div key={key} className="serviceCheck" style={{ display: "block", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 150 }}><input type="checkbox" checked={day.enabled} onChange={() => updateDay(key, { enabled: !day.enabled })} /><strong>{label}</strong></label>
            {day.enabled && <label><input type="checkbox" checked={day.allDay} onChange={(e) => updateDay(key, { allDay: e.target.checked })} /> 24 horas</label>}
            {day.enabled && !day.allDay && <button type="button" className="secondaryButton" onClick={() => addSlot(key)}>Adicionar intervalo</button>}
          </div>
          {day.enabled && !day.allDay && <div style={{ marginTop: 8, display: "grid", gap: 8 }}>{day.slots.map((slot, index) => <div key={`${key}-${index}`} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input aria-label={`${label} início ${index + 1}`} type="time" value={slot.start} onChange={(e) => updateSlot(key, index, { start: e.target.value })} />
            <span>até</span><input aria-label={`${label} fim ${index + 1}`} type="time" value={slot.end} onChange={(e) => updateSlot(key, index, { end: e.target.value })} />
            {day.slots.length > 1 && <button type="button" className="secondaryButton" onClick={() => removeSlot(key, index)}>Remover</button>}
          </div>)}</div>}
        </div>; })}
      </section>

      <section className="authCard"><h2>Preços por período</h2><p className="fieldNote">Cada período é único. Os valores são armazenados em centavos conceituais de moeda, com precisão de duas casas no JSON operacional.</p>
        {prices.map((p, i) => <div key={`${p.minutes}-${i}`} className="formGrid" style={{ alignItems: "end" }}>
          <label>Período<select value={p.minutes} onChange={(e) => updatePrice(i, { minutes: Number(e.target.value) })}>{periodOptions.map((n) => <option key={n} value={n} disabled={prices.some((other, j) => j !== i && other.minutes === n)}>{n} minutos</option>)}</select></label>
          <label>Preço (R$)<input type="number" min="0" step="0.01" value={p.price} onChange={(e) => updatePrice(i, { price: Number(e.target.value) })} /></label>
          {prices.length > 1 && <button type="button" className="secondaryButton" onClick={() => setPrices((current) => current.filter((_, j) => j !== i))}>Remover</button>}
        </div>)}
        {prices.length < periodOptions.length && <button type="button" className="secondaryButton" onClick={addPrice}>Adicionar período</button>}
      </section>

      <section className="authCard"><h2>Formas de pagamento</h2><p className="fieldNote">Estas opções representam os meios aceitos pelo anunciante. Elas não autorizam cobrança direta pelo navegador.</p>
        <div className="serviceList">{Object.entries(paymentLabels).map(([key, label]) => <label key={key} className="serviceCheck"><span><input type="checkbox" checked={Boolean(payments[key])} onChange={(e) => setPayments((current) => ({ ...current, [key]: e.target.checked }))} /> {label}</span></label>)}</div>
        {payments.credit && <label>Taxa adicional no crédito (%)<input type="number" min="0" max="100" step="0.01" value={creditFee} onChange={(e) => setCreditFee(Number(e.target.value))} /><small className="fieldNote">Informativa no anúncio. A cobrança real continuará exclusivamente pelo fluxo financeiro seguro.</small></label>}
      </section>

      <section className="authCard"><h2>Localização</h2>{location ? <><p><strong>CEP:</strong> {location.zipcode || "—"} · {location.street || "—"}, {location.number || "—"}</p><p><strong>Visibilidade pública:</strong> {location.location_visibility || "private"}</p>{location.latitude != null && location.longitude != null ? <iframe className="mapFrame" title="Mapa da localização" loading="lazy" src={`https://www.google.com/maps?q=${location.public_latitude ?? location.latitude},${location.public_longitude ?? location.longitude}&z=15&output=embed`} /> : <p className="fieldNote">O mapa será disponibilizado depois que o endereço for geocodificado.</p>}</> : <p>Cadastre a localização no editor do anúncio.</p>}<Link className="secondaryButton" href="/painel/anuncio">Editar localização</Link></section>

      <section className="authCard"><h2>Revisão e envio</h2><p>Salve primeiro a configuração operacional e depois revise o anúncio completo. O envio muda o estado para análise e não publica automaticamente.</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="button" className="secondaryButton" disabled={saving} onClick={save}>Salvar configuração</button><Link className="secondaryButton" href="/painel/anuncio/revisao">Revisar anúncio completo</Link><button type="button" className="primaryButton" disabled={saving || !profile} onClick={submit}>{saving ? "Processando…" : "Enviar para análise"}</button></div></section>
    </section>
  </main>;
}
