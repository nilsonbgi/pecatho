"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Media = { id: string; kind: "image" | "video"; storage_bucket: string; storage_path: string; original_filename: string | null; access_type: "public" | "paid"; price: number; currency: string; is_public: boolean; is_primary: boolean; is_featured: boolean; show_in_cards: boolean; show_in_gallery: boolean; moderation_status: string; sort_order: number; previewUrl?: string | null };

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
    const { data, error: mediaError } = await supabase.from("profile_media").select("id,kind,storage_bucket,storage_path,original_filename,access_type,price,currency,is_public,is_primary,is_featured,show_in_cards,show_in_gallery,moderation_status,sort_order").eq("profile_id", profile.id).order("sort_order");
    if (mediaError) {
      setError(mediaError.message);
    } else {
      const rows = (data || []) as Media[];
      const withPreviews = await Promise.all(rows.map(async (item) => {
        const { data: signed } = await supabase.storage.from(item.storage_bucket).createSignedUrl(item.storage_path, 600);
        return { ...item, previewUrl: signed?.signedUrl || null };
      }));
      setMedia(withPreviews);
    }
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
        const bucket = access === "paid" ? "pecatho-profile-paid" : "pecatho-media";
        const path = `${user.id}/${profileId}/${crypto.randomUUID()}.${ext}`;
        const uploadResult = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
        if (uploadResult.error) throw uploadResult.error;
        const insertResult = await supabase.from("profile_media").insert({ profile_id: profileId, kind, storage_bucket: bucket, storage_path: path, original_filename: file.name, mime_type: file.type, size_bytes: file.size, sort_order: order, access_type: access, price: access === "paid" ? money(price) : 0, currency: "BRL" }).select("id,kind,storage_bucket,storage_path,original_filename,access_type,price,currency,is_public,is_primary,moderation_status,sort_order").single();
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
      const response = await fetch("/api/anunciantes/media/commerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_id: item.id, access_type: nextAccess, price: nextPrice }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Não foi possível atualizar a regra de acesso.");
      setMessage(nextAccess === "paid" ? "Conteúdo protegido em armazenamento privado e enviado para a regra de conteúdo pago." : "Mídia configurada como pública e mantida atrás de URL assinada.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível atualizar a mídia."); }
    finally { setBusy(false); }
  }

  async function updatePresentation(item: Media, patch: Partial<Pick<Media, "is_featured" | "show_in_cards" | "show_in_gallery">>) {
    setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      if (patch.is_featured === true) {
        const { error: clearError } = await supabase
          .from("profile_media")
          .update({ is_featured: false })
          .eq("profile_id", profileId)
          .eq("is_featured", true);
        if (clearError) throw clearError;
      }
      const { error: updateError } = await supabase.from("profile_media").update(patch).eq("id", item.id).eq("profile_id", profileId);
      if (updateError) throw updateError;
      setMessage("Apresentação da mídia atualizada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a apresentação da mídia.");
    } finally {
      setBusy(false);
    }
  }

  async function setPrimary(item: Media) {
    if (item.kind !== "image") { setError("Somente imagens podem ser definidas como principais."); return; }
    if (item.moderation_status !== "approved") { setError("A imagem precisa estar aprovada pela moderação para ser principal."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("set_primary_profile_media", { p_media_id: item.id });
      if (rpcError) throw rpcError;
      setMessage("Imagem principal atualizada.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível definir a imagem principal."); }
    finally { setBusy(false); }
  }

  return <main className="shell">
    <nav className="topbar">
      <Link href="/painel" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link>
      <Link href="/painel/anuncio" className="navCta">Voltar ao anúncio</Link>
    </nav>
    <section className="hero authHero">
      <div className="eyebrow">MEU ANÚNCIO · MÍDIAS</div>
      <h1>Transforme sua galeria em <em>vitrine.</em></h1>
      <p className="heroCopy">Escolha a imagem de destaque, defina onde cada mídia aparece e transforme fotos e vídeos em conteúdo público ou exclusivo. O original pago permanece protegido.</p>

      <div className="authCard editorCard">
        <h2>Adicionar mídia</h2>
        <div className="formGrid">
          <label>Acesso
            <select value={access} onChange={(e) => setAccess(e.target.value as "public" | "paid")}>
              <option value="public">Público</option>
              <option value="paid">Pago · conteúdo exclusivo</option>
            </select>
          </label>
          {access === "paid" && <label>Preço em reais
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="19,90" inputMode="decimal" />
          </label>}
        </div>
        <p className="fieldNote">Conteúdo pago usa armazenamento privado e só é liberado após pagamento confirmado.</p>
        <label className="primaryButton" style={{ cursor: busy ? "wait" : "pointer" }}>
          Selecionar fotos ou vídeos
          <input type="file" accept="image/*,video/*" multiple onChange={upload} disabled={busy} style={{ display: "none" }} />
        </label>
      </div>

      {(message || error) && <div className={message ? "formSuccess" : "formError"}>{message || error}</div>}

      <div className="authCard editorCard">
        <div className="sectionHeading">
          <div>
            <div className="eyebrow">MINHA GALERIA</div>
            <h2>{media.length} {media.length === 1 ? "arquivo" : "arquivos"}</h2>
          </div>
          <span className="fieldNote">Aprovados: {media.filter((item) => item.moderation_status === "approved").length}</span>
        </div>

        {media.length === 0 ? <p className="fieldNote">Nenhuma mídia cadastrada ainda.</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {media.map((item) => (
              <article key={item.id} className="card" style={{ minHeight: 0, overflow: "hidden", padding: 0 }}>
                <div style={{ position: "relative", aspectRatio: "4 / 3", background: "rgba(255,255,255,.04)", overflow: "hidden" }}>
                  {item.previewUrl ? (
                    item.kind === "video"
                      ? <video src={item.previewUrl} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <img src={item.previewUrl} alt={item.original_filename || "Mídia do anúncio"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : <div style={{ display: "grid", placeItems: "center", height: "100%" }} className="fieldNote">Prévia indisponível</div>}
                  <div style={{ position: "absolute", inset: "10px 10px auto", display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span className="fieldNote" style={{ background: "rgba(0,0,0,.72)", borderRadius: 999, padding: "5px 9px" }}>{item.kind === "video" ? "Vídeo" : "Foto"}</span>
                    <span className="fieldNote" style={{ background: "rgba(0,0,0,.72)", borderRadius: 999, padding: "5px 9px" }}>{item.access_type === "paid" ? `Pago · R$ ${Number(item.price).toFixed(2).replace(".", ",")}` : "Público"}</span>
                  </div>
                  {item.is_featured && <span style={{ position: "absolute", left: 10, bottom: 10, background: "rgba(0,0,0,.78)", borderRadius: 999, padding: "5px 9px" }}>★ Destaque</span>}
                </div>
                <div style={{ padding: 14 }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.original_filename || (item.kind === "video" ? "Vídeo" : "Imagem")}</strong>
                  <p className="fieldNote">{item.moderation_status === "approved" ? "Aprovado para publicação" : item.moderation_status === "rejected" ? "Reprovado pela moderação" : "Em moderação"}</p>
                  <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    <button type="button" className="secondaryButton" onClick={() => updatePresentation(item, { is_featured: !item.is_featured })} disabled={busy || item.moderation_status !== "approved"}>
                      {item.is_featured ? "Remover destaque" : "Usar como destaque"}
                    </button>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button type="button" className="secondaryButton" onClick={() => updatePresentation(item, { show_in_cards: !item.show_in_cards })} disabled={busy || item.moderation_status !== "approved"}>
                        {item.show_in_cards ? "Ocultar dos cards" : "Mostrar nos cards"}
                      </button>
                      <button type="button" className="secondaryButton" onClick={() => updatePresentation(item, { show_in_gallery: !item.show_in_gallery })} disabled={busy || item.moderation_status !== "approved"}>
                        {item.show_in_gallery ? "Ocultar da galeria" : "Mostrar na galeria"}
                      </button>
                    </div>
                    {item.kind === "image" && <button type="button" className="primaryButton" onClick={() => setPrimary(item)} disabled={busy || item.is_primary || item.moderation_status !== "approved"}>
                      {item.is_primary ? "Imagem principal" : "Definir como principal"}
                    </button>}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button type="button" className="secondaryButton" onClick={() => updateAccess(item, "public")} disabled={busy || item.access_type === "public"}>Tornar público</button>
                      <button type="button" className="primaryButton" onClick={() => updateAccess(item, "paid")} disabled={busy || item.access_type === "paid"}>Tornar pago</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  </main>;
}