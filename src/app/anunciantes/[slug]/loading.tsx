export default function PublicAdvertiserProfileLoading() {
  return (
    <main className="publicProfileLoading" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando perfil público…</span>
      <section className="publicProfileHero">
        <div className="profileLoadingEyebrow" />
        <div className="profileLoadingTitle" />
        <div className="profileLoadingMeta" />
        <div className="profileLoadingStats">
          <span />
          <span />
          <span />
        </div>
      </section>
      <section className="publicProfileGrid profileLoadingGrid">
        <div className="card profileLoadingCard">
          <div className="profileLoadingLine profileLoadingLineWide" />
          <div className="profileLoadingLine" />
          <div className="profileLoadingLine" />
          <div className="profileLoadingLine profileLoadingLineShort" />
        </div>
        <div className="card profileLoadingCard">
          <div className="profileLoadingLine profileLoadingLineWide" />
          <div className="profileLoadingMedia" />
        </div>
      </section>
    </main>
  );
}
