export default function AdvertisersLoading() {
  return (
    <main className="discoveryStatePage" aria-busy="true" aria-label="Carregando anunciantes">
      <div className="discoveryStateShell">
        <span className="discoveryStateEyebrow">PECATHO</span>
        <h1 className="discoveryStateTitle">Preparando sua descoberta</h1>
        <p className="discoveryStateText">Estamos carregando os perfis disponíveis.</p>
        <div className="discoverySkeletonGrid">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="discoverySkeletonCard" key={index}>
              <div className="discoverySkeletonMedia" />
              <div className="discoverySkeletonLine discoverySkeletonLineLong" />
              <div className="discoverySkeletonLine discoverySkeletonLineShort" />
              <div className="discoverySkeletonPill" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
