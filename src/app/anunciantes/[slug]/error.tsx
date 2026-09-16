"use client";

import { useEffect } from "react";

export default function PublicAdvertiserProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public advertiser profile error:", error);
  }, [error]);

  return (
    <main className="publicProfileErrorPage" role="alert">
      <div className="publicProfileErrorCard">
        <span className="publicProfileErrorEyebrow">PECATHO · PERFIL</span>
        <h1>Não foi possível carregar este perfil</h1>
        <p>
          Ocorreu uma instabilidade momentânea. Você pode tentar novamente ou
          voltar para a descoberta de anunciantes.
        </p>
        <div className="publicProfileErrorActions">
          <button type="button" className="primaryButton" onClick={() => reset()}>
            Tentar novamente
          </button>
          <a className="secondaryButton" href="/anunciantes">
            Voltar aos anunciantes
          </a>
        </div>
      </div>
    </main>
  );
}
