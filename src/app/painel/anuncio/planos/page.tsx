"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Plan = { id: string; name: string; description: string | null; duration_days: number; price: number | string; active: boolean; free: boolean; has_video: boolean; audience: "companion" | "content_seller" | "both"; featured_card: boolean; search_priority: number; show_premium_badge: boolean; profile_theme: "standard" | "highlighted" | "premium" };

export default function PublicationPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileTitle, setProfileTitle] = useState("Seu anúncio");
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
      const { data: profile, error: profileError } = await supabase.from("advertiser_profiles").select("id,title,display_name").eq("user_id", user.id).maybeSingle();
      if (profileError) throw profileError;
      if (!profile) { setError("Crie e salve seu anúncio antes de contratar um plano."); return; }
      setProfileId(profile.id);
      setProfileTitle(profile.title || profile.display_name || "Seu anúncio");
      const [{ data: creator, error: creatorError }, { data, error: plansError }] = await Promise.all([
        supabase.from("fans_creators").select("id").eq("advertiser_profile_id", profile.id).eq("status", "active").maybeSingle(),
        supabase.from("publication_plans").select("id,name,description,duration_days,price,active,free,has_video,audience,featured_card,search_priority,show_premium_badge,profile_theme").eq("active", true).order("price", { ascending: true }),
      ]);
      if (creatorError) throw creatorError;
      if (plansError) throw plansError;
      const audience = creator ? "content_seller" : "companion";
      setPlans(((data ?? []) as Plan[]).filter((plan) =>
        (plan.free ? Number(plan.price) === 0 : Number(plan.price) > 0) &&
        (plan.audience === "both" || plan.audience === audience)
      ));
    } catch (cause) {
      console.error(cause);
      setError("Não foi possível carregar os planos. Confirme se a migration de diferenciais está aplicada.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function choosePlan(plan: Plan) {
    if (!profileId || busyId) return;
    setBusyId(plan.id); setError(""); setMessage("");
    try {
      const response = await fetch("/api/anunciantes/planos/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan_id: plan.id, profile_id: profileId }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Não foi possível contratar este plano.");
      if (result?.activated) { setMessage("Plano gratuito ativado com sucesso."); return; }
      if (typeof result?.checkout_url === "string" && /^https:\/\//i.test(result.checkout_url)) { window.location.assign(result.checkout_url); return; }
      throw new Error("O Mercado Pago não retornou um endereço válido de checkout.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível contratar este plano."); }
    finally { setBusyId(null); }
  }

  const money = (value: number | string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
  return <main className="shell advertiserDashboard premiumAdminDashboard">
    <nav className="topbar"><Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link><div className="navLinks"><Link href="/painel/perfil">Meu perfil</Link><Link href="/painel/anuncio/midias">Minhas mídias</Link></div></nav>
    <section className="hero premiumAdminHero"><div className="eyebrow">PLANOS DE PUBLICAÇÃO</div><h1>Dê mais <em>visibilidade</em> ao seu perfil.</h1><p className="heroCopy">Escolha um plano para {profileTitle}. Os diferenciais são aplicados somente durante a vigência da publicação.</p>{error && <p role="alert" className="fieldNote">{error}</p>}{message && <p role="status" className="fieldNote">{message}</p>}</section>
    {loading ? <section className="card"><p>Carregando planos disponíveis…</p></section> : <section className="premiumPublicationPlanGrid">{plans.map((plan) => <article className={`card premiumPublicationPlanCard ${plan.featured_card ? "planFeaturedCard" : ""} ${plan.profile_theme === "premium" ? "planThemePremium" : plan.profile_theme === "highlighted" ? "planThemeHighlighted" : ""}`} key={plan.id}><div className="eyebrow">{plan.audience === "both" ? "AMBOS OS PÚBLICOS" : plan.audience === "content_seller" ? "VENDEDORES DE CONTEÚDO" : "ACOMPANHANTES"}</div><h2>{plan.name}</h2><p>{plan.description || "Plano de publicação Pecatho."}</p><div className="premiumPublicationPrice">{plan.free ? "Gratuito" : money(plan.price)}<small> por {plan.duration_days} dias</small></div><ul className="premiumPublicationFeatures">{plan.featured_card && <li>Card especial com destaque visual</li>}{plan.search_priority > 0 && <li>Prioridade nas pesquisas: {plan.search_priority}/100</li>}{plan.show_premium_badge && <li>Selo Premium no card e no perfil</li>}{plan.profile_theme !== "standard" && <li>Perfil visual {plan.profile_theme === "premium" ? "Premium" : "em destaque"}</li>}{plan.has_video && <li>Vídeos habilitados durante a vigência</li>}{!plan.featured_card && plan.search_priority === 0 && !plan.show_premium_badge && plan.profile_theme === "standard" && !plan.has_video && <li>Publicação básica</li>}</ul><button type="button" className="primaryButton" disabled={!profileId || busyId !== null} onClick={() => void choosePlan(plan)}>{busyId === plan.id ? "Preparando contratação…" : plan.free ? "Ativar plano gratuito" : "Contratar plano"}</button></article>)}</section>}
    {!loading && !plans.length && <section className="card"><h2>Nenhum plano disponível</h2><p>Não há planos ativos compatíveis com este tipo de perfil no momento.</p></section>}
  </main>;
}
