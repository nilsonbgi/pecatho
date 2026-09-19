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
  const supabase = createClient();

  const [access, setAccess] = useState<Access | null>(null);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("Preparando sala...");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [ending, setEnding] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const endedRef = useRef(false);

  const sendSignal = useCallback(async (
    signalType: Signal["signal_type"],
    payload: Record<string, unknown> = {}
  ) => {
    if (!sessionId || !userId) return;
    const { error: signalError } = await supabase.from("fans_live_signals").insert({
      session_id: sessionId,
      sender_user_id: userId,
      signal_type: signalType,
      payload,
    });
    if (signalError) setError(signalError.message);
  }, [sessionId, supabase, userId]);

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
        setConnection("Conexão interrompida");
      } else if (pc.connectionState === "failed") {
        setConnection("Falha na conexão");
      }
    };

    if (role === "creator") {
      setConnection("Aguardando o comprador...");
    } else {
      setConnection("Aguardando o criador...");
    }

    return pc;
  }, [sendSignal]);

  const createOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal("offer", { sdp: offer.sdp, type: offer.type });
      setConnection("Chamando...");
    } catch {
      setError("Não foi possível iniciar a conexão de vídeo.");
    }
  }, [sendSignal]);

  const handleSignal = useCallback(async (signal: Signal) => {
    if (!userId || signal.sender_user_id === userId) return;
    const pc = pcRef.current;
    if (!pc) return;

    if (signal.signal_type === "join" && access?.role === "creator") {
      await createOffer();
      return;
    }

    if (signal.signal_type === "offer" && access?.role === "buyer") {
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

    if (signal.signal_type === "answer" && access?.role === "creator") {
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
  }, [access?.role, createOffer, flushCandidates, sendSignal, userId]);

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
    if (redirect) router.push("/fans/videochamadas");
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
      setUserId(user.id);

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
      setAccess(roomAccess);

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
            event: "UPDATE",
            schema: "public",
            table: "fans_live_sessions",
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            if (payload.new.status === "completed") {
              setConnection("Chamada encerrada.");
              window.setTimeout(() => router.push("/fans/videochamadas"), 900);
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
  }, [createPeer, handleSignal, router, sendSignal, sessionId, supabase]);

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
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <nav className="flex items-center justify-between">
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
            <header className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sala privada · {access.role === "creator" ? "Criador" : "Cliente"}</p>
                <h1 className="mt-2 text-2xl font-bold">{access.title}</h1>
                <p className="mt-1 text-sm text-slate-400">{connection}</p>
              </div>
              <span className="text-sm text-slate-400">{access.duration_minutes} minutos contratados</span>
            </header>

            {error && <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">{error}</p>}

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs">Você</span>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                {!remoteConnected && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">Aguardando a outra pessoa entrar...</div>}
                <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs">Participante</span>
              </div>
            </section>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => toggleTrack("audio")} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold">{micEnabled ? "Microfone ativo" : "Microfone desligado"}</button>
              <button onClick={() => toggleTrack("video")} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold">{cameraEnabled ? "Câmera ativa" : "Câmera desligada"}</button>
              <button onClick={() => void endSession()} disabled={ending} className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{ending ? "Encerrando..." : "Encerrar chamada"}</button>
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
