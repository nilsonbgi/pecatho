"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Conversation = {
  id: string;
  profile_id: string | null;
  updated_at: string;
  title: string;
  display_name: string;
  slug: string | null;
  profileHref: string | null;
  lastMessage: string;
  lastMessageAt: string | null;
  unread: boolean;
};

type ConversationRow = { id: string; profile_id: string | null; updated_at: string };
type MemberRow = { conversation_id: string; last_read_at: string | null };
type FansConversationRow = { conversation_id: string; creator_id: string };
type CreatorRow = { id: string; display_name: string; slug: string | null };
type MessageRow = { conversation_id: string; body: string; created_at: string; sender_id: string };

export default function MessagesPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

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

        const [profileResult, memberResult, messageResult, fansConversationResult] = await Promise.all([
          profileIds.length
            ? supabase.from("advertiser_profiles").select("id,title,display_name,slug").in("id", profileIds)
            : Promise.resolve({ data: [], error: null }),
          conversationIds.length
            ? supabase.from("conversation_members").select("conversation_id,last_read_at").eq("user_id", authData.user.id).in("conversation_id", conversationIds)
            : Promise.resolve({ data: [], error: null }),
          conversationIds.length
            ? supabase.from("messages").select("conversation_id,body,created_at,sender_id").in("conversation_id", conversationIds).order("created_at", { ascending: false })
            : Promise.resolve({ data: [], error: null }),
          conversationIds.length
            ? supabase.from("fans_conversations").select("conversation_id,creator_id").in("conversation_id", conversationIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (memberResult.error) throw memberResult.error;
        if (messageResult.error) throw messageResult.error;
        if (fansConversationResult.error) throw fansConversationResult.error;

        const fansConversationRows = (fansConversationResult.data ?? []) as FansConversationRow[];
        const creatorIds = [...new Set(fansConversationRows.map((row) => row.creator_id))];
        const creatorResult = creatorIds.length
          ? await supabase.from("fans_creators").select("id,display_name,slug").in("id", creatorIds)
          : { data: [], error: null };
        if (creatorResult.error) throw creatorResult.error;

        const profileMap = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));
        const fansConversationMap = new Map(fansConversationRows.map((row) => [row.conversation_id, row]));
        const creatorMap = new Map(((creatorResult.data ?? []) as CreatorRow[]).map((creator) => [creator.id, creator]));
        const memberMap = new Map((memberResult.data ?? []).map((member) => [member.conversation_id, member as MemberRow]));
        const latest = new Map<string, MessageRow>();

        for (const message of (messageResult.data ?? []) as MessageRow[]) {
          if (!latest.has(message.conversation_id)) latest.set(message.conversation_id, message);
        }

        const mapped = rows.map((row) => {
          const profile = row.profile_id ? profileMap.get(row.profile_id) : null;
          const fansConversation = fansConversationMap.get(row.id);
          const creator = fansConversation ? creatorMap.get(fansConversation.creator_id) : null;
          const member = memberMap.get(row.id);
          const lastMessage = latest.get(row.id);
          const unread = Boolean(
            lastMessage &&
            lastMessage.sender_id !== authData.user.id &&
            (!member?.last_read_at ||
              new Date(lastMessage.created_at).getTime() > new Date(member.last_read_at).getTime()),
          );

          return {
            id: row.id,
            profile_id: row.profile_id,
            updated_at: row.updated_at,
            title: profile?.title || (creator ? "Conversa com " + creator.display_name : "Conversa Pecatho"),
            display_name: profile?.display_name || creator?.display_name || "Conversa privada",
            slug: profile?.slug || creator?.slug || null,
            profileHref: profile?.slug ? "/anunciantes/" + profile.slug : creator?.slug ? "/fans/" + creator.slug : null,
            lastMessage: lastMessage?.body || "Nenhuma mensagem enviada ainda.",
            lastMessageAt: lastMessage?.created_at || null,
            unread,
          };
        });

        if (active) setItems(mapped);

        channel = supabase
          .channel("messages-inbox-" + authData.user.id)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
            const incoming = payload.new as MessageRow;
            if (!conversationIds.includes(incoming.conversation_id)) return;

            setItems((current) => {
              const next = current.map((item) =>
                item.id === incoming.conversation_id
                  ? {
                      ...item,
                      updated_at: incoming.created_at,
                      lastMessage: incoming.body,
                      lastMessageAt: incoming.created_at,
                      unread: incoming.sender_id !== authData.user.id,
                    }
                  : item,
              );

              return [...next].sort(
                (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
              );
            });
          })
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "conversations", filter: "id=in.(" + conversationIds.join(",") + ")" },
            (payload) => {
              const incoming = payload.new as ConversationRow;
              setItems((current) =>
                [...current]
                  .map((item) =>
                    item.id === incoming.id
                      ? { ...item, profile_id: incoming.profile_id, updated_at: incoming.updated_at }
                      : item,
                  )
                  .sort(
                    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
                  ),
              );
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "conversation_members",
              filter: "user_id=eq." + authData.user.id,
            },
            (payload) => {
              const incoming = payload.new as MemberRow;
              setItems((current) =>
                current.map((item) => {
                  if (item.id !== incoming.conversation_id || !item.lastMessageAt) return item;

                  const unread = Boolean(
                    new Date(item.lastMessageAt).getTime() >
                      (incoming.last_read_at ? new Date(incoming.last_read_at).getTime() : 0),
                  );

                  return { ...item, unread };
                }),
              );
            },
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "conversation_members",
              filter: "user_id=eq." + authData.user.id,
            },
            (payload) => {
              const incoming = payload.new as MemberRow;
              if (!conversationIds.includes(incoming.conversation_id)) return;

              setItems((current) =>
                current.map((item) => {
                  if (item.id !== incoming.conversation_id || !item.lastMessageAt) return item;

                  const unread = Boolean(
                    new Date(item.lastMessageAt).getTime() >
                      (incoming.last_read_at ? new Date(incoming.last_read_at).getTime() : 0),
                  );

                  return { ...item, unread };
                }),
              );
            },
          )
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

  const visibleItems = items.filter((item) => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    const matchesQuery = !term || [item.title, item.display_name, item.lastMessage].some((value) => value.toLocaleLowerCase("pt-BR").includes(term));
    return matchesQuery && (filter === "all" || item.unread);
  });
  const unreadCount = items.filter((item) => item.unread).length;

  return (
    <main className="shell">
      <nav className="topbar">
        <Link href="/painel" className="brand">
          <span className="brandMark">P</span>
          <span>Pecatho</span>
        </Link>
        <div className="navLinks">
          <Link href="/anunciantes">Acompanhantes</Link>
          <Link href="/painel/notificacoes">Notificações</Link>
          <Link href="/painel">Meu painel</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">COMUNICAÇÃO</div>
        <h1>
          Minhas <em>conversas.</em>
        </h1>
        <p className="heroCopy">
          Converse diretamente com anunciantes e criadores do Pecatho, mantendo a interação dentro da plataforma.
        </p>

        {!loading && !error && items.length > 0 && (
          <section aria-label="Filtros de conversas" className="card" style={{ display: "grid", gap: 14, marginTop: 20, padding: 18 }}>
            <label style={{ display: "grid", gap: 7, color: "var(--text, #F4F6FB)", fontSize: 13, fontWeight: 750 }}>
              Buscar nas conversas
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, perfil ou trecho da última mensagem..." aria-label="Buscar conversas" style={{ width: "100%", minHeight: 46, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,.18)", background: "#11131B", color: "#F4F6FB", outlineOffset: 3 }} />
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 9 }}>
              <button type="button" className={filter === "all" ? "primaryButton" : "secondaryButton"} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todas ({items.length})</button>
              <button type="button" className={filter === "unread" ? "primaryButton" : "secondaryButton"} aria-pressed={filter === "unread"} onClick={() => setFilter("unread")}>Não lidas ({unreadCount})</button>
              <span className="fieldNote" aria-live="polite">{visibleItems.length} {visibleItems.length === 1 ? "conversa encontrada" : "conversas encontradas"}</span>
            </div>
          </section>
        )}

        {loading && (
          <div className="card">
            <p>Carregando conversas...</p>
          </div>
        )}

        {error && (
          <div className="card">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="card">
            <h2>Nenhuma conversa ainda.</h2>
            <p>Abra um perfil de anunciante ou criador e use o botão para iniciar uma conversa.</p>
            <Link href="/anunciantes" className="primaryButton">
              Encontrar perfis
            </Link>
            <Link href="/fans" className="secondaryButton">
              Descobrir criadores Fans
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && visibleItems.length === 0 && (
          <div className="card" style={{ marginTop: 18 }}><h2>Nenhuma conversa corresponde ao filtro.</h2><p>Altere a busca ou mostre todas as conversas para continuar.</p><button type="button" className="secondaryButton" onClick={() => { setQuery(""); setFilter("all"); }}>Limpar filtros</button></div>
        )}

        {!loading && !error && visibleItems.length > 0 && (
          <section className="pillars">
            {visibleItems.map((item) => (
              <article
                className="card"
                key={item.id}
                style={{ borderColor: item.unread ? "var(--accent, #E7C33F)" : undefined }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div className="eyebrow">{item.profileHref?.startsWith("/fans/") ? "CONVERSA FANS" : "CONVERSA"}</div>
                  {item.unread && (
                    <strong style={{ fontSize: 12, letterSpacing: ".08em" }}>
                      NOVA MENSAGEM
                    </strong>
                  )}
                </div>
                <h2>{item.title}</h2>
                <p>{item.display_name}</p>
                <p className="fieldNote" style={{ overflowWrap: "anywhere" }}>{item.lastMessage}</p>
                {item.lastMessageAt && <p className="fieldNote" style={{ fontSize: 11, marginTop: 8 }}>Última atividade: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.lastMessageAt))}</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                  <Link href={`/painel/mensagens/${item.id}`} className="primaryButton">
                    Abrir conversa
                  </Link>
                  {item.profileHref && (
                    <Link href={item.profileHref} className="secondaryButton">
                      Ver perfil
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
