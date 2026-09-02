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
    const mediaId = typeof body.media_id === "string" ? body.media_id : "";
    if (!mediaId) return new Response(JSON.stringify({ error: "Mídia não informada." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: media } = await supabaseAdmin.from("profile_media").select("id,profile_id,access_type,price,currency,storage_bucket,storage_path,moderation_status").eq("id", mediaId).maybeSingle();
    if (!media) return new Response(JSON.stringify({ error: "Mídia não encontrada." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await supabaseAdmin.from("advertiser_profiles").select("id,status").eq("id", media.profile_id).maybeSingle();
    if (!profile || profile.status !== "published" || media.moderation_status !== "approved") return new Response(JSON.stringify({ error: "Mídia indisponível." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (media.access_type === "public") {
      const { data } = supabaseAdmin.storage.from(media.storage_bucket).getPublicUrl(media.storage_path);
      return new Response(JSON.stringify({ access: "public", url: data.publicUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: purchase } = await supabaseAdmin.from("profile_media_purchases").select("id,status,expires_at").eq("media_id", media.id).eq("buyer_user_id", userData.user.id).eq("status", "paid").order("purchased_at", { ascending: false }).limit(1).maybeSingle();
    if (!purchase) return new Response(JSON.stringify({ error: "Conteúdo pago. Efetue o pagamento para visualizar esta mídia.", code: "MEDIA_PAYMENT_REQUIRED", price: media.price, currency: media.currency }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (purchase.expires_at && new Date(purchase.expires_at).getTime() < Date.now()) return new Response(JSON.stringify({ error: "O acesso a esta mídia expirou.", code: "MEDIA_ACCESS_EXPIRED" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: signed, error: signedError } = await supabaseAdmin.storage.from(media.storage_bucket).createSignedUrl(media.storage_path, 300);
    if (signedError || !signed?.signedUrl) return new Response(JSON.stringify({ error: "Não foi possível liberar a mídia neste momento." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ access: "paid", url: signed.signedUrl, expires_in: 300 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Erro interno ao liberar a mídia." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});