"use client";

import { useState } from "react";

type Props = { code: string; siteUrl: string };

export default function ReferralShareCard({ code, siteUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const link = `${siteUrl.replace(/\/$/, "")}/cadastro?ref=${encodeURIComponent(code)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="card">
      <div className="cardIcon">↗</div>
      <h2>Indique o Pecatho e ganhe comissão</h2>
      <p>Compartilhe seu link pessoal. Quando alguém se cadastrar por ele e pagar uma assinatura elegível, você recebe comissão de 10% sobre a receita líquida atribuível ao Pecatho.</p>
      <label style={{ display: "grid", gap: 8, marginTop: 12 }}>
        Seu link de indicação
        <input aria-label="Seu link de indicação" readOnly value={link} onFocus={(event) => event.currentTarget.select()} />
      </label>
      <button type="button" className="secondaryButton" onClick={copyLink} style={{ marginTop: 12 }}>
        {copied ? "Link copiado" : "Copiar link de indicação"}
      </button>
      <p className="fieldNote">A indicação fica registrada no primeiro cadastro atribuído e não pode ser substituída por outro link depois.</p>
    </article>
  );
}
