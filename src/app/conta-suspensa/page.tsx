import Link from "next/link";

type SuspensionPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AccountSuspendedPage({ searchParams }: SuspensionPageProps) {
  const params = await searchParams;
  const blocked = params.status === "blocked";

  return (
    <main className="shell" style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "32px 18px" }}>
      <section style={{ width: "100%", maxWidth: 680, padding: 28, border: "1px solid #343846", borderRadius: 18, background: "#151821", color: "#F7F8FC" }}>
        <p style={{ color: "#E7C33F", fontWeight: 800, letterSpacing: ".12em", fontSize: 12 }}>PECATHO · GOVERNANÇA</p>
        <h1 style={{ fontSize: 30, lineHeight: 1.2, margin: "10px 0 14px" }}>{blocked ? "Conta bloqueada" : "Conta temporariamente suspensa"}</h1>
        <p style={{ color: "#C5CBD7", lineHeight: 1.7 }}>
          {blocked
            ? "O acesso ao painel está bloqueado por uma decisão de moderação. Se acredita que houve um engano, entre em contato com o suporte para solicitar uma revisão."
            : "O acesso ao painel está suspenso por uma decisão de moderação. A liberação ocorrerá após o prazo registrado, quando você acessar novamente sua conta."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
          <Link href="/como-funciona" style={{ color: "#E7C33F", fontWeight: 800 }}>Como funciona</Link>
          <Link href="/login" style={{ color: "#F7F8FC", fontWeight: 700 }}>Voltar ao login</Link>
        </div>
      </section>
    </main>
  );
}
