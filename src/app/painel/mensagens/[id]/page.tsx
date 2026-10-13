"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import GiftButton from "@/components/GiftButton";
import MessageReactions from "@/components/MessageReactions";

type Message = { id: string; sender_id: string; body: string; status: string; created_at: string };
type Profile = { id: string; title: string | null; display_name: string | null; slug: string | null };
type FansCreatorProfile = { id: string; display_name: string; slug: string | null };
type FansConversation = { id: string; creator_id: string; buyer_user_id: string; source: string; source_id: string | null; status: string };
type LiveOffer = { id: string; creator_id: string; title: string; description: string | null; duration_minutes: number; price: number; currency: string; status: string };
type LiveSession = { id: string; offer_id: string; creator_id: string; buyer_user_id: string; conversation_id: string | null; order_id: string | null; title: string; duration_minutes: number; amount: number; currency: string; status: string; paid_at: string | null; scheduled_for: string | null; confirmed_at: string | null; rejection_reason: string | null; created_at: string };
type LiveTip = { id: string; session_id: string | null; amount: number; creator_amount: number; currency: string; message: string | null; status: string; paid_at: string | null; created_at: string };
type CustomerReputation = { average_rating: number | null; review_count: number; trust_badge: boolean };

const MESSAGE_STICKERS = [
  { label: "Carinho", value: "🥰💛", description: "Um carinho para você" },
  { label: "Beijinhos", value: "😘💋", description: "Beijos" },
  { label: "Coração", value: "❤️💖💕", description: "Muito amor" },
  { label: "Fogo", value: "🔥😍🔥", description: "Você arrasa" },
  { label: "Gratidão", value: "🙏✨💛", description: "Muito obrigado(a)" },
  { label: "Abraço", value: "🫂🤗", description: "Um abraço apertado" },
  { label: "Risadas", value: "😂🤣😆", description: "Rindo muito" },
  { label: "Festa", value: "🥳🎉✨", description: "Vamos comemorar" },
  { label: "Surpresa", value: "😮✨🎁", description: "Uma surpresa" },
  { label: "Saudades", value: "🥹💌❤️", description: "Estou com saudades" },
  { label: "Aplausos", value: "👏👏✨", description: "Parabéns!" },
  { label: "Boa noite", value: "🌙✨😴", description: "Uma ótima noite" },
];

function MessageBody({ body, ownMessage }: { body: string; ownMessage: boolean }) {
  const sticker = MESSAGE_STICKERS.find((item) => item.value === body);
  if (sticker) {
    return (
      <div role="img" aria-label={"Figurinha: " + sticker.description} title={sticker.description} style={{ display: "grid", justifyItems: "center", gap: 6, minWidth: 112, padding: "8px 4px" }}>
        <span style={{ fontSize: 38, lineHeight: 1.3 }}>{sticker.value}</span>
        <span style={{ fontSize: 11, fontWeight: 750, opacity: 0.8 }}>{sticker.label}</span>
      </div>
    );
  }

  const parts = body.split(/(\\*\\*[^*]+\\*\\*|~~[^~]+~~|_[^_]+_|\\x60[^\\x60]+\\x60)/g);
  return (
    <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 14, overflowWrap: "anywhere" }}>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) return <s key={index}>{part.slice(2, -2)}</s>;
        if (part.startsWith("_") && part.endsWith("_") && part.length > 2) return <em key={index}>{part.slice(1, -1)}</em>;
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={index} style={{ padding: "2px 5px", borderRadius: 5, background: ownMessage ? "rgba(0,0,0,.09)" : "rgba(255,255,255,.1)", fontSize: "0.92em" }}>{part.slice(1, -1)}</code>;
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
}

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fansCreator, setFansCreator] = useState<FansCreatorProfile | null>(null);
  const [fansConversation, setFansConversation] = useState<FansConversation | null>(null);
  const [offers, setOffers] = useState<LiveOffer[]>([]);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [tips, setTips] = useState<LiveTip[]>([]);
  const [customerReputation, setCustomerReputation] = useState<CustomerReputation | null>(null);
  const sessionIdsRef = useRef<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [stickersOpen, setStickersOpen] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
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

    const sessionRows = (sessionResult.data ?? []) as LiveSession[];
    const sessionIds = sessionRows.map((session) => session.id);
    const tipQuery = sessionIds.length
      ? await supabase.from("fans_tips").select("id,session_id,amount,creator_amount,currency,message,status,paid_at,created_at").in("session_id", sessionIds).order("created_at", { ascending: false })
      : { data: [], error: null };
    if (tipQuery.error) console.error("Não foi possível carregar as gorjetas Fans:", tipQuery.error);

    setOffers((offerResult.data ?? []) as LiveOffer[]);
    setSessions(sessionRows);
    sessionIdsRef.current = new Set(sessionRows.map((session) => session.id));
    setTips((tipQuery.data ?? []) as LiveTip[]);
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
    const contextualMessage = searchParams.get("context")?.trim() || "";
    if (contextualMessage) setBody(contextualMessage);

    const { data: conversation, error: conversationError } = await supabase.from("conversations").select("id,profile_id").eq("id", params.id).maybeSingle();
    if (conversationError || !conversation) throw conversationError || new Error("Conversa não encontrada.");

    const [profileResult, messageResult, fansConversationResult] = await Promise.all([
      conversation.profile_id
        ? supabase.from("advertiser_profiles").select("id,title,display_name,slug").eq("id", conversation.profile_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("messages").select("id,sender_id,body,status,created_at").eq("conversation_id", params.id).order("created_at", { ascending: true }),
      supabase.from("fans_conversations").select("id,creator_id,buyer_user_id,source,source_id,status").eq("conversation_id", params.id).maybeSingle(),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (messageResult.error) throw messageResult.error;
    if (fansConversationResult.error) throw fansConversationResult.error;
    const fansRow = (fansConversationResult.data as FansConversation | null) || null;
    const creatorResult = fansRow
      ? await supabase.from("fans_creators").select("id,display_name,slug").eq("id", fansRow.creator_id).maybeSingle()
      : { data: null, error: null };
    if (creatorResult.error) throw creatorResult.error;
    setProfile((profileResult.data as Profile | null) || null);
    setFansConversation(fansRow);
    setFansCreator((creatorResult.data as FansCreatorProfile | null) || null);
    setMessages((messageResult.data ?? []) as Message[]);
    const reputationResponse = await fetch("/api/clientes/reputacao/context?conversation_id=" + encodeURIComponent(params.id), { cache: "no-store" });
    if (reputationResponse.ok) {
      const reputationBody = await reputationResponse.json();
      setCustomerReputation(reputationBody.reputation ?? null);
    } else {
      setCustomerReputation(null);
    }
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
          .on("postgres_changes", { event: "*", schema: "public", table: "fans_tips" }, (payload) => {
            const incoming = payload.new as LiveTip;
            if (!incoming?.session_id || !sessionIdsRef.current.has(incoming.session_id)) return;
            setTips((current) => {
              const next = current.filter((tip) => tip.id !== incoming.id);
              return payload.eventType === "DELETE"
                ? next
                : [incoming, ...next].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            });
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

  function applyFormatting(marker: "**" | "_" | "~~" | "`") {
    const input = messageInputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = body.slice(start, end);
    const replacement = selected ? marker + selected + marker : marker + marker;
    const nextBody = body.slice(0, start) + replacement + body.slice(end);
    setBody(nextBody);
    handleTyping(nextBody);
    requestAnimationFrame(() => {
      input.focus();
      const cursorStart = selected ? start : start + marker.length;
      const cursorEnd = selected ? start + replacement.length : cursorStart;
      input.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  function insertSticker(value: string) {
    const input = messageInputRef.current;
    const start = input?.selectionStart ?? body.length;
    const end = input?.selectionEnd ?? body.length;
    const separatorBefore = start > 0 && !/\\s$/.test(body.slice(0, start)) ? " " : "";
    const separatorAfter = end < body.length && !/^\\s/.test(body.slice(end)) ? " " : "";
    const insertion = separatorBefore + value + separatorAfter;
    const nextBody = body.slice(0, start) + insertion + body.slice(end);
    handleTyping(nextBody);
    setStickersOpen(false);
    requestAnimationFrame(() => {
      input?.focus();
      const cursor = start + insertion.length;
      input?.setSelectionRange(cursor, cursor);
    });
  }

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
  const latestPaidTip = tips.find((tip) => tip.status === "paid");

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
          <div className="eyebrow">{fansCreator ? "CONVERSA PECATHO FANS" : "CONVERSA PECATHO"}</div>
          <h1>{fansCreator?.display_name || profile?.title || profile?.display_name || "Conversa"}</h1>
          <p className="heroCopy">{fansCreator ? "Criador Fans" : profile?.display_name || "Conversa privada"} <span aria-label={otherOnline ? "online agora" : "offline"}>{otherOnline ? "· online agora" : "· offline"}</span></p>
          {(fansCreator?.slug || profile?.slug) && <Link href={fansCreator?.slug ? `/fans/${fansCreator.slug}` : `/anunciantes/${profile?.slug}`} className="secondaryButton">Voltar ao perfil</Link>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {profile && <GiftButton recipientType="advertiser" recipientId={profile.id} recipientName={profile.display_name || profile.title || "este anunciante"} compact />}
            {fansConversation && <GiftButton recipientType="creator" recipientId={fansConversation.creator_id} recipientName={profile?.display_name || "este vendedor de conteúdo"} compact />}
          </div>

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
                      {pendingOrPaidSession.status === "active" && "A chamada está em andamento."}
                      {pendingOrPaidSession.rejection_reason && pendingOrPaidSession.status === "paid" && `Última solicitação recusada: ${pendingOrPaidSession.rejection_reason}` }
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

              {tips.length > 0 && (
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 16 }}>
                  <div className="eyebrow">{isCreator ? "GORJETAS RECEBIDAS" : "GORJETAS DA SESSÃO"}</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    {tips.slice(0, 5).map((tip) => (
                      <div key={tip.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,.035)" }}>
                        <div><strong>{money(Number(tip.amount), tip.currency)}</strong>{tip.message && <span className="fieldNote" style={{ display: "block", marginTop: 2 }}>{tip.message}</span>}</div>
                        <span className="fieldNote">{tip.status === "paid" ? "Pagamento confirmado" : tip.status === "refunded" ? "Reembolsada" : "Pagamento pendente"}</span>
                      </div>
                    ))}
                  </div>
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

          {customerReputation && (
            <section className="card" style={{ marginTop: 24, borderColor: "rgba(231,195,63,.24)" }}>
              <div className="eyebrow">CONFIANÇA DO CLIENTE</div>
              <h2 style={{ marginTop: 8 }}>Reputação verificada</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                <strong style={{ fontSize: 24, color: "#E7C33F" }}>
                  {customerReputation.average_rating !== null ? "★ " + customerReputation.average_rating.toFixed(1) + " / 5" : "Sem avaliações"}
                </strong>
                <span className="fieldNote">
                  {customerReputation.review_count
                    ? customerReputation.review_count + (customerReputation.review_count === 1 ? " avaliação verificada" : " avaliações verificadas")
                    : "Ainda não há avaliações verificadas para este cliente."}
                </span>
                {customerReputation.trust_badge && <span style={{ border: "1px solid rgba(16,185,129,.28)", background: "rgba(16,185,129,.08)", color: "#6ee7b7", borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 800 }}>✓ Histórico verificado</span>}
              </div>
              <p className="fieldNote" style={{ marginTop: 10 }}>A reputação é calculada somente a partir de interações verificadas. Nenhum dado pessoal do cliente é exibido nesta área.</p>
            </section>
          )}

          <section className="card" style={{ marginTop: 24 }}>
            <div style={{ display: "grid", gap: 12, maxHeight: 520, overflowY: "auto", paddingBottom: 16 }}>
              {messages.length === 0 && <p className="fieldNote">Esta conversa ainda não tem mensagens. Envie a primeira mensagem.</p>}
              {messages.map((message) => { const ownMessage = message.sender_id === userId; return <div key={message.id} style={{ display: "flex", justifyContent: ownMessage ? "flex-end" : "flex-start", minWidth: 0 }}><div style={{ width: "fit-content", maxWidth: "min(86%, 620px)", minWidth: 0, overflowWrap: "anywhere", padding: "12px 14px", borderRadius: ownMessage ? "16px 16px 4px 16px" : "16px 16px 16px 4px", border: ownMessage ? "1px solid rgba(231,195,63,.75)" : "1px solid rgba(255,255,255,.13)", background: ownMessage ? "#E7C33F" : "#20232D", color: ownMessage ? "#17130A" : "#F4F6FB", boxShadow: "0 5px 18px rgba(0,0,0,.12)" }}><MessageBody body={message.body} ownMessage={ownMessage} /><small style={{ display: "block", marginTop: 7, color: ownMessage ? "#49401F" : "#B9C0CF", fontSize: 11 }}>{new Date(message.created_at).toLocaleString("pt-BR")}</small>{userId && <MessageReactions messageId={message.id} userId={userId} />}</div></div>; })}
            </div>
            <form onSubmit={sendMessage} style={{ display: "grid", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.09)" }}>
              <label style={{ display: "grid", gap: 8, color: "#E5E7EF", fontSize: 13, fontWeight: 650 }}>Sua mensagem<textarea ref={messageInputRef} value={body} onChange={(event) => handleTyping(event.target.value)} rows={4} maxLength={4000} placeholder="Escreva sua mensagem... Use os botões para formatar o texto." aria-label="Texto da mensagem" style={{ width: "100%", minWidth: 0, resize: "vertical", border: "1px solid rgba(255,255,255,.16)", borderRadius: 12, background: "#11131A", color: "#F4F6FB", padding: "13px 14px", lineHeight: 1.6, font: "inherit", outlineOffset: 2 }} />{otherTyping && <small style={{ display: "block", marginTop: 2, color: "#B9C0CF", fontWeight: 400 }}>A outra pessoa está digitando...</small>}<small style={{ color: "#B9C0CF", fontWeight: 400 }}>{body.length}/4000 caracteres · A formatação é aplicada ao enviar.</small></label>
              <div aria-label="Formatação de texto" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7 }}>
                <span style={{ color: "#B9C0CF", fontSize: 12, marginRight: 4 }}>Formatar:</span>
                <button type="button" onClick={() => applyFormatting("**")} aria-label="Aplicar negrito" title="Negrito" style={{ minWidth: 40, minHeight: 38, border: "1px solid rgba(255,255,255,.16)", borderRadius: 9, background: "#20232D", color: "#F4F6FB", cursor: "pointer", fontWeight: 900 }}>B</button>
                <button type="button" onClick={() => applyFormatting("_")} aria-label="Aplicar itálico" title="Itálico" style={{ minWidth: 40, minHeight: 38, border: "1px solid rgba(255,255,255,.16)", borderRadius: 9, background: "#20232D", color: "#F4F6FB", cursor: "pointer", fontStyle: "italic" }}>I</button>
                <button type="button" onClick={() => applyFormatting("~~")} aria-label="Aplicar tachado" title="Tachado" style={{ minWidth: 40, minHeight: 38, border: "1px solid rgba(255,255,255,.16)", borderRadius: 9, background: "#20232D", color: "#F4F6FB", cursor: "pointer", textDecoration: "line-through" }}>S</button>
                <button type="button" onClick={() => applyFormatting("`")} aria-label="Aplicar código" title="Texto monoespaçado" style={{ minWidth: 40, minHeight: 38, border: "1px solid rgba(255,255,255,.16)", borderRadius: 9, background: "#20232D", color: "#F4F6FB", cursor: "pointer", fontFamily: "monospace" }}>{"<>"}</button>
                <button type="button" onClick={() => setStickersOpen((current) => !current)} aria-expanded={stickersOpen} aria-controls="pecatho-sticker-picker" style={{ minHeight: 38, border: "1px solid rgba(231,195,63,.42)", borderRadius: 9, background: stickersOpen ? "rgba(231,195,63,.16)" : "#20232D", color: "#F4F6FB", cursor: "pointer", padding: "7px 11px", fontWeight: 750 }}>🎨 Figurinhas</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} aria-label="Emojis rápidos">
                {["❤️","😍","🔥","😘","😉","😂","🥰","👍","🙏","✨","💋","🎁","🥹","🫶","💯","🤗"].map((emoji) => <button key={emoji} type="button" onClick={() => insertSticker(emoji)} style={{ minWidth: 38, minHeight: 38, border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, background: "rgba(255,255,255,.04)", padding: "6px 8px", cursor: "pointer", fontSize: 18 }} aria-label={"Inserir emoji " + emoji} title={"Inserir " + emoji}>{emoji}</button>)}
              </div>
              {stickersOpen && <section id="pecatho-sticker-picker" aria-label="Galeria de figurinhas" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 8, padding: 12, border: "1px solid rgba(231,195,63,.25)", borderRadius: 14, background: "rgba(255,255,255,.025)" }}>
                {MESSAGE_STICKERS.map((sticker) => <button key={sticker.label} type="button" onClick={() => insertSticker(sticker.value)} title={sticker.description} style={{ display: "grid", justifyItems: "center", gap: 6, minHeight: 94, padding: 10, border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, background: "#171923", color: "#F4F6FB", cursor: "pointer" }}><span aria-hidden="true" style={{ fontSize: 26 }}>{sticker.value}</span><span style={{ fontSize: 12, fontWeight: 750 }}>{sticker.label}</span><span style={{ color: "#B9C0CF", fontSize: 10 }}>{sticker.description}</span></button>)}
              </section>}
              {error && <p className="fieldNote">{error}</p>}
              <button type="submit" className="primaryButton" disabled={sending || !body.trim()}>{sending ? "Enviando..." : "Enviar mensagem"}</button>
            </form>
          </section>
        </>}
      </section>
    </main>
  );
}