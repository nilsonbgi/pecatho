"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError("A autenticação foi concluída, mas o usuário não foi retornado.");
        return;
      }

      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["super_admin", "admin", "moderator", "support", "finance"])
        .limit(1)
        .maybeSingle();

      window.location.href = adminRole?.role ? "/admin" : "/painel";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível conectar ao serviço de autenticação.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div>
        <Link href="/" className="navCta">Início</Link>
      </nav>
      <section className="hero authHero">
        <div className="eyebrow">ACESSO SEGURO</div>
        <h1>Entrar no <em>Pecatho.</em></h1>
        <form className="authCard" onSubmit={submit}>
          <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <p className="formError">{error}</p>}
          <button className="primaryButton" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</button>
          <p className="authHint">Ainda não possui conta? <Link href="/cadastro">Cadastre-se</Link></p>
        </form>
      </section>
    </main>
  );
}
