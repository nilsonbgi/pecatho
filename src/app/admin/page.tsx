"use client";

import { useEffect, useState } from "react";
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
    const supabase = createClient();

    (async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError) {
        setError(authError.message);
        setState("error");
        return;
      }
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["super_admin", "admin", "moderator", "support", "finance"])
        .limit(1)
        .maybeSingle();

      if (!active) return;
      if (roleError) {
        setError(roleError.message);
        setState("error");
        return;
      }

      if (roleRow?.role) {
        setRole(String(roleRow.role));
        setState("admin");
      } else {
        setState("bootstrap");
      }
    })();

    return () => { active = false; };
  }, [router]);

  if (state === "loading") return <main className="shell"><section className="hero"><div className="eyebrow">ADMINISTRAÇÃO PECATHO</div><h1>Carregando <em>administração.</em></h1><p className="heroCopy">Preparando o centro de gestão da plataforma.</p><div className="authCard"><p>Verificando a conta administrativa...</p></div></section></main>;

  if (state === "error") return <main className="shell"><section className="hero"><div className="eyebrow">ADMINISTRAÇÃO PECATHO</div><h1>Não foi possível carregar a <em>administração.</em></h1><p className="heroCopy">O erro ocorreu durante a leitura da sessão ou do perfil administrativo.</p><div className="authCard"><p className="formError">{error}</p><button type="button" className="primaryButton" onClick={() => window.location.reload()}>Tentar novamente</button></div></section></main>;

  if (state === "bootstrap") return <BootstrapAdmin />;
  return <AdminConsole role={role} />;
}
