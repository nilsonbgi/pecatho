import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export default async function AtivarFansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("fans_creators")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) redirect("/fans");

  async function criarEspaco() {
    "use server";

    const client = await createClient();
    const { data: { user: currentUser } } = await client.auth.getUser();
    if (!currentUser) redirect("/login");

    const metadata = currentUser.user_metadata as Record<string, unknown> | null;
    const metadataName = typeof metadata?.display_name === "string" ? metadata.display_name : "";
    const emailName = currentUser.email?.split("@")[0] || "criador";
    const displayName = metadataName.trim() || emailName;
    const baseSlug = slugify(displayName) || "criador";

    let slug = baseSlug;
    const { data: slugExists } = await client
      .from("fans_creators")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugExists) slug = `${baseSlug}-${currentUser.id.slice(0, 8)}`;

    const { error } = await client.from("fans_creators").insert({
      user_id: currentUser.id,
      advertiser_profile_id: null,
      slug,
      display_name: displayName,
      status: "active",
    });

    if (error) {
      throw new Error(`Não foi possível criar o espaço Fans: ${error.message}`);
    }

    redirect("/fans");
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
        <p className="heroCopy">
          Você não precisa criar um anúncio de serviços no Pecatho para utilizar o Fans. Esta etapa cria somente o seu perfil de criador de conteúdo.
        </p>

        <section className="fansOnboarding card">
          <div className="cardIcon">F</div>
          <h2>Seu espaço será criado agora</h2>
          <p>Depois da criação, você poderá configurar sua apresentação, imagem, planos de assinatura e conteúdos. O vínculo com um eventual perfil de anunciante é opcional.</p>
          <form action={criarEspaco}>
            <button className="primaryButton" type="submit">Criar meu espaço Fans</button>
          </form>
        </section>
      </section>
    </main>
  );
}
