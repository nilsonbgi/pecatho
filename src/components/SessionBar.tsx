"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

const STAFF_ROLES = ["super_admin", "admin", "moderator", "support", "finance"];

export default function SessionBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setEmail(user?.email ?? null);
      if (!user) {
        setIsStaff(false);
        return;
      }

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", STAFF_ROLES)
        .limit(1)
        .maybeSingle();

      if (active) setIsStaff(Boolean(roleRow?.role));
    }

    loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setEmail(session?.user?.email ?? null);
      if (!session?.user) setIsStaff(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
    setIsStaff(false);
    router.replace("/");
    router.refresh();
    setBusy(false);
  }

  if (!email) return null;

  return (
    <div className="sessionBar" aria-label="Sessão do usuário">
      <span className="sessionEmail">{email}</span>
      <Link href="/painel" className={pathname === "/painel" ? "sessionLink active" : "sessionLink"}>Meu painel</Link>
      {isStaff && <Link href="/admin" className={pathname.startsWith("/admin") ? "sessionLink active" : "sessionLink"}>Administração</Link>}
      <button type="button" className="sessionLogout" onClick={signOut} disabled={busy}>
        {busy ? "Saindo..." : "Sair"}
      </button>
    </div>
  );
}
