"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Conversation = { id: string; profile_id: string | null; updated_at: string; title: string; display_name: string; slug: string | null; lastMessage: string };

export default function MessagesPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          window.location.href = "/login?redirect=/painel/mensagens";
          return;
        }
        const { data: conversations, error: conversationError } = await supabase
          .from("conversations")
          .select("id,profile_id,updated_at")
          .order("updated_at", { ascending: false });
        if (conversationError) throw conversationError;

        const rows = conversations ?? [];
        const profileIds = rows.map((row) => row.profile_id).filter((value): value is string => Boolean(value));
        const { data: profiles, error: profileError } = profileIds.length
          ? await supabase.from("advertiser_profiles").select("id,title,display_name,slug").in("id", profileIds)
          : { data: [], error: null };
        if (profileError) throw profileError;

        const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
        const conversationIds = rows.map((row) => row.id);
        const { data: messages, error: messageError } = conversationIds.length
          ? await supabase.from("messages").select("conversation_id,body,created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false })
          : { data: [], error: null };
        if (messageError) throw messageError;

        const latest = new Map<string, string>();
        for (const message of messages ?? []) {
          if (!latest.has(message.conversation_id)) latest.set(message.conversation_id, message.body);
        }

        const mapped = rows.map((row) => {
          const profile = row.profile_id ? profileMap.get(row.profile_id) : null;
          return {
            id: row.id,
            profile_id: row.profile_id,
            updated_at: row.updated_at,
            title: profile?.title || "Conversa Pecatho",
            display_name: profile?.display_name || "Anunciante",
            slug: profile?.slug || null,
            lastMessage: latest.get(row.id) || "Nenhuma mensagem enviada ainda.",
          };
        });
        if (active) setItems(mapped);
      } catch (err) {
        console.error(err);
        if (active) setError("Não foi possível carregar suas conversas.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <main className="shell">
      <nav className="topbar">
        <Link href="/painel" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link>
        <div className="navLinks"><Link href="/anunciantes">Anunciantes</Link><Link href="/painel">Painel</Link></div>
      </nav>
      <section className="hero">
        <div className="eyebrow">COMUNICAÇÃO</div>
        <h1>Minhas <em>conversas.</em></h1>
        <p className="heroCopy">Converse diretamente com anunciantes publicados no Pecatho, mantendo a interação dentro da plataforma.</p>
        {loading && <div className="card"><p>Carregando conversas...</p></div>}
        {error && <div className="card"><p>{error}</p></div>}
        {!loading && !error && items.length === 0 && <div className="card"><h2>Nenhuma conversa ainda.</h2><p>Abra um perfil publicado em Anunciantes e use o botão para iniciar uma conversa.</p><Link href="/anunciantes" className="primaryButton">Encontrar anunciantes</Link></div>}
        {!loading && !error && items.length > 0 && <section className="pillars">{items.map((item) => <article className="card" key={item.id}><div className="eyebrow">CONVERSA</div><h2>{item.title}</h2><p>{item.display_name}</p><p className="fieldNote">{item.lastMessage}</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}><Link href={`/painel/mensagens/${item.id}`} className="primaryButton">Abrir conversa</Link>{item.slug && <Link href={`/anunciantes/${item.slug}`} className="secondaryButton">Ver perfil</Link>}</div></article>)}</section>}
      </section>
    </main>
  );
}
