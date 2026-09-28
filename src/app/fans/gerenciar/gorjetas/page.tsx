import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function FansTipsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase.from("fans_creators").select("id,slug,display_name").eq("user_id", user.id).maybeSingle();
  if (!creator) redirect("/fans/ativar");

  const { data: tips, error } = await supabase.from("fans_tips").select("id,buyer_user_id,amount,creator_amount,currency,message,status,paid_at,created_at").eq("creator_id", creator.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const paid = (tips || []).filter((tip) => tip.status === "paid");
  const total = paid.reduce((sum, tip) => sum + Number(tip.creator_amount || 0), 0);

  return <main className="shell fansShell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div><div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href={`/fans/${creator.slug}`}>Ver perfil</Link></div></nav><section className="hero fansHero"><div className="eyebrow">MONETIZAÇÃO • GORJETAS</div><h1>Gorjetas <em>recebidas.</em></h1><p className="heroCopy">Acompanhe as gorjetas destinadas ao seu espaço Fans. O valor do criador considera somente registros efetivamente liquidados.</p><section className="fansMetrics"><article className="card"><span className="metricLabel">RECEBIDO</span><strong>{brl(total)}</strong><p>Total líquido do criador nos registros pagos</p></article><article className="card"><span className="metricLabel">PAGAS</span><strong>{paid.length}</strong><p>Gorjetas liquidadas</p></article><article className="card"><span className="metricLabel">REGISTROS</span><strong>{tips?.length ?? 0}</strong><p>Total de gorjetas registradas</p></article></section><section className="fansOnboarding card"><div className="eyebrow">HISTÓRICO</div>{tips?.length ? <div style={{display:"grid",gap:10,marginTop:14}}>{tips.map((tip)=><article key={tip.id} className="card" style={{minHeight:0}}><div style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"flex-start"}}><div><span className="serviceLabel">{tip.status === "paid" ? "PAGA" : String(tip.status || "PENDENTE").toUpperCase()}</span><h2 style={{marginTop:8}}>{brl(Number(tip.creator_amount || 0))}</h2><p>{tip.message || "Sem mensagem."}</p></div><small style={{color:"#747c8b"}}>{new Date(tip.created_at).toLocaleDateString("pt-BR")}</small></div></article>)}</div> : <div><h2>Nenhuma gorjeta registrada</h2><p>Quando sua audiência enviar gorjetas, os registros aparecerão aqui.</p></div>}</section></section></main>;
}
