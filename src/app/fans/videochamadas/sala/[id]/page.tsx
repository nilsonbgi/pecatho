"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Access = {
  session_id: string;
  room_id: string;
  role: "creator" | "buyer";
  title: string;
  duration_minutes: number;
  scheduled_for: string;
  started_at: string;
  ends_at: string;
  status: "active";
  buyer_joined_at: string | null;
  creator_joined_at: string | null;
  other_joined: boolean;
};

type Signal = {
  id: string;
  session_id: string;
  sender_user_id: string;
  signal_type: "join" | "offer" | "answer" | "ice" | "leave";
  payload: Record<string, unknown>;
};

export default function FansLiveRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [access, setAccess] = useState<Access | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("Preparando sala...");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [participantJoined, setParticipantJoined] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [ending, setEnding] = useState(false);
  const [extending, setExtending] = useState(false);
  const [kicking, setKicking] = useState(false);
  const [tipAmount, setTipAmount] = useState(10);
  const [tipMessage, setTipMessage] = useState("");
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState("");
  const [paidTips, setPaidTips] = useState<Array<{ id: string; amount: number; message: string | null; created_at: string }>>([]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const userIdRef = useRef("");
  const accessRef = useRef<Access | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const endedRef = useRef(false);

  const touchSession = useCallback(async () => {
    if (!sessionId) return;
    const { data, error: touchError } = await supabase.rpc("touch_fans_live_session", {
      p_session_id: sessionId,
    });
    if (touchError) {
      if (touchError.message.includes("LIVE_SESSION_EXPIRED")) {
        setConnection("Chamada encerrada por término da janela operacional.");
        return;
      }
      return;
    }
    if (data && typeof data === "object") {
      const presence = data as { other_joined?: boolean; buyer_joined_at?: string | null; creator_joined_at?: string | null };
      setParticipantJoined(Boolean(presence.other_joined));
      setAccess((current) => current ? {
        ...current,
        buyer_joined_at: presence.buyer_joined_at ?? current.buyer_joined_at,
        creator_joined_at: presence.creator_joined_at ?? current.creator_joined_at,
        other_joined: Boolean(presence.other_joined),
      } : current);
      accessRef.current = accessRef.current ? {
        ...accessRef.current,
        buyer_joined_at: presence.buyer_joined_at ?? accessRef.current.buyer_joined_at,
        creator_joined_at: presence.creator_joined_at ?? accessRef.current.creator_joined_at,
        other_joined: Boolean(presence.other_joined),
      } : accessRef.current;
    }
  }, [sessionId, supabase]);

  const loadPaidTips = useCallback(async () => {
    const { data } = await supabase
      .from("fans_tips")
      .select("id,amount,message,created_at")
      .eq("session_id", sessionId)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(20);
    setPaidTips((data ?? []).map((tip) => ({
      id: tip.id,
      amount: Number(tip.amount),
      message: tip.message,
      created_at: tip.created_at,
    })));
  }, [sessionId, supabase]);

  const openTipCheckout = useCallback(async () => {
    if (accessRef.current?.role !== "buyer" || !sessionId || tipLoading) return;
    setTipLoading(true);
    setTipError("");
    try {
      const intentResponse = await fetch("/api/fans/live/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, amount: tipAmount, message: tipMessage }),
      });
      const intent = await intentResponse.json().catch(() => null);
      if (!intentResponse.ok) throw new Error(intent?.error ?? "Não foi possível criar a gorjeta.");

      const providerResponse = await fetch("/api/fans/checkout/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: intent.order_id }),
      });
      const provider = await providerResponse.json().catch(() => null);
      if (!providerResponse.ok || typeof provider?.checkout_url !== "string") {
        throw new Error(provider?.error ?? "Não foi possível abrir o pagamento.");
      }
      window.open(provider.checkout_url, "_blank", "noopener,noreferrer");
      setTipMessage("");
    } catch (tipCheckoutError) {
      setTipError(tipCheckoutError instanceof Error ? tipCheckoutError.message : "Não foi possível iniciar o pagamento.");
    } finally {
      setTipLoading(false);
    }
  }, [sessionId, supabase, tipAmount, tipLoading, tipMessage]);

  const sendSignal = useCallback(async (
    signalType: Signal["signal_type"],
    payload: Record<string, unknown> = {}
  ) => {
    const senderUserId = userIdRef.current;
    if (!sessionId || !senderUserId) return;
    const { error: signalError } = await supabase.from("fans_live_signals").insert({
      session_id: sessionId,
      sender_user_id: senderUserId,
      signal_type: signalType,
      payload,
    });
    if (signalError) setError(signalError.message);
  }, [sessionId, supabase]);

  const flushCandidates = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription) return;
    const pending = pendingCandidatesRef.current.splice(0);
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        setError("Não foi possível sincronizar a conexão de vídeo.");
      }
    }
  }, []);

  const createPeer = useCallback(async (role: Access["role"]) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        void sendSignal("ice", { candidate: event.candidate.toJSON() });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        setRemoteConnected(true);
        setConnection("Conectado");
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setRemoteConnected(true);
        setConnection("Conectado");
      } else if (pc.connectionState === "connecting") {
        setConnection("Conectando...");
      } else if (pc.connectionState === "disconnected") {
        setRemoteConnected(false);
        setConnection("Conexão interrompida. Tentando reconectar...");
        if (role === "creator") {
          window.setTimeout(() => {
            if (pcRef.current === pc && (pc.connectionState === "disconnected" || pc.connectionState === "failed")) {
              void createOffer(true);
            }
          }, 1200);
        }
      } else if (pc.connectionState === "failed") {
        setRemoteConnected(false);
        setConnection("Falha na conexão. Tentando reconectar...");
        if (role === "creator") {
          window.setTimeout(() => {
            if (pcRef.current === pc && pc.connectionState === "failed") {
              void createOffer(true);
            }
          }, 1200);
        }
      }
    };

    if (role === "creator") {
      setConnection("Aguardando o comprador...");
    } else {
      setConnection("Aguardando o criador...");
    }

    return pc;
  }, [createOffer, sendSignal]);

  const createOffer = useCallback(async (restartIce = false) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      if (restartIce) pc.restartIce();
      const offer = await pc.createOffer(restartIce ? { iceRestart: true } : undefined);
      await pc.setLocalDescription(offer);
      await sendSignal("offer", { sdp: offer.sdp, type: offer.type });
      setConnection(restartIce ? "Reconectando..." : "Chamando...");
    } catch {
      setError("Não foi possível iniciar a conexão de vídeo.");
    }
  }, [sendSignal]);

  const handleSignal = useCallback(async (signal: Signal) => {
    const currentUserId = userIdRef.current;
    const currentAccess = accessRef.current;
    if (!currentUserId || signal.sender_user_id === currentUserId) return;
    const pc = pcRef.current;
    if (!pc) return;

    if (signal.signal_type === "join" && currentAccess?.role === "creator") {
      await createOffer();
      return;
    }

    if (signal.signal_type === "offer" && currentAccess?.role === "buyer") {
      const description = {
        type: "offer" as RTCSdpType,
        sdp: String(signal.payload.sdp ?? ""),
      };
      try {
        await pc.setRemoteDescription(description);
        await flushCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal("answer", { sdp: answer.sdp, type: answer.type });
        setConnection("Conectando...");
      } catch {
        setError("Não foi possível aceitar a chamada de vídeo.");
      }
      return;
    }

    if (signal.signal_type === "answer" && currentAccess?.role === "creator") {
      try {
        await pc.setRemoteDescription({
          type: "answer" as RTCSdpType,
          sdp: String(signal.payload.sdp ?? ""),
        });
        await flushCandidates(pc);
        setConnection("Conectando...");
      } catch {
        setError("Não foi possível concluir a conexão de vídeo.");
      }
      return;
    }

    if (signal.signal_type === "ice") {
      const candidate = signal.payload.candidate as RTCIceCandidateInit | undefined;
      if (!candidate) return;
      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(candidate);
        } catch {
          setError("Não foi possível adicionar o candidato de conexão.");
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
      return;
    }

    if (signal.signal_type === "leave") {
      setRemoteConnected(false);
      setConnection("A outra pessoa saiu da sala.");
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }
  }, [createOffer, flushCandidates, sendSignal]);

  const extendSession = useCallback(async (minutes: number) => {
    if (accessRef.current?.role !== "creator" || extending) return;
    setExtending(true);
    setError("");
    const { data, error: extensionError } = await supabase.rpc("extend_fans_live_session", { p_session_id: sessionId, p_minutes: minutes });
    if (extensionError) { setError(extensionError.message); setExtending(false); return; }
    if (data && typeof data === "object") {
      const result = data as { duration_minutes?: number; ends_at?: string };
      setAccess((current) => current ? { ...current, duration_minutes: Number(result.duration_minutes ?? current.duration_minutes), ends_at: result.ends_at ?? current.ends_at } : current);
      accessRef.current = accessRef.current ? { ...accessRef.current, duration_minutes: Number(result.duration_minutes ?? accessRef.current.duration_minutes), ends_at: result.ends_at ?? accessRef.current.ends_at } : accessRef.current;
      setConnection(`Chamada estendida em ${minutes} minutos.`);
    }
    setExtending(false);
  }, [extending, sessionId, supabase]);

  const kickParticipant = useCallback(async () => {
    if (accessRef.current?.role !== "creator" || kicking) return;
    if (!window.confirm("Encerrar a chamada e remover o participante desta sala?")) return;
    setKicking(true);
    setError("");
    await sendSignal("leave");
    const { error: kickError } = await supabase.rpc("kick_fans_live_participant", { p_session_id: sessionId });
    if (kickError) { setError(kickError.message); setKicking(false); return; }
    setConnection("Participante removido. Chamada encerrada.");
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    pcRef.current?.close();
    router.push("/fans/gerenciar/videochamadas/sessoes");
  }, [kicking, router, sendSignal, sessionId, supabase]);

  const endSession = useCallback(async (redirect = true) => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnding(true);
    await sendSignal("leave");
    const { error: endError } = await supabase.rpc("end_fans_live_session", {
      p_session_id: sessionId,
    });
    if (endError && !endError.message.includes("LIVE_SESSION_NOT_ACTIVE")) {
      setError(endError.message);
      endedRef.current = false;
      setEnding(false);
      return;
    }
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    pcRef.current?.close();
    if (redirect) router.push(accessRef.current?.role === "creator" ? "/fans/gerenciar/videochamadas/sessoes" : "/fans/videochamadas");
  }, [router, sendSignal, sessionId, supabase]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError("");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/fans/videochamadas");
        return;
      }
      if (cancelled) return;
      userIdRef.current = user.id;

      const { data, error: accessError } = await supabase.rpc("get_fans_live_room_access", {
        p_session_id: sessionId,
      });
      if (accessError) {
        setError(
          accessError.message.includes("LIVE_ROOM_NOT_OPEN")
            ? "A sala ainda não está aberta. Ela é liberada 15 minutos antes do horário confirmado."
            : accessError.message.includes("LIVE_SCHEDULE_NOT_CONFIRMED")
              ? "O horário ainda não foi confirmado pelo criador."
              : accessError.message.includes("LIVE_SESSION_EXPIRED")
                ? "O período desta videochamada já terminou."
                : accessError.message
        );
        setLoading(false);
        return;
      }

      const roomAccess = data as Access;
      if (cancelled) return;
      accessRef.current = roomAccess;
      setAccess(roomAccess);
      setParticipantJoined(Boolean(roomAccess.other_joined));

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setCameraEnabled(stream.getVideoTracks().some((track) => track.enabled));
        setMicEnabled(stream.getAudioTracks().some((track) => track.enabled));
      } catch {
        setError("A sala foi aberta, mas o navegador não liberou câmera e microfone. Verifique as permissões do site.");
      }

      const pc = await createPeer(roomAccess.role);
      const channel = supabase
        .channel(`fans-live-${roomAccess.room_id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "fans_live_signals",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            void handleSignal(payload.new as Signal);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "fans_tips",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const tip = payload.new as { id?: string; amount?: number | string; message?: string | null; status?: string; created_at?: string };
            if (tip.status === "paid" && tip.id) {
              setPaidTips((current) => [{ id: tip.id as string, amount: Number(tip.amount ?? 0), message: tip.message ?? null, created_at: tip.created_at ?? new Date().toISOString() }, ...current.filter((item) => item.id !== tip.id)].slice(0, 20));
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "fans_live_sessions",
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            const session = payload.new as { status?: string; duration_minutes?: number; scheduled_for?: string; ended_reason?: string | null };
            if (session.duration_minutes && session.scheduled_for) {
              const nextEndsAt = new Date(new Date(session.scheduled_for).getTime() + Number(session.duration_minutes) * 60000).toISOString();
              setAccess((current) => current ? { ...current, duration_minutes: Number(session.duration_minutes), ends_at: nextEndsAt } : current);
              accessRef.current = accessRef.current ? { ...accessRef.current, duration_minutes: Number(session.duration_minutes), ends_at: nextEndsAt } : accessRef.current;
            }
            if (session.status === "completed") {
              setConnection(session.ended_reason === "creator_removed_participant" ? "A chamada foi encerrada pelo criador." : "Chamada encerrada.");
              window.setTimeout(() => router.push(accessRef.current?.role === "creator" ? "/fans/gerenciar/videochamadas/sessoes" : "/fans/videochamadas"), 900);
            }
          }
        );

      channelRef.current = channel;
      const subscriptionStatus = await new Promise<string>((resolve) => {
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            resolve(status);
          }
        });
      });

      if (subscriptionStatus !== "SUBSCRIBED") {
        setError("A conexão em tempo real da sala não pôde ser estabelecida.");
        pc.close();
        setLoading(false);
        return;
      }

      for (const track of localStreamRef.current?.getTracks() ?? []) {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      }

      await touchSession();
      await loadPaidTips();
      await sendSignal("join");
      setLoading(false);
    }

    void boot();

    return () => {
      cancelled = true;
      if (channelRef.current) void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [createPeer, handleSignal, loadPaidTips, router, sendSignal, sessionId, supabase, touchSession]);

  useEffect(() => {
    if (!access) return;
    const heartbeat = window.setInterval(() => {
      void touchSession();
    }, 15000);
    return () => window.clearInterval(heartbeat);
  }, [access, touchSession]);

  useEffect(() => {
    if (!access) return;
    const timer = window.setInterval(() => {
      const end = new Date(access.ends_at).getTime();
      const seconds = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) void endSession();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [access, endSession]);

  function toggleTrack(kind: "video" | "audio") {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = kind === "video" ? stream.getVideoTracks() : stream.getAudioTracks();
    const enabled = !tracks.every((track) => track.enabled);
    tracks.forEach((track) => { track.enabled = enabled; });
    if (kind === "video") setCameraEnabled(enabled);
    else setMicEnabled(enabled);
  }

  const timer = remaining === null
    ? "--:--"
    : `${Math.floor(remaining / 60).toString().padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;

  return (
    <main className="min-h-screen bg-[#07090d] px-3 py-3 text-white sm:px-5 sm:py-5">
      <div className="mx-auto max-w-[1440px]">
        <nav className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
          <Link href="/fans/videochamadas" className="font-semibold">Pecatho <span className="text-slate-400">Fans</span></Link>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold">{timer}</span>
        </nav>

        {loading ? (
          <div className="flex min-h-[70vh] items-center justify-center text-slate-300">Abrindo sala privada...</div>
        ) : error && !access ? (
          <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-red-400/20 bg-red-400/10 p-6">
            <h1 className="text-xl font-bold">Sala indisponível</h1>
            <p className="mt-2 text-sm leading-6 text-red-100">{error}</p>
            <Link href="/fans/videochamadas" className="mt-5 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">Voltar</Link>
          </div>
        ) : access ? (
          <>
            <header className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sala privada · {access.role === "creator" ? "Criador" : "Cliente"}</p>
                <h1 className="mt-2 text-2xl font-bold">{access.title}</h1>
                <p className="mt-1 text-sm text-slate-400">{connection}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                  <span className={access.other_joined ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200" : "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-400"}>
                    {access.other_joined ? "Participante presente" : "Aguardando participante"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-400">
                    Janela: 15 min antes do horário
                  </span>
                </div>
              </div>
              <span className="text-sm text-slate-400">{access.duration_minutes} minutos contratados</span>
            </header>

            {error && <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">{error}</p>}

            <section className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs">Você</span>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                {!remoteConnected && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center text-sm text-slate-400">
                  <span>{participantJoined ? "Participante presente. Conectando vídeo..." : "Aguardando a outra pessoa entrar..."}</span>
                  {!participantJoined && <span className="text-xs text-slate-600">A sala permanece aberta até o encerramento da janela autorizada.</span>}
                </div>}
                <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs">Participante</span>
              </div>
            </section>

            {access.role === "buyer" && (
              <section className="mt-6 rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-white/[0.03] p-5 shadow-lg">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-300 text-slate-950">★</span><h2 className="font-bold">Apoiar durante a chamada</h2></div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">O pagamento é confirmado pelo Mercado Pago antes de a gorjeta aparecer como recebida.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[10, 25, 50, 100].map((value) => (
                      <button key={value} onClick={() => setTipAmount(value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${tipAmount === value ? "border-amber-300 bg-amber-300/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300"}`}>R$ {value}</button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="number" min={5} max={10000} step={0.01} value={tipAmount} onChange={(event) => setTipAmount(Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none sm:max-w-40" />
                  <input value={tipMessage} onChange={(event) => setTipMessage(event.target.value)} maxLength={500} placeholder="Mensagem opcional" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none" />
                  <button onClick={() => void openTipCheckout()} disabled={tipLoading} className="rounded-xl bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-60">{tipLoading ? "Abrindo pagamento..." : "Enviar gorjeta"}</button>
                </div>
                {tipError && <p className="mt-2 text-xs text-red-300">{tipError}</p>}
              </section>
            )}

            {paidTips.length > 0 && (
              <section className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{access.role === "creator" ? "Gorjetas recebidas" : "Gorjetas confirmadas"}</h2>
                  <span className="text-xs text-slate-500">Pagamento confirmado</span>
                </div>
                <div className="mt-3 space-y-2">
                  {paidTips.map((tip) => (
                    <div key={tip.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">R$ {tip.amount.toFixed(2).replace(".", ",")}</p>
                        {tip.message && <p className="truncate text-xs text-slate-400">{tip.message}</p>}
                      </div>
                      <span className="text-[11px] text-slate-500">{new Date(tip.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => toggleTrack("audio")} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold">{micEnabled ? "Microfone ativo" : "Microfone desligado"}</button>
              <button onClick={() => toggleTrack("video")} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold">{cameraEnabled ? "Câmera ativa" : "Câmera desligada"}</button>
              {access.role === "creator" && <>
                <button onClick={() => void extendSession(15)} disabled={extending} className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 disabled:opacity-60">{extending ? "Estendendo..." : "Estender +15 min"}</button>
                <button onClick={() => void extendSession(30)} disabled={extending} className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 disabled:opacity-60">Estender +30 min</button>
                <button onClick={() => void kickParticipant()} disabled={kicking || !access.other_joined} className="rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-sm font-semibold text-orange-100 disabled:opacity-40">{kicking ? "Removendo..." : "Derrubar participante"}</button>
                <button onClick={() => void endSession()} disabled={ending} className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{ending ? "Encerrando..." : "Encerrar chamada"}</button>
              </>}
              {access.role === "buyer" && <button onClick={() => void endSession()} disabled={ending} className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{ending ? "Saindo..." : "Sair da chamada"}</button>}
            </div>

            <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-5 text-slate-500">
              A sala é exclusiva para o comprador e o criador vinculados à sessão paga. O acesso é bloqueado antes da janela autorizada e após o encerramento.
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}
