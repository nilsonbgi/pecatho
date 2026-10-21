import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfessionalPremiumPlans from "@/components/ProfessionalPremiumPlans";

export const dynamic = "force-dynamic";

export default async function AdvertiserPremiumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("advertiser_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/painel/anuncio");

  return <main className="shell advertiserDashboard">
    <nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><div className="navLinks"><Link href="/painel/anuncio">Editar anúncio</Link><Link href="/painel">Painel</Link></div></nav>
    <section className="hero">
      <div className="eyebrow">VISIBILIDADE PROFISSIONAL · ACOMPANHANTES</div>
      <h1>Seu perfil merece <em>destaque.</em></h1>
      <p className="heroCopy">Compare os planos ativos, veja os diferenciais reais de cada modalidade e contrate somente depois que seu anúncio estiver publicado. O destaque é liberado após a confirmação do pagamento.</p>
      <ProfessionalPremiumPlans />
    </section>
  </main>;
}
