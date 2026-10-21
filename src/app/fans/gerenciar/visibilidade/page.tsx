"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Plan = { id: string; name: string; description: string | null; duration_days: number; price: number | string; active: boolean; free: boolean; audience: "companion" | "content_seller" | "both"; featured_card: boolean; search_priority: number; show_premium_badge: boolean; profile_theme: "standard" | "highlighted" | "premium"; has_video: boolean; max_gallery_items: number | null; features: Record<string, unknown> | null };

export default function FansVisibilityPlansPage() {
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState("Seu perfil Fans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const [{ data: creator, error: creatorError }, { data, error: plansError }] = await Promise.all([
        supabase.from("fans_creators").select("id,display_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("publication_plans").select("id,name,description,duration_days,price,active,free,audience,featured_card,search_priority,show_premium_badge,profile_theme,has_video,max_gallery_items,features").eq("active", true).order("price", { ascending: true }),
      ]);
      if (creatorError) throw creatorError;
      if (plansError) throw plansError;
      if (!creator) { setError("Ative seu espaço Fans antes de contratar um plano de visibilidade."); return; }
      setCreatorId(creator.id);
      setCreatorName(creator.display_name || "Seu perfil Fans");
      setPlans(((data ?? []) as Plan[]).filter((plan) =>
        (plan.free ? Number(plan.price) === 0 : Number(plan.price) > 0) &&
        (plan.audience === "both" || plan.audience === "content_seller")
      ));
    } catch (cause) {
      console.error(cause);
      setError("Não foi possível carregar os planos. Confirme se as migrations de diferenciais estão aplicadas.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function choosePlan(plan: Plan) {
    if (!creatorId || busyId) return;
    setBusyId(plan.id); setError(""); setMessage("");
    try {
      const response = await fetch("/api/fans/planos-publicacao/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan_id: plan.id, creator_id: creatorId }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Não foi possível contratar este plano.");
      if (result?.activated) { setMessage("Plano gratuito ativado com sucesso."); return; }
      if (typeof result?.checkout_url === "string" && /^https:\/\//i.test(result.checkout_url)) { window.location.assign(result.checkout_url); return; }
      throw new Error("O Mercado Pago não retornou um endereço válido de checkout.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível contratar este plano."); }
    finally { setBusyId(null); }
  }

  function planFeatures(plan: Plan): string[] {
    const features = plan.features ?? {};
    const hasBoolean = (key: string, fallback: boolean) =>
      typeof features[key] === "boolean" ? features[key] as boolean : fallback;
    const hasLimit = (key: string) =>
      typeof features[key] === "number" && Number.isFinite(features[key] as number) && (features[key] as number) > 0;
    const result: string[] = [];

    if (plan.featured_card) result.push("Card especial no catálogo");
    if (plan.search_priority > 0) result.push(`Prioridade nas pesquisas: ${plan.search_priority}/100`);
    if (plan.show_premium_badge) result.push("Selo Premium no perfil");
    if (plan.profile_theme !== "standard") result.push(`Perfil visual ${plan.profile_theme === "premium" ? "Premium" : "em destaque"}`);

    result.push(hasBoolean("photo_gallery", true) ? "Galeria de fotos incluída" : "Galeria de fotos não incluída");
    result.push(hasBoolean("video_gallery", plan.has_video) ? "Galeria de vídeos incluída" : "Galeria de vídeos não incluída");
    result.push(hasBoolean("advertiser_gallery", true) ? "Mídias autorizadas podem aparecer na galeria pública" : "Galeria pública não incluída");
    if (hasBoolean("featured_photo", false)) result.push("Foto de destaque no perfil");
    if (hasBoolean("featured_video", false)) result.push("Vídeo de destaque no perfil");
    if (hasBoolean("highlight_card_photo", false)) result.push("Foto diferenciada no card do catálogo");
    if (hasBoolean("profile_audio", false)) result.push("Áudio de apresentação no perfil");
    result.push(hasBoolean("allow_reviews", true) ? "Recebimento de avaliações habilitado" : "Recebimento de avaliações não incluído");
    result.push(hasBoolean("allow_gifts", false) ? "Recebimento de presentes virtuais habilitado" : "Presentes virtuais não incluídos");

    if (hasLimit("max_photos")) result.push(`Até ${features.max_photos} fotos`);
    if (hasLimit("max_videos")) result.push(`Até ${features.max_videos} vídeos`);
    const totalGalleryLimit = typeof plan.max_gallery_items === "number" && plan.max_gallery_items > 0
      ? plan.max_gallery_items
      : hasLimit("max_gallery_items") ? features.max_gallery_items as number : null;
    if (totalGalleryLimit !== null) result.push(`Até ${totalGalleryLimit} itens de galeria no total`);

    return result.length ? result : ["Publicação básica"];
  }

  const money = (value: number | string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
  return <main className="shell advertiserDashboard premiumAdminDashboard">
    <nav className="topbar"><Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link><div className="navLinks"><Link href="/fans/gerenciar/perfil">Gerenciar perfil</Link><Link href="/fans">Voltar ao Fans</Link></div></nav>
    <section className="hero premiumAdminHero"><div className="eyebrow">PECATHO FANS · VISIBILIDADE</div><h1>Amplie o alcance do seu <em>conteúdo.</em></h1><p className="heroCopy">Escolha um plano para {creatorName}. Os diferenciais são ativados após a confirmação do pagamento e permanecem até o fim da vigência.</p>{error && <p role="alert" className="fieldNote">{error}</p>}{message && <p role="status" className="fieldNote">{message}</p>}</section>
    {loading ? <section className="card"><p>Carregando planos…</p></section> : <section className="premiumPublicationPlanGrid">{plans.map((plan) => <article key={plan.id} className={`card premiumPublicationPlanCard ${plan.featured_card ? "planFeaturedCard" : ""} ${plan.profile_theme === "premium" ? "planThemePremium" : plan.profile_theme === "highlighted" ? "planThemeHighlighted" : ""}`}><div className="eyebrow">VENDEDORES DE CONTEÚDO</div><h2>{plan.name}</h2><p>{plan.description || "Plano de visibilidade Pecatho Fans."}</p><div className="premiumPublicationPrice">{plan.free ? "Gratuito" : money(plan.price)}<small> por {plan.duration_days} dias</small></div><ul className="premiumPublicationFeatures">{planFeatures(plan).map((feature) => <li key={feature}>{feature}</li>)}</ul><button type="button" className="primaryButton" disabled={!creatorId || busyId !== null} onClick={() => void choosePlan(plan)}>{busyId === plan.id ? "Preparando contratação…" : plan.free ? "Ativar plano gratuito" : "Contratar plano"}</button></article>)}</section>}
    {!loading && !plans.length && <section className="card"><h2>Nenhum plano disponível</h2><p>Não há planos ativos para vendedores de conteúdo no momento.</p></section>}
  </main>;
}
