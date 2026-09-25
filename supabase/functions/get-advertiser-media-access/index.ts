import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Autenticação necessária." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    const supabase = createClient(supabaseUrl, publishableKeys.default, { global: { headers: { Authorization: authHeader } } });
    const supabaseAdmin = createClient(supabaseUrl, secretKeys.default);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return new Response(JSON.stringify({ error: "Sessão inválida ou expirada." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const body = await req.json().catch(() => ({}));
    const requestedIds = Array.isArray(body.media_ids)
      ? body.media_ids.filter((value) => typeof value === "string" && value.length > 0).slice(0, 100)
      : [];
    const singleId = typeof body.media_id === "string" ? body.media_id : "";
    const mediaIds = requestedIds.length > 0 ? requestedIds : singleId ? [singleId] : [];
    if (mediaIds.length === 0) return new Response(JSON.stringify({ error: "Mídia não informada." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: mediaRows, error: mediaError } = await supabaseAdmin.from("profile_media").select("id,profile_id,access_type,price,currency,storage_bucket,storage_path,moderation_status").in("id", mediaIds);
    if (mediaError) return new Response(JSON.stringify({ error: "Não foi possível consultar as mídias." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const media = mediaRows ?? [];
    if (media.length === 0) return new Response(JSON.stringify({ accesses: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const profileIds = [...new Set(media.map((item) => item.profile_id))];
    const { data: profiles } = await supabaseAdmin.from("advertiser_profiles").select("id,status").in("id", profileIds);
    const publishedProfiles = new Set((profiles ?? []).filter((profile) => profile.status === "published").map((profile) => profile.id));
    const paidIds = media.filter((item) => item.access_type === "paid" && publishedProfiles.has(item.profile_id) && item.moderation_status === "approved").map((item) => item.id);
    const { data: purchases } = paidIds.length > 0
      ? await supabaseAdmin.from("profile_media_purchases").select("media_id,status,expires_at,purchased_at").eq("buyer_user_id", userData.user.id).eq("status", "paid").in("media_id", paidIds).order("purchased_at", { ascending: false })
      : { data: [] };

    const latestPurchase = new Map();
    for (const purchase of purchases ?? []) if (!latestPurchase.has(purchase.media_id)) latestPurchase.set(purchase.media_id, purchase.expires_at);

    const accesses = [];
    for (const item of media) {
      if (!publishedProfiles.has(item.profile_id) || item.moderation_status !== "approved") continue;
      if (item.access_type === "public") {
        const { data } = supabaseAdmin.storage.from(item.storage_bucket).getPublicUrl(item.storage_path);
        accesses.push({ media_id: item.id, access: "public", url: data.publicUrl });
        continue;
      }
      const expiresAt = latestPurchase.get(item.id);
      if (expiresAt === undefined || (expiresAt && new Date(expiresAt).getTime() < Date.now())) continue;
      const { data: signed, error: signedError } = await supabaseAdmin.storage.from(item.storage_bucket).createSignedUrl(item.storage_path, 300);
      if (!signedError && signed?.signedUrl) accesses.push({ media_id: item.id, access: "paid", url: signed.signedUrl, expires_in: 300 });
    }
    return new Response(JSON.stringify({ accesses }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Erro interno ao liberar a mídia." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});