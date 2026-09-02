"use client";

import Link from "next/link";
import { useState } from "react";

export default function AtivarFansPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ativar() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/fans/ativar", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Não foi possível criar seu espaço Fans.");
      window.location.assign(data?.redirect || "/fans");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar seu espaço Fans.");
      setBusy(false);
    }
  }

  return (
    <main className="shell fansShell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div>
        <div className="navLinks"><Link href="/fans">Voltar ao Fans</Link></div>
      </nav>

      <section className="hero fansHero">
        <div className="eyebrow">NOVO CRIADOR</div>
        <h1>Crie seu espaço no <em>Fans.</em></h1>
        <p className="heroCopy">Você não precisa criar um anúncio de serviços no Pecatho para utilizar o Fans. Esta etapa cria somente o seu perfil de criador de conteúdo.</p>

        <section className="fansOnboarding card">
          <div className="cardIcon">F</div>
          <h2>Seu espaço será criado agora</h2>
          <p>Depois da criação, você poderá configurar sua apresentação, imagem, planos de assinatura e conteúdos. O vínculo com um eventual perfil de anunciante é opcional.</p>
          {error && <p className="formError" role="alert">{error}</p>}
          <button className="primaryButton" type="button" onClick={ativar} disabled={busy}>
            {busy ? "Criando seu espaço..." : "Criar meu espaço Fans"}
          </button>
        </section>
      </section>
    </main>
  );
}
