"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function BootstrapAdmin() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function activate() {
    setBusy(true); setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { error: dbError } = await supabase.rpc("bootstrap_first_super_admin");
    if (dbError) { setError(dbError.message); setBusy(false); return; }
    window.location.href = "/admin";
  }

  return <main className="shell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><Link href="/painel" className="navCta">Painel</Link></nav><section className="hero authHero"><div className="eyebrow">CONFIGURAÇÃO INICIAL</div><h1>Primeiro acesso <em>administrativo.</em></h1><p className="heroCopy">O banco ainda não possui nenhum perfil administrativo. Como esta é a primeira conta do ambiente, ela pode ser promovida a Superadministrador para que você possa cadastrar categorias, localidades, planos e anunciantes e validar a plataforma.</p><div className="authCard"><h2>Ativar administração</h2><p>Esta opção só funciona enquanto não existir nenhum administrador configurado.</p>{error && <p className="formError">{error}</p>}<button type="button" className="primaryButton" onClick={activate} disabled={busy}>{busy ? "Ativando..." : "Tornar esta conta Superadministrador"}</button></div></section></main>;
}
