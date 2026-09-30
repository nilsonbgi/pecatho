import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ClientePainel() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("display_name,status,account_type").eq("id", user.id).maybeSingle();
  if (profile?.account_type !== "customer") redirect("/painel");

  const admin = createAdminClient();
  const [{ data: sales }, { count: mediaPurchases }, { count: followingCount }, { count: conversationCount }, { count: unreadNotifications }, { data: reviews }] = await Promise.all([
    admin.from("digital_content_sales").select("amount,status").eq("buyer_user_id", user.id),
    admin.from("profile_media_purchases").select("id", { count: "exact", head: true }).eq("buyer_user_id", user.id).eq("status", "paid"),
    admin.from("user_follows").select("profile_id", { count: "exact", head: true }).eq("follower_id", user.id),
    admin.from("conversation_members").select("conversation_id", { count: "exact", head: true }).eq("user_id", user.id),
    admin.from("fans_notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    admin.from("customer_reviews").select("id,rating,comment,source_type,created_at").eq("customer_user_id", user.id).eq("status", "approved").eq("verified_interaction", true).order("created_at", { ascending: false }).limit(8),
  ]);

  const paidSales = (sales ?? []).filter((sale) => sale.status === "paid");
  const spent = paidSales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const ratings = (reviews ?? []).map((review) => Number(review.rating)).filter(Number.isFinite);
  const average = ratings.length ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)) : null;

  return (
    <main className="shell advertiserDashboard">
      <nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><div className="navLinks"><Link href="/">Página inicial</Link><Link href="/anunciantes">Anunciantes</Link><Link href="/conteudos">Conteúdos</Link><Link href="/painel/perfil">Meu cadastro</Link></div></nav>
      <section className="hero">
        <div className="eyebrow">PECATHO · ÁREA DO CLIENTE</div>
        <h1>Olá, <em>{profile?.display_name || user.email}</em></h1>
        <p className="heroCopy">Seu espaço é separado das áreas profissionais. Aqui você contrata serviços, conversa com anunciantes, acompanha seus conteúdos e constrói sua reputação como cliente.</p>
        <section className="pillars">
          <article className="card"><div className="cardIcon">★</div><h2>Minha reputação</h2><p className="financeBig">{average !== null ? average.toFixed(1) + " / 5" : "Ainda sem rating"}</p><p>{ratings.length ? ratings.length + " avaliação" + (ratings.length === 1 ? "" : "ões") + " verificada" + (ratings.length === 1 ? "" : "s") + "." : "Sua nota será construída somente a partir de interações verificadas."}</p></article>
          <article className="card"><div className="cardIcon">C</div><h2>Conteúdos comprados</h2><p className="financeBig">{paidSales.length}</p><p>{money(spent)} em compras confirmadas.</p><Link className="secondaryButton" href="/conteudos/minhas-compras">Minha biblioteca</Link></article>
          <article className="card"><div className="cardIcon">M</div><h2>Mensagens</h2><p>{conversationCount ?? 0} {(conversationCount ?? 0) === 1 ? "conversa ativa" : "conversas ativas"}.</p><Link className="secondaryButton" href="/painel/mensagens">Abrir mensagens</Link></article>
          <article className="card"><div className="cardIcon">♥</div><h2>Perfis acompanhados</h2><p>{followingCount ?? 0} {(followingCount ?? 0) === 1 ? "perfil" : "perfis"} acompanhados.</p><Link className="secondaryButton" href="/painel/seguindo">Ver acompanhamentos</Link></article>
          <article className="card"><div className="cardIcon">N</div><h2>Notificações</h2><p>{unreadNotifications ?? 0} não lida{unreadNotifications === 1 ? "" : "s"}.</p><Link className="secondaryButton" href="/painel/notificacoes">Abrir central</Link></article>
          <article className="card"><div className="cardIcon">P</div><h2>Meu cadastro</h2><p>Identidade e localização permanecem privadas. O rating não expõe seus dados pessoais.</p><Link className="secondaryButton" href="/painel/perfil">Editar cadastro</Link></article>
        </section>
        <section className="card"><div className="eyebrow">REPUTAÇÃO DO CLIENTE</div><h2>Seu histórico de confiança</h2>{reviews?.length ? <div className="financeHistory">{reviews.map((review) => <article key={review.id}><div><strong className="text-amber-300">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</strong><small>{review.source_type === "digital_content" ? "Compra de conteúdo" : review.source_type === "profile_media" ? "Compra de mídia exclusiva" : "Experiência de serviço"} · {new Date(review.created_at).toLocaleString("pt-BR")}</small></div>{review.comment ? <p>{review.comment}</p> : <span className="financeStatus">Interação verificada</span>}</article>)}</div> : <p className="fieldNote">Ainda não há avaliações verificadas. Elas aparecerão conforme vendedores e anunciantes registrarem experiências reais com você.</p>}</section>
        <section className="card"><div className="eyebrow">PROTEÇÃO</div><h2>Uma conta de cliente, sem mistura de funções</h2><p>O perfil de cliente não recebe ferramentas de anúncio, publicação ou recebimento. Se você quiser atuar profissionalmente no futuro, essa capacidade será tratada separadamente da sua identidade de cliente.</p><div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:16}}><Link className="primaryButton" href="/anunciantes">Encontrar anunciantes</Link><Link className="secondaryButton" href="/conteudos">Explorar conteúdos</Link></div></section>
      </section>
    </main>
  );
}
