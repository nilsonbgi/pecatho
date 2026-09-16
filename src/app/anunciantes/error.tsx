'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdvertisersError({
  reset,
}: {
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro ao carregar a descoberta de anunciantes.');
  }, []);

  return (
    <main className="discoveryStatePage" role="alert">
      <div className="discoveryStateShell discoveryStateShellCompact">
        <span className="discoveryStateEyebrow">PECATHO</span>
        <h1 className="discoveryStateTitle">Não foi possível carregar os anunciantes</h1>
        <p className="discoveryStateText">
          Ocorreu uma falha temporária ao preparar a descoberta. Tente novamente ou volte para o início.
        </p>
        <div className="discoveryStateActions">
          <button type="button" className="discoveryStatePrimary" onClick={() => reset()}>
            Tentar novamente
          </button>
          <Link className="discoveryStateSecondary" href="/">
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
