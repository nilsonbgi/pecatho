"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Conversation = { id: string; profile_id: string | null; updated_at: string; title: string; display_name: string; slug: string | null; lastMessage: string; unread: boolean };

type ConversationRow = { id: string; profile_id: string | null; updated_at: string };
type MemberRow = { conversation_id: string; last_read_at: string | null };
type MessageRow = { conversation_id: string; body: string; created_at: string; sender_id: string };

export default function MessagesPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof createClient>["realtime"]["channels"][number] | null = null;
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

        const rows = (conversations ?? []) as ConversationRow[];
        const conversationIds = rows.map((row) => row.id);
        const profileIds = rows.map((row) => row.profile_id).filter((value): value is string => Boolean(value));

        const [profileResult, memberResult, messageResult] = await Promise.all([
          profileIds.length
            ? supabase.from("advertiser_profiles").select("id,title,display_name,slug").in("id", profileIds)
            : Promise.resolve({ data: [], error: null }),
          conversationIds.length
            ? supabase.from("conversation_members").select("conversation_id,last_read_at").eq("user_id", authData.user.id).in("conversation_id", conversationIds)
            : Promise.resolve({ data: [], error: null }),
          conversationIds.length
            ? supabase.from("messages").select("conversation_id,body,created_at,sender_id").in("conversation_id", conversationIds).order("created_at", { ascending: false })
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (memberResult.error) throw memberResult.error;
        if (messageResult.error) throw messageResult.error;

        const profileMap = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));
        const memberMap = new Map((memberResult.data ?? []).map((member) => [member.conversation_id, member as MemberRow]));
        const latest = new Map<string, MessageRow>();
        for (const message of (messageResult.data ?? []) as MessageRow[]) {
          if (!latest.has(message.conversation_id)) latest.set(message.conversation_id, message);
        }

        const mapped = rows.map((row) => {
          const profile = row.profile_id ? profileMap.get(row.profile_id) : null;
          const member = memberMap.get(row.id);
          const lastMessage = latest.get(row.id);
          const unread = Boolean(lastMessage && lastMessage.sender_id !== authData.user.id && (!member?.last_read_at || new Date(lastMessage.created_at).getTime() > new Date(member.last_read_at).getTime()));
          return {
            id: row.id,
            profile_id: row.profile_id,
            updated_at: row.updated_at,
            title: profile?.title || "Conversa Pecatho",
            display_name: profile?.display_name || "Anunciante",
            slug: profile?.slug || null,
            lastMessage: lastMessage?.body || "Nenhuma mensagem enviada ainda.",
            unread,
          };
        });
        if (active) setItems(mapped);

        channel = supabase.channel("messages-inbox-" + authData.user.id)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
            const incoming = payload.new as MessageRow;
            if (!conversationIds.includes(incoming.conversation_id)) return;
            setItems((current) => {
              const next = current.map((item) => item.id === incoming.conversation_id
                ? { ...item, updated_at: incoming.created_at, lastMessage: incoming.body, unread: incoming.sender_id !== authData.user.id }
                : item);
              return [...next].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            });
          })
          .subscribe();
      } catch (err) {
        console.error(err);
        if (active) setError("Não foi possível carregar suas conversas.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      if (channel) {
        const cleanupClient = createClient();
        void cleanupClient.removeChannel(channel);
      }
    };
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
        {!loading && !error && items.length > 0 && <section className="pillars">{items.map((item) => <article className="card" key={item.id} style={{ borderColor: item.unread ? "var(--accent, #E7C33F)" : undefined }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><div className="eyebrow">CONVERSA</div>{item.unread && <strong style={{ fontSize: 12, letterSpacing: ".08em" }}>NOVA MENSAGEM</strong>}</div><h2>{item.title}</h2><p>{item.display_name}</p><p className="fieldNote">{item.lastMessage}</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}><Link href={`/painel/mensagens/${item.id}`} className="primaryButton">Abrir conversa</Link>{item.slug && <Link href={`/anunciantes/${item.slug}`} className="secondaryButton">Ver perfil</Link>}</div></article>)}</section>}
      </section>
    </main>
  );
}