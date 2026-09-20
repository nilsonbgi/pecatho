"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Message = { id: string; sender_id: string; body: string; status: string; created_at: string };
type Profile = { id: string; title: string | null; display_name: string | null; slug: string | null };

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<ReturnType<typeof createClient> extends never ? never : any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function markAsRead(supabase = createClient(), authenticatedUserId = userId) {
    const { error: readError } = await supabase.rpc("mark_conversation_read", { p_conversation_id: params.id });
    if (readError) console.error("Não foi possível marcar a conversa como lida:", readError);
    if (authenticatedUserId) {
      const { error: notificationError } = await supabase.from("fans_notifications").update({ read_at: new Date().toISOString() }).eq("user_id", authenticatedUserId).eq("type", "message_received").is("read_at", null).filter("data->>conversation_id", "eq", params.id);
      if (notificationError) console.error("Não foi possível marcar a notificação como lida:", notificationError);
    }
  }

  async function load() {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      window.location.href = `/login?redirect=/painel/mensagens/${params.id}`;
      return;
    }
    setUserId(authData.user.id);

    const { data: conversation, error: conversationError } = await supabase.from("conversations").select("id,profile_id").eq("id", params.id).maybeSingle();
    if (conversationError || !conversation) throw conversationError || new Error("Conversa não encontrada.");

    const [profileResult, messageResult] = await Promise.all([
      conversation.profile_id
        ? supabase.from("advertiser_profiles").select("id,title,display_name,slug").eq("id", conversation.profile_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("messages").select("id,sender_id,body,status,created_at").eq("conversation_id", params.id).order("created_at", { ascending: true }),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (messageResult.error) throw messageResult.error;
    setProfile((profileResult.data as Profile | null) || null);
    setMessages((messageResult.data ?? []) as Message[]);
    await markAsRead(supabase, authData.user.id);
  }

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let typingTimeout: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      try {
        await load();
        if (!active) return;
        channel = supabase.channel("conversation:" + params.id, { config: { presence: { key: userId || "anonymous" } } });
        channelRef.current = channel;
        channel
          .on("presence", { event: "sync" }, () => {
            const state = channel?.presenceState() ?? {};
            setOtherOnline(Object.keys(state).some((id) => id !== userId));
          })
          .on("broadcast", { event: "typing" }, ({ payload }) => {
            if (payload?.user_id === userId) return;
            setOtherTyping(Boolean(payload?.typing));
            if (typingTimeout) clearTimeout(typingTimeout);
            if (payload?.typing) typingTimeout = setTimeout(() => setOtherTyping(false), 2500);
          })
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "conversation_id=eq." + params.id }, (payload) => {
          const incoming = payload.new as Message;
          setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming]);
          void markAsRead(supabase);
        })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED" && channel) {
              await channel.track({ user_id: userId, online_at: new Date().toISOString() });
            }
          });
      } catch (err) {
        console.error(err);
        if (active) setError("Não foi possível carregar esta conversa.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      if (typingTimeout) clearTimeout(typingTimeout);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channel) void channel.untrack();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [params.id]);

  function handleTyping(value: string) {
    setBody(value);
    if (!channelRef.current || !userId) return;
    void channelRef.current.send({ type: "broadcast", event: "typing", payload: { user_id: userId, typing: Boolean(value.trim()) } });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current && userId) void channelRef.current.send({ type: "broadcast", event: "typing", payload: { user_id: userId, typing: false } });
      }, 1800);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, otherTyping]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text || !userId || sending) return;
    setSending(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase.from("messages").insert({ conversation_id: params.id, sender_id: userId, body: text, status: "sent" }).select("id,sender_id,body,status,created_at").single();
      if (insertError) throw insertError;
      setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data as Message]);
      setBody("");
      if (channelRef.current && userId) void channelRef.current.send({ type: "broadcast", event: "typing", payload: { user_id: userId, typing: false } });
      await markAsRead(supabase, userId);
    } catch (err) {
      console.error(err);
      setError("Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="shell">
      <nav className="topbar">
        <Link href="/painel/mensagens" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link>
        <div className="navLinks"><Link href="/anunciantes">Anunciantes</Link><Link href="/painel">Painel</Link></div>
      </nav>
      <section className="hero">
        {loading && <div className="card"><p>Carregando conversa...</p></div>}
        {!loading && error && <div className="card"><h2>Conversa indisponível</h2><p>{error}</p><Link href="/painel/mensagens" className="primaryButton">Voltar às conversas</Link></div>}
        {!loading && !error && <>
          <div className="eyebrow">CONVERSA PECATHO</div>
          <h1>{profile?.title || profile?.display_name || "Conversa"}</h1>
          <p className="heroCopy">{profile?.display_name || "Anunciante"} {otherOnline ? "· online agora" : "· offline"}</p>
          {profile?.slug && <Link href={`/anunciantes/${profile.slug}`} className="secondaryButton">Voltar ao perfil</Link>}
          <section className="card" style={{ marginTop: 24 }}>
            <div style={{ display: "grid", gap: 12, maxHeight: 520, overflowY: "auto", paddingBottom: 16 }}>
              {messages.length === 0 && <p className="fieldNote">Esta conversa ainda não tem mensagens. Envie a primeira mensagem.</p>}
              {messages.map((message) => <div key={message.id} style={{ display: "flex", justifyContent: message.sender_id === userId ? "flex-end" : "flex-start" }}><div style={{ maxWidth: "78%", padding: "12px 14px", borderRadius: 14, background: message.sender_id === userId ? "var(--accent, #E7C33F)" : "rgba(255,255,255,.08)", color: message.sender_id === userId ? "#000" : "inherit" }}><p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.body}</p><small style={{ opacity: .7 }}>{new Date(message.created_at).toLocaleString("pt-BR")}</small></div></div>)}
            </div>
            <form onSubmit={sendMessage} style={{ display: "grid", gap: 10, marginTop: 16 }}>
              <label>Mensagem<textarea value={body} onChange={(event) => handleTyping(event.target.value)} rows={4} maxLength={4000} placeholder="Escreva sua mensagem..." />{otherTyping && <small style={{ display: "block", marginTop: 6, opacity: .72 }}>A outra pessoa está digitando...</small>}</label>
              {error && <p className="fieldNote">{error}</p>}
              <button type="submit" className="primaryButton" disabled={sending || !body.trim()}>{sending ? "Enviando..." : "Enviar mensagem"}</button>
            </form>
          </section>
        </>}
      </section>
    </main>
  );
}
