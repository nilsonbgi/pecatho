"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Message = { id: string; sender_id: string; body: string; status: string; created_at: string };
type Profile = { id: string; title: string | null; display_name: string | null; slug: string | null };
type FansConversation = { id: string; creator_id: string; buyer_user_id: string; source: string; source_id: string | null; status: string };
type LiveOffer = { id: string; creator_id: string; title: string; description: string | null; duration_minutes: number; price: number; currency: string; status: string };
type LiveSession = { id: string; offer_id: string; creator_id: string; buyer_user_id: string; conversation_id: string | null; order_id: string | null; title: string; duration_minutes: number; amount: number; currency: string; status: string; paid_at: string | null; scheduled_for: string | null; confirmed_at: string | null; rejection_reason: string | null; created_at: string };

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fansConversation, setFansConversation] = useState<FansConversation | null>(null);
  const [offers, setOffers] = useState<LiveOffer[]>([]);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [commercialLoading, setCommercialLoading] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);
  const [tipBusy, setTipBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [commercialError, setCommercialError] = useState("");
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<ReturnType<typeof createClient> extends never ? never : any>(null);
  const userIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function markAsRead(supabase = createClient(), authenticatedUserId = userId) {
    const { error: readError } = await supabase.rpc("mark_conversation_read", { p_conversation_id: params.id });
    if (readError) console.error("Não foi possível marcar a conversa como lida:", readError);
    if (authenticatedUserId) {
      const { error: notificationError } = await supabase.from("fans_notifications").update({ read_at: new Date().toISOString() }).eq("user_id", authenticatedUserId).eq("type", "message_received").is("read_at", null).filter("data->>conversation_id", "eq", params.id);
      if (notificationError) console.error("Não foi possível marcar a notificação como lida:", notificationError);
    }
  }

  async function loadCommercialContext(supabase: ReturnType<typeof createClient>, authenticatedUserId: string) {
    setCommercialLoading(true);
    const { data: fanConversation, error: fanConversationError } = await supabase
      .from("fans_conversations")
      .select("id,creator_id,buyer_user_id,source,source_id,status")
      .eq("conversation_id", params.id)
      .maybeSingle();

    if (fanConversationError) {
      console.error("Não foi possível carregar o contexto Fans:", fanConversationError);
      setCommercialLoading(false);
      return;
    }

    setFansConversation((fanConversation as FansConversation | null) || null);
    if (!fanConversation) {
      setOffers([]);
      setSessions([]);
      setCommercialLoading(false);
      return;
    }

    const fan = fanConversation as FansConversation;
    const [offerResult, sessionResult] = await Promise.all([
      supabase
        .from("fans_live_offers")
        .select("id,creator_id,title,description,duration_minutes,price,currency,status")
        .eq("creator_id", fan.creator_id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("fans_live_sessions")
        .select("id,offer_id,creator_id,buyer_user_id,conversation_id,order_id,title,duration_minutes,amount,currency,status,paid_at,scheduled_for,confirmed_at,rejection_reason,created_at")
        .eq("conversation_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

    if (offerResult.error) console.error("Não foi possível carregar as ofertas Fans:", offerResult.error);
    if (sessionResult.error) console.error("Não foi possível carregar as sessões Fans:", sessionResult.error);

    setOffers((offerResult.data ?? []) as LiveOffer[]);
    setSessions((sessionResult.data ?? []) as LiveSession[]);
    setCommercialLoading(false);

    void authenticatedUserId;
  }

  async function load() {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      window.location.href = `/login?redirect=/painel/mensagens/${params.id}`;
      return;
    }
    setUserId(authData.user.id);
    userIdRef.current = authData.user.id;

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
    await loadCommercialContext(supabase, authData.user.id);
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
        channel = supabase.channel("conversation:" + params.id, { config: { presence: { key: userIdRef.current || "anonymous" } } });
        channelRef.current = channel;
        channel
          .on("presence", { event: "sync" }, () => {
            const state = channel?.presenceState() ?? {};
            setOtherOnline(Object.keys(state).some((id) => id !== userIdRef.current));
          })
          .on("broadcast", { event: "typing" }, ({ payload }) => {
            if (payload?.user_id === userIdRef.current) return;
            setOtherTyping(Boolean(payload?.typing));
            if (typingTimeout) clearTimeout(typingTimeout);
            if (payload?.typing) typingTimeout = setTimeout(() => setOtherTyping(false), 2500);
          })
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "conversation_id=eq." + params.id }, (payload) => {
            const incoming = payload.new as Message;
            setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming]);
            void markAsRead(supabase);
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "fans_live_sessions", filter: "conversation_id=eq." + params.id }, () => {
            if (userIdRef.current) void loadCommercialContext(supabase, userIdRef.current);
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED" && channel) {
              await channel.track({ user_id: userIdRef.current, online_at: new Date().toISOString() });
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
        if (channelRef.current && userIdRef.current) void channelRef.current.send({ type: "broadcast", event: "typing", payload: { user_id: userId, typing: false } });
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

  async function startCheckout(offer: LiveOffer) {
    if (checkoutBusy || !userId || !fansConversation || userId !== fansConversation.buyer_user_id) return;
    setCheckoutBusy(offer.id);
    setCommercialError("");
    try {
      const response = await fetch("/api/fans/live/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: offer.id }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.session?.order_id) {
        setCommercialError(result?.error || "Não foi possível criar o pedido da videochamada.");
        return;
      }

      const providerResponse = await fetch("/api/fans/checkout/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: result.session.order_id }),
      });
      const providerResult = await providerResponse.json().catch(() => null);
      if (!providerResponse.ok || !providerResult?.checkout_url) {
        setCommercialError(providerResult?.error || "Não foi possível abrir o checkout do pagamento.");
        return;
      }
      window.location.href = providerResult.checkout_url;
    } catch (err) {
      console.error(err);
      setCommercialError("Não foi possível iniciar o pagamento.");
    } finally {
      setCheckoutBusy(null);
    }
  }

  async function continuePayment(session: LiveSession) {
    if (!userId || !fansConversation || userId !== fansConversation.buyer_user_id || !session.order_id || checkoutBusy) return;
    setCheckoutBusy(session.id);
    setCommercialError("");
    try {
      const providerResponse = await fetch("/api/fans/checkout/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: session.order_id }),
      });
      const providerResult = await providerResponse.json().catch(() => null);
      if (!providerResponse.ok || !providerResult?.checkout_url) {
        setCommercialError(providerResult?.error || "Não foi possível retomar o pagamento.");
        return;
      }
      window.location.href = providerResult.checkout_url;
    } catch (err) {
      console.error(err);
      setCommercialError("Não foi possível retomar o pagamento.");
    } finally {
      setCheckoutBusy(null);
    }
  }

  async function sendTip(amount: number) {
    if (!userId || !fansConversation || userId !== fansConversation.buyer_user_id) return;
    const activeSession = sessions.find((session) => session.status === "active");
    if (!activeSession || tipBusy) return;
    setTipBusy(amount);
    setCommercialError("");
    try {
      const response = await fetch("/api/fans/live/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeSession.id, amount, message: "Gorjeta enviada pela conversa Pecatho." }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result) {
        setCommercialError(result?.error || "Não foi possível iniciar a gorjeta.");
        return;
      }
      const orderId = result?.order_id || result?.order?.id;
      if (!orderId) {
        setCommercialError("O pedido da gorjeta não retornou um identificador de pagamento.");
        return;
      }
      const providerResponse = await fetch("/api/fans/checkout/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const providerResult = await providerResponse.json().catch(() => null);
      if (!providerResponse.ok || !providerResult?.checkout_url) {
        setCommercialError(providerResult?.error || "Não foi possível abrir o checkout da gorjeta.");
        return;
      }
      window.location.href = providerResult.checkout_url;
    } catch (err) {
      console.error(err);
      setCommercialError("Não foi possível iniciar a gorjeta.");
    } finally {
      setTipBusy(null);
    }
  }

  const money = (value: number, currency: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(Number(value || 0));
  const isBuyer = Boolean(fansConversation && userId === fansConversation.buyer_user_id);
  const isCreator = Boolean(fansConversation && userId === fansConversation.creator_id);
  const activeSession = sessions.find((session) => session.status === "active");
  const pendingOrPaidSession = [...sessions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).find((session) => ["pending_payment", "paid", "scheduled", "active"].includes(session.status));
  const latestSession = [...sessions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

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

          {fansConversation && (
            <section className="card" style={{ marginTop: 24 }}>
              <div className="eyebrow">PECATHO FANS · EXPERIÊNCIA PRIVADA</div>
              <h2 style={{ marginTop: 8 }}>Interações comerciais dentro da conversa</h2>
              <p className="fieldNote">O checkout continua no fluxo financeiro oficial do Fans. A conversa apenas apresenta o contexto e encaminha você para a operação correspondente.</p>

              {commercialLoading && <p className="fieldNote">Carregando ofertas e sessões...</p>}

              {!commercialLoading && offers.length > 0 && isBuyer && !pendingOrPaidSession && (
                <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  {offers.map((offer) => (
                    <div key={offer.id} style={{ border: "1px solid rgba(231,195,63,.35)", borderRadius: 16, padding: 16, background: "rgba(231,195,63,.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div>
                          <strong>{offer.title}</strong>
                          <p className="fieldNote">{offer.description || "Experiência privada em sala Pecatho."}</p>
                          <small>{offer.duration_minutes} minutos · {money(offer.price, offer.currency)}</small>
                        </div>
                        <button type="button" className="primaryButton" disabled={checkoutBusy === offer.id} onClick={() => void startCheckout(offer)}>
                          {checkoutBusy === offer.id ? "Abrindo..." : "Contratar"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!commercialLoading && pendingOrPaidSession && (
                <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                  <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, padding: 16 }}>
                    <strong>{pendingOrPaidSession.title}</strong>
                    <p className="fieldNote">
                      {pendingOrPaidSession.status === "pending_payment" && "Pagamento ainda não confirmado."}
                      {pendingOrPaidSession.status === "paid" && "Pagamento confirmado. Escolha o horário na área de videochamadas."}
                      {pendingOrPaidSession.status === "scheduled" && pendingOrPaidSession.confirmed_at && "Horário confirmado pelo criador."}
                      {pendingOrPaidSession.status === "scheduled" && !pendingOrPaidSession.confirmed_at && "Horário enviado ao criador e aguardando confirmação."}
                      {pendingOrPaidSession.status === "active" && "A chamada está em andamento."}\n                      {pendingOrPaidSession.rejection_reason && pendingOrPaidSession.status === "paid" && `Última solicitação recusada: ${pendingOrPaidSession.rejection_reason}` }
                    </p>
                  </div>
                  {isBuyer && pendingOrPaidSession.status === "pending_payment" && (
                    <button type="button" className="primaryButton" disabled={checkoutBusy === pendingOrPaidSession.id} onClick={() => void continuePayment(pendingOrPaidSession)}>
                      {checkoutBusy === pendingOrPaidSession.id ? "Abrindo pagamento..." : "Continuar pagamento"}
                    </button>
                  )}
                  {isBuyer && pendingOrPaidSession.status === "paid" && <Link href="/fans/videochamadas" className="primaryButton">Escolher horário</Link>}
                  {pendingOrPaidSession.status === "scheduled" && pendingOrPaidSession.confirmed_at && <Link href={`/fans/videochamadas/sala/${pendingOrPaidSession.id}`} className="primaryButton">Entrar na sala privada</Link>}
                  {pendingOrPaidSession.status === "active" && <Link href={`/fans/videochamadas/sala/${pendingOrPaidSession.id}`} className="primaryButton">Entrar na chamada</Link>}
                  {isCreator && pendingOrPaidSession.status === "scheduled" && <Link href="/fans/gerenciar/videochamadas/sessoes" className="secondaryButton">Gerenciar esta solicitação</Link>}
                </div>
              )}

              {latestSession && ["completed", "refunded", "cancelled", "expired"].includes(latestSession.status) && (
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 16 }}>
                  <div className="eyebrow">CICLO ENCERRADO</div>
                  <p className="fieldNote">
                    {latestSession.status === "completed" && "A videochamada foi concluída. Esta contratação permanece registrada no histórico."}
                    {latestSession.status === "refunded" && "Esta contratação foi reembolsada. Nenhum novo acesso à sala está disponível."}
                    {latestSession.status === "cancelled" && "Esta contratação foi cancelada."}
                    {latestSession.status === "expired" && "O período desta contratação expirou."}
                  </p>
                  <Link href={isCreator ? "/fans/gerenciar/videochamadas/sessoes" : "/fans/videochamadas"} className="secondaryButton">
                    {isCreator ? "Ver minhas sessões" : "Ver minhas videochamadas"}
                  </Link>
                </div>
              )}

              {activeSession && isBuyer && (
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 16 }}>
                  <div className="eyebrow">DURANTE A CHAMADA</div>
                  <p className="fieldNote">Envie uma gorjeta usando o checkout seguro. O valor só será considerado pago após a confirmação oficial.</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    {[10, 25, 50, 100].map((amount) => (
                      <button key={amount} type="button" className="secondaryButton" disabled={tipBusy === amount} onClick={() => void sendTip(amount)}>
                        {tipBusy === amount ? "Abrindo..." : `Gorjeta ${money(amount, "BRL")}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {commercialError && <p className="fieldNote" style={{ marginTop: 12, color: "#f87171" }}>{commercialError}</p>}
            </section>
          )}

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