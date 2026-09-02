import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function FansPlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase.from("fans_creators").select("id,display_name,status").eq("user_id", user.id).maybeSingle();
  if (!creator) redirect("/fans/ativar");

  const { data: plans, error } = await supabase.from("fans_plans").select("id,name,description,price,currency,duration_days,status,created_at,updated_at").eq("creator_id", creator.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (
    <main className="shell fansShell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div>
        <div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href="/fans">Visão geral</Link></div>
      </nav>
      <section className="hero fansHero">
        <div className="eyebrow">MONETIZAÇÃO • ASSINATURAS</div>
        <h1>Planos de <em>assinatura.</em></h1>
        <p className="heroCopy">Administre os planos oferecidos à sua audiência. Alterações de preço, duração e status ficam registradas no banco e a ativação continua protegida pelas regras do Fans.</p>
        <div className="heroActions"><Link className="primaryButton" href="/fans/gerenciar/planos/novo">Criar plano</Link><Link className="secondaryButton" href="/fans/gerenciar">Voltar à central</Link></div>

        <section className="fansMetrics">
          <article className="card"><span className="metricLabel">TOTAL</span><strong>{plans?.length ?? 0}</strong><p>Planos cadastrados</p></article>
          <article className="card"><span className="metricLabel">ATIVOS</span><strong>{plans?.filter((p) => p.status === "active").length ?? 0}</strong><p>Disponíveis para assinatura</p></article>
          <article className="card"><span className="metricLabel">RASCUNHOS</span><strong>{plans?.filter((p) => p.status === "draft").length ?? 0}</strong><p>Em preparação</p></article>
        </section>

        <section className="fansOnboarding card">
          <div className="eyebrow">CATÁLOGO DE PLANOS</div>
          {plans?.length ? <div style={{ display: "grid", gap: 12 }}>{plans.map((plan) => (
            <article key={plan.id} className="card" style={{ minHeight: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
              <div><span className="serviceLabel">{plan.status === "active" ? "ATIVO" : plan.status === "draft" ? "RASCUNHO" : "INATIVO"}</span><h2 style={{ marginTop: 8 }}>{plan.name}</h2><p>{plan.description || "Sem descrição cadastrada."}</p><small style={{ color: "#747c8b" }}>{plan.duration_days} dias • {brl(Number(plan.price || 0))}</small></div>
              <Link className="secondaryButton" href={`/fans/gerenciar/planos/${plan.id}`}>Editar</Link>
            </article>
          ))}</div> : <div><h2>Nenhum plano cadastrado</h2><p>Crie seu primeiro plano de assinatura para estruturar a monetização recorrente do Fans.</p></div>}
        </section>
        <p className="fieldNote" style={{ marginTop: 18 }}>O painel não altera compras, assinaturas ou saldo diretamente. A cobrança e os eventos financeiros serão processados por fluxos transacionais seguros.</p>
      </section>
    </main>
  );
}
