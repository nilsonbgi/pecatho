import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function FansActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("fans_creators")
    .select("id,display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) redirect("/fans/ativar");

  const { data, error } = await supabase
    .from("fans_notifications")
    .select("id,type,title,body,data,read_at,created_at")
    .eq("user_id", user.id)
    .in("type", ["fans_like", "fans_comment"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  const activity = (data ?? []) as Notification[];
  const likes = activity.filter((item) => item.type === "fans_like").length;
  const comments = activity.filter((item) => item.type === "fans_comment").length;
  const unread = activity.filter((item) => !item.read_at).length;

  return (
    <main className="shell fansShell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div>
        <div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href="/painel/notificacoes">Notificações</Link></div>
      </nav>

      <section className="hero fansHero">
        <div className="eyebrow">RELACIONAMENTO • ATIVIDADE</div>
        <h1>Atividade do seu <em>Fans.</em></h1>
        <p className="heroCopy">Acompanhe as interações recentes nas suas publicações e retorne rapidamente à operação do criador.</p>

        <div className="heroActions">
          <Link className="secondaryButton" href="/painel/notificacoes">Central de notificações</Link>
          <Link className="secondaryButton" href="/fans/gerenciar/publicacoes">Suas publicações</Link>
        </div>

        <section className="fansMetrics">
          <article className="card"><span className="metricLabel">CURTIDAS</span><strong>{likes}</strong><p>Interações registradas</p></article>
          <article className="card"><span className="metricLabel">COMENTÁRIOS</span><strong>{comments}</strong><p>Conversas nas publicações</p></article>
          <article className="card"><span className="metricLabel">NÃO LIDAS</span><strong>{unread}</strong><p>Atividades pendentes de leitura</p></article>
        </section>

        <section className="fansOnboarding card">
          <div className="eyebrow">FEED DE ATIVIDADE</div>
          {activity.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {activity.map((item) => {
                const postId = typeof item.data?.post_id === "string" ? item.data.post_id : null;
                const href = postId ? `/fans/gerenciar/publicacoes/${postId}` : "/fans/gerenciar/publicacoes";
                return (
                  <article key={item.id} className="card" style={{ minHeight: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                    <div style={{ minWidth: 0 }}>
                      <span className="serviceLabel">{item.type === "fans_like" ? "CURTIDA" : "COMENTÁRIO"} • {formatDate(item.created_at)}</span>
                      <h2 style={{ marginTop: 8 }}>{item.title}</h2>
                      <p>{item.body || "Nova atividade na sua publicação."}</p>
                      {!item.read_at && <small style={{ color: "#747c8b" }}>Não lida</small>}
                    </div>
                    <Link className="secondaryButton" href={href}>Abrir publicação</Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div><h2>Nenhuma interação ainda</h2><p>Quando suas publicações receberem curtidas ou comentários, a atividade aparecerá aqui.</p></div>
          )}
        </section>
      </section>
    </main>
  );
}
