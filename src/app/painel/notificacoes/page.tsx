"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

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
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function NotificacoesPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (active) {
          setMessage("Entre na sua conta para visualizar suas notificações.");
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from("fans_notifications")
        .select("id,type,title,body,data,read_at,created_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      if (active) {
        setItems((data ?? []) as Notification[]);
        setLoading(false);
      }
    })().catch((error) => {
      console.error(error);
      if (active) {
        setMessage("Não foi possível carregar suas notificações.");
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  async function markRead(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("fans_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (error) return;
    setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
  }

  async function markAllRead() {
    setMarking(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setMarking(false); return; }
    const now = new Date().toISOString();
    const { error } = await supabase.from("fans_notifications").update({ read_at: now }).eq("user_id", auth.user.id).is("read_at", null);
    if (!error) setItems((current) => current.map((item) => item.read_at ? item : { ...item, read_at: now }));
    setMarking(false);
  }

  return (
    <main className="shell">
      <nav className="topbar">
        <Link href="/painel" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link>
        <div className="navLinks"><Link href="/anunciantes">Anunciantes</Link><Link href="/painel" className="navCta">Meu painel</Link></div>
      </nav>
      <section className="hero compactHero">
        <div className="eyebrow">CENTRAL DE ATIVIDADE</div>
        <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"end",flexWrap:"wrap"}}>
          <div><h1>Suas <em>notificações.</em></h1><p className="heroCopy">Acompanhe novidades importantes da sua conta, dos seus anúncios e das interações que acontecem no Pecatho.</p></div>
          {!loading && items.some((item) => !item.read_at) && <button type="button" className="secondaryButton" onClick={markAllRead} disabled={marking}>{marking ? "Marcando..." : "Marcar todas como lidas"}</button>}
        </div>
      </section>
      <section className="followingSection">
        {loading ? <div className="emptyDiscovery"><h2>Carregando suas notificações...</h2></div> : message ? <div className="emptyDiscovery"><h2>{message}</h2><Link href="/painel" className="primaryButton">Voltar ao painel</Link></div> : items.length === 0 ? <div className="emptyDiscovery"><h2>Nenhuma notificação por enquanto.</h2><p>Quando houver uma atividade relevante para você, ela aparecerá aqui.</p><Link href="/anunciantes" className="primaryButton">Explorar anunciantes</Link></div> : <div style={{display:"grid",gap:12,maxWidth:900}}>{items.map((item) => {
          const profileId = typeof item.data?.profile_id === "string" ? item.data.profile_id : null;
          const isFollow = item.type === "profile_followed";
          return <article key={item.id} className="card" style={{borderLeft: item.read_at ? undefined : "3px solid currentColor", opacity: item.read_at ? 0.86 : 1}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"start",flexWrap:"wrap"}}>
              <div><div className="eyebrow">{isFollow ? "ACOMPANHAMENTO" : "ATIVIDADE"}</div><h2 style={{marginBottom:8}}>{item.title}</h2><p style={{marginBottom:8}}>{item.body || "Há uma nova atividade na sua conta."}</p><small>{formatDate(item.created_at)}</small></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{isFollow && profileId && <Link href={`/painel/anuncio`} className="secondaryButton">Abrir meu anúncio</Link>}{!item.read_at && <button type="button" className="secondaryButton" onClick={() => markRead(item.id)}>Marcar como lida</button>}</div>
            </div>
          </article>;
        })}</div>}
      </section>
      <footer><span>Pecatho · central de atividade</span><Link href="/painel">Voltar ao painel</Link></footer>
    </main>
  );
}
