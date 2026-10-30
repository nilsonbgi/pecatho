"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível solicitar a recuperação agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <nav className="topbar"><Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link><Link href="/login" className="navCta">Entrar</Link></nav>
      <section className="hero authHero">
        <div className="eyebrow">RECUPERAÇÃO DE ACESSO</div>
        <h1>Recupere sua <em>senha.</em></h1>
        <div className="authCard">
          {sent ? <><h2>Verifique seu e-mail.</h2><p className="authHint">Se houver uma conta associada a esse endereço, enviaremos um link para definir uma nova senha.</p><Link href="/login" className="primaryButton">Voltar ao login</Link></> : <form onSubmit={submit}>
            <p className="authHint">Informe o e-mail cadastrado. Enviaremos um link seguro para redefinir sua senha.</p>
            <label>E-mail<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label>
            {error && <p className="formError">{error}</p>}
            <button className="primaryButton" disabled={busy || !email.trim()}>{busy ? "Enviando..." : "Enviar link de recuperação"}</button>
            <p className="authHint"><Link href="/login">Voltar ao login</Link></p>
          </form>}
        </div>
      </section>
    </main>
  );
}
