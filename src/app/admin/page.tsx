"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminConsole from "./AdminConsole";
import BootstrapAdmin from "./BootstrapAdmin";
import { createClient } from "@/lib/supabase/browser";

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "bootstrap" | "admin" | "error">("loading");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => createClient()).then(async (supabase) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError?.message === "Auth session missing!" || !user) { router.replace("/login"); return; }
      if (authError) { setError(authError.message); setState("error"); return; }
      const { data: roleRow, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["super_admin", "admin", "moderator", "support", "finance"]).limit(1).maybeSingle();
      if (!active) return;
      if (roleError) { setError(roleError.message); setState("error"); return; }
      if (roleRow?.role) { setRole(String(roleRow.role)); setState("admin"); } else if (user.email?.trim().toLowerCase() === "nilson.umasno@gmail.com") { setState("bootstrap"); } else { router.replace("/painel"); return; }
    }).catch((err: unknown) => { if (!active) return; setError(err instanceof Error ? err.message : "Configuração do Supabase indisponível."); setState("error"); });
    return () => { active = false; };
  }, [router]);

  if (state === "loading") return <main className="shell"><section className="hero"><div className="eyebrow">ADMINISTRAÇÃO PECATHO</div><h1>Carregando <em>administração.</em></h1><p className="heroCopy">Preparando o centro de gestão da plataforma.</p><div className="authCard"><p>Verificando a conta administrativa...</p></div></section></main>;
  if (state === "error") return <main className="shell"><section className="hero"><div className="eyebrow">ADMINISTRAÇÃO PECATHO</div><h1>Não foi possível carregar a <em>administração.</em></h1><div className="authCard"><p className="formError">{error}</p><button type="button" className="primaryButton" onClick={() => window.location.reload()}>Tentar novamente</button></div></section></main>;
  if (state === "bootstrap") return <BootstrapAdmin />;
  return <><AdminConsole role={role} /><nav aria-label="Atalhos administrativos" style={{ maxWidth: 1400, margin: "0 auto 32px", padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: 10, border: "1px solid #30333d", borderRadius: 14, background: "#10131b" }}><strong style={{ gridColumn: "1 / -1", color: "#e7c33f", fontSize: 13, letterSpacing: ".06em" }}>MÓDULOS ADMINISTRATIVOS</strong><Link href="/admin/recebimentos" className="secondaryButton">Recebimentos Fans</Link><Link href="/admin/revisao" className="primaryButton">Revisão e moderação</Link><Link href="/admin/governanca" className="secondaryButton">Governança e Blacklist</Link><Link href="/admin/publicidade" className="primaryButton">Publicidade e campanhas</Link><Link href="/admin/parceiros" className="secondaryButton">Parceiros</Link><Link href="/admin/beneficios" className="secondaryButton">Pontos e benefícios</Link></nav></>;
}
