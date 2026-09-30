"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Reaction = { id: string; user_id: string; emoji: string };

const quick = ["❤️", "😍", "🔥", "👍", "😂", "😮"];

export default function MessageReactions({ messageId, userId }: { messageId: string; userId: string }) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("message_reactions")
      .select("id,user_id,emoji")
      .eq("message_id", messageId)
      .order("created_at", { ascending: true });
    if (!error) setReactions((data ?? []) as Reaction[]);
  }

  useEffect(() => {
    void load();
    const supabase = createClient();
    const channel = supabase
      .channel("message-reactions-" + messageId)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions", filter: "message_id=eq." + messageId }, () => {
        void load();
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [messageId]);

  async function toggle(emoji: string) {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    const existing = reactions.find((reaction) => reaction.user_id === userId && reaction.emoji === emoji);

    try {
      if (existing) {
        await supabase.from("message_reactions").delete().eq("id", existing.id).eq("user_id", userId);
      } else {
        await supabase.from("message_reactions").insert({ message_id: messageId, user_id: userId, emoji });
      }
      await load();
    } finally {
      setBusy(false);
      setPicker(false);
    }
  }

  const grouped = quick
    .map((emoji) => ({ emoji, count: reactions.filter((reaction) => reaction.emoji === emoji).length, mine: reactions.some((reaction) => reaction.user_id === userId && reaction.emoji === emoji) }))
    .filter((item) => item.count > 0);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
      {grouped.map((item) => (
        <button
          key={item.emoji}
          type="button"
          onClick={() => void toggle(item.emoji)}
          disabled={busy}
          style={{
            border: item.mine ? "1px solid rgba(231,195,63,.65)" : "1px solid rgba(148,163,184,.18)",
            borderRadius: 999,
            background: item.mine ? "rgba(231,195,63,.10)" : "rgba(255,255,255,.04)",
            color: "#fff",
            padding: "3px 7px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {item.emoji} {item.count}
        </button>
      ))}
      <button type="button" onClick={() => setPicker((value) => !value)} disabled={busy} aria-label="Reagir à mensagem" style={{ border: 0, background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14, padding: "3px 6px" }}>☺</button>
      {picker && (
        <div style={{ position: "absolute", left: 0, bottom: "calc(100% + 5px)", zIndex: 30, display: "flex", gap: 4, padding: 7, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "#11131b", boxShadow: "0 12px 35px rgba(0,0,0,.28)" }}>
          {quick.map((emoji) => <button key={emoji} type="button" onClick={() => void toggle(emoji)} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: 18, padding: 3 }}>{emoji}</button>)}
        </div>
      )}
    </div>
  );
}
