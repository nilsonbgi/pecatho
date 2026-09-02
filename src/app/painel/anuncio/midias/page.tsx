"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Media = { id: string; kind: "image" | "video"; storage_bucket: string; storage_path: string; original_filename: string | null; access_type: "public" | "paid"; price: number; currency: string; is_public: boolean; moderation_status: string; sort_order: number };

function money(value: string) { const clean = value.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", "."); const n = Number(clean); return Number.isFinite(n) ? n : 0; }

export default function AdvertiserMediaManager() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [access, setAccess] = useState<"public" | "paid">("public");
  const [price, setPrice] = useState("19,90");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data: profile, error: profileError } = await supabase.from("advertiser_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (profileError || !profile) { setError("Crie ou salve seu anúncio antes de gerenciar as mídias."); return; }
    setProfileId(profile.id);
    const { data, error: mediaError } = await supabase.from("profile_media").select("id,kind,storage_bucket,storage_path,original_filename,access_type,price,currency,is_public,moderation_status,sort_order").eq("profile_id", profile.id).order("sort_order");
    if (mediaError) setError(mediaError.message); else setMedia((data || []) as Media[]);
  }

  useEffect(() => { void load(); }, []);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []); if (!files.length || !profileId) return;
    setBusy(true); setMessage(""); setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");
      let order = media.length;
      for (const file of files) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) throw new Error("Envie apenas imagens ou vídeos.");
        if (file.size > 50 * 1024 * 1024) throw new Error("Cada arquivo deve ter no máximo 50 MB.");
        const kind = file.type.startsWith("video/") ? "video" : "image";
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        const bucket = access === "paid" ? "pecatho-private" : "pecatho-media";
        const path = `${user.id}/${profileId}/${crypto.randomUUID()}.${ext}`;
        const uploadResult = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
        if (uploadResult.error) throw uploadResult.error;
        const insertResult = await supabase.from("profile_media").insert({ profile_id: profileId, kind, storage_bucket: bucket, storage_path: path, original_filename: file.name, mime_type: file.type, size_bytes: file.size, sort_order: order, is_primary: order === 0, is_public: access === "public", access_type: access, price: access === "paid" ? money(price) : 0, currency: "BRL", moderation_status: "pending" }).select("id,kind,storage_bucket,storage_path,original_filename,access_type,price,currency,is_public,moderation_status,sort_order").single();
        if (insertResult.error) throw insertResult.error;
        order += 1;
      }
      setMessage(access === "paid" ? "Conteúdo exclusivo enviado para moderação. O arquivo original permanece em armazenamento privado." : "Mídia pública enviada para moderação.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível enviar a mídia."); }
    finally { setBusy(false); e.target.value = ""; }
  }

  async function updateAccess(item: Media, nextAccess: "public" | "paid") {
    const nextPrice = nextAccess === "paid" ? money(price) : 0;
    if (nextAccess === "paid" && nextPrice <= 0) { setError("Informe um valor maior que zero para conteúdo pago."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("profile_media").update({ access_type: nextAccess, price: nextPrice, is_public: nextAccess === "public" }).eq("id", item.id);
      if (updateError) throw updateError;
      setMessage("Regra de acesso atualizada. A mudança ficará sujeita à moderação quando aplicável.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível atualizar a mídia."); }
    finally { setBusy(false); }
  }

  return <main className="shell"><nav className="topbar"><Link href="/painel" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link><Link href="/painel/anuncio" className="navCta">Voltar ao anúncio</Link></nav><section className="hero authHero"><div className="eyebrow">MEU ANÚNCIO · MÍDIAS</div><h1>Controle <em>quem vê.</em></h1><p className="heroCopy">Escolha, mídia por mídia, o que será público e o que ficará exclusivo para quem efetuar o pagamento. Fotos e vídeos pagos usam armazenamento privado.</p>
    <div className="authCard editorCard"><h2>Adicionar mídia</h2><div className="formGrid"><label>Acesso<select value={access} onChange={(e) => setAccess(e.target.value as "public" | "paid")}><option value="public">Público</option><option value="paid">Pago · conteúdo exclusivo</option></select></label>{access === "paid" && <label>Preço em reais<input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="19,90" inputMode="decimal" /></label>}</div><p className="fieldNote">O conteúdo pago será armazenado no bucket privado e não terá URL pública. A liberação ocorre somente por autorização de compra confirmada.</p><label className="primaryButton" style={{ cursor: busy ? "wait" : "pointer" }}>Selecionar fotos ou vídeos<input type="file" accept="image/*,video/*" multiple onChange={upload} disabled={busy} style={{ display: "none" }} /></label></div>
    {message && <p className="formSuccess">{message}</p>}{error && <p className="formError">{error}</p>}
    <div className="authCard editorCard"><div className="sectionHeading"><div><div className="eyebrow">MINHA GALERIA</div><h2>{media.length} arquivos</h2></div></div>{media.length === 0 ? <p className="fieldNote">Nenhuma mídia cadastrada ainda.</p> : <div style={{ display: "grid", gap: 12 }}>{media.map((item) => <article key={item.id} className="card" style={{ minHeight: 0 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}><div><strong>{item.original_filename || (item.kind === "video" ? "Vídeo" : "Imagem")}</strong><p className="fieldNote">{item.kind === "video" ? "Vídeo" : "Foto"} · {item.moderation_status === "approved" ? "Aprovado" : "Em moderação"} · {item.access_type === "paid" ? `Pago · R$ ${Number(item.price).toFixed(2).replace(".", ",")}` : "Público"}</p></div><div style={{ display: "flex", gap: 8 }}><button type="button" className="secondaryButton" onClick={() => updateAccess(item, "public")} disabled={busy || item.access_type === "public"}>Tornar público</button><button type="button" className="primaryButton" onClick={() => updateAccess(item, "paid")} disabled={busy || item.access_type === "paid"}>Tornar pago</button></div></div></article>)}</div>}</div>
  </section></main>;
}
