"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function LocalidadesPage() {
  const [cityCount, setCityCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

  async function loadCount() {
    const { count, error: countError } = await supabase.from("cities").select("id", { count: "exact", head: true });
    if (countError) setError(countError.message);
    else setCityCount(count ?? 0);
  }

  useEffect(() => { void loadCount(); }, []);

  async function synchronize() {
    setBusy(true); setError(""); setMessage("");
    const { data, error: invokeError } = await supabase.functions.invoke("sync-ibge-localidades", { body: {} });
    if (invokeError) { setError(invokeError.message); setBusy(false); return; }
    if (data?.error) { setError(data.error); setBusy(false); return; }
    setCityCount(data?.cities ?? 0);
    setMessage(data?.already_synced ? `A base já estava sincronizada com ${data.cities} municípios.` : `Sincronização concluída: ${data.cities} municípios brasileiros cadastrados.`);
    setBusy(false);
  }

  return <main className="shell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><Link href="/painel" className="navCta">Painel</Link></nav><section className="hero"><div className="eyebrow">BASE TERRITORIAL</div><h1>Estados e <em>municípios.</em></h1><p className="heroCopy">A base territorial do Pecatho utiliza os códigos oficiais do IBGE para eliminar erros de digitação no cadastro.</p><section className="authCard" style={{maxWidth: 760, margin: "32px auto"}}><h2>Sincronização oficial</h2><p>Os 27 registros de Unidades da Federação já foram preparados. A sincronização abaixo consulta a API pública do IBGE e grava os municípios com seu código oficial.</p><div className="publicationBox"><strong>{cityCount === null ? "Consultando..." : `${cityCount.toLocaleString("pt-BR")} municípios cadastrados`}</strong><p>Depois da sincronização, o cadastro poderá utilizar Estado → Município sem texto livre.</p></div>{error && <p className="formError">{error}</p>}{message && <p className="formSuccess">{message}</p>}<button className="primaryButton" onClick={synchronize} disabled={busy || (cityCount ?? 0) > 0}>{busy ? "Sincronizando IBGE..." : (cityCount ?? 0) > 0 ? "Base já sincronizada" : "Sincronizar municípios do IBGE"}</button></section></section></main>;
}
