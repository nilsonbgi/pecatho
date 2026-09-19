"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Props = {
  creatorId: string;
  className?: string;
};

export default function StartFansChatButton({ creatorId, className = "" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/login?next=/fans");
        return;
      }

      const { data, error: rpcError } = await supabase.rpc("start_fans_conversation", {
        p_creator_id: creatorId,
        p_source: "direct",
        p_source_id: null,
      });

      if (rpcError) throw rpcError;
      if (!data) throw new Error("A conversa não foi criada.");

      router.push(`/painel/mensagens/${data}`);
    } catch (err) {
      console.error(err);
      setError("Não foi possível abrir o chat agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Abrindo chat..." : "Conversar com o criador"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
