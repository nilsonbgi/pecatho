import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FansSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase.from("fans_creators").select("id,slug,display_name,status,created_at,updated_at,advertiser_profile_id").eq("user_id", user.id).maybeSingle();
  if (!creator) redirect("/fans/ativar");

  return <main className="shell fansShell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div><div className="navLinks"><Link href="/fans/gerenciar">Central</Link><Link href={`/fans/${creator.slug}`}>Ver perfil</Link></div></nav><section className="hero fansHero"><div className="eyebrow">CONFIGURAÇÕES • ESPAÇO FANS</div><h1>Configurações do <em>criador.</em></h1><p className="heroCopy">Acesse os controles atuais do seu espaço Fans sem alterar diretamente dados financeiros ou transacionais.</p><section className="fansOnboarding card"><div className="eyebrow">IDENTIDADE</div><h2>{creator.display_name}</h2><p>O perfil público, nome, apresentação e imagem são administrados na área de perfil.</p><div className="heroActions"><Link className="primaryButton" href="/fans/gerenciar/perfil">Editar perfil</Link><Link className="secondaryButton" href="/fans/gerenciar/recebimentos">Recebimentos</Link><Link className="secondaryButton" href="/fans/gerenciar">Central</Link></div></section><section className="fansMetrics"><article className="card"><span className="metricLabel">STATUS</span><strong>{creator.status === "active" ? "ATIVO" : String(creator.status || "—").toUpperCase()}</strong><p>Estado atual do espaço Fans</p></article><article className="card"><span className="metricLabel">SLUG</span><strong style={{fontSize:18}}>{creator.slug}</strong><p>Endereço público preservado</p></article><article className="card"><span className="metricLabel">VÍNCULO</span><strong>{creator.advertiser_profile_id ? "SIM" : "NÃO"}</strong><p>Perfil de anunciante associado</p></article></section><p className="fieldNote" style={{marginTop:18}}>Controles financeiros, cobranças e repasses continuam protegidos pelos fluxos transacionais do Pecatho. Esta área não expõe credenciais nem chaves de pagamento.</p></section></main>;
}
