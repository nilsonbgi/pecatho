import Link from "next/link";

export default function PublicAdvertiserProfileNotFound() {
  return (
    <main className="publicProfileErrorPage" role="main">
      <div className="publicProfileErrorCard">
        <span className="publicProfileErrorEyebrow">PECATHO / PERFIL</span>
        <h1>Perfil não encontrado</h1>
        <p>
          Este anúncio não está disponível, foi removido ou o endereço informado
          não existe mais.
        </p>
        <div className="publicProfileErrorActions">
          <Link className="primaryButton" href="/anunciantes">
            Explorar anunciantes
          </Link>
          <Link className="secondaryButton" href="/">
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
