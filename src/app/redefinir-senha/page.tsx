"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function RedefinirSenhaPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) { setError("A senha deve ter pelo menos 8 caracteres."); return; }
    if (password !== confirmation) { setError("As senhas informadas não coincidem."); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("O link de recuperação é inválido ou expirou. Solicite um novo link.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar a senha.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <nav className="topbar"><Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link><Link href="/login" className="navCta">Entrar</Link></nav>
      <section className="hero authHero">
        <div className="eyebrow">NOVA SENHA</div>
        <h1>Defina sua <em>senha.</em></h1>
        <div className="authCard">
          {saved ? <><h2>Senha atualizada.</h2><p className="authHint">Sua senha foi alterada. Você já pode entrar com a nova credencial.</p><Link href="/login" className="primaryButton">Ir para o login</Link></> : <form onSubmit={submit}>
            <label>Nova senha<input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required /></label>
            <label>Confirme a nova senha<input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} minLength={8} autoComplete="new-password" required /></label>
            {error && <p className="formError">{error}</p>}
            <button className="primaryButton" disabled={busy}>{busy ? "Salvando..." : "Salvar nova senha"}</button>
          </form>}
        </div>
      </section>
    </main>
  );
}
