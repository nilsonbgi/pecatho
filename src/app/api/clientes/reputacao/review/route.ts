import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type SourceType = "digital_content" | "profile_media" | "service_experience";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const sourceType = searchParams.get("source_type");
  const sourceId = searchParams.get("source_id");
  const admin = createAdminClient();

  if (sourceType && sourceId) {
    const { data, error } = await admin.from("customer_reviews").select("id,customer_user_id,rating,comment,source_type,source_id,verified_interaction,status,created_at").eq("reviewer_user_id", user.id).eq("source_type", sourceType).eq("source_id", sourceId).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ review: data ?? null });
  }

  const { data, error } = await admin.from("customer_reviews").select("id,rating,comment,source_type,source_id,verified_interaction,created_at").eq("customer_user_id", user.id).eq("status", "approved").eq("verified_interaction", true).order("created_at", { ascending: false }).limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const values = (data ?? []).map((row) => Number(row.rating)).filter(Number.isFinite);
  return NextResponse.json({ reputation: { average_rating: values.length ? Number((values.reduce((a,b) => a+b, 0) / values.length).toFixed(1)) : null, review_count: values.length, reviews: data ?? [], trust_badge: values.length > 0 } }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const sourceType = body?.source_type as SourceType;
  const sourceId = String(body?.source_id || "");
  const rating = Number(body?.rating);
  const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 500) : "";
  if (!["digital_content","profile_media","service_experience"].includes(sourceType) || !sourceId) return NextResponse.json({ error: "Interação inválida." }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "A nota deve estar entre 1 e 5." }, { status: 400 });

  const admin = createAdminClient();
  let customerUserId: string | null = null;

  if (sourceType === "digital_content") {
    const { data: sale } = await admin.from("digital_content_sales").select("buyer_user_id,owner_user_id,status").eq("id", sourceId).maybeSingle();
    if (!sale || sale.owner_user_id !== user.id || sale.status !== "paid") return NextResponse.json({ error: "Esta compra não pode gerar uma avaliação de cliente." }, { status: 403 });
    customerUserId = sale.buyer_user_id;
  } else if (sourceType === "profile_media") {
    const { data: purchase } = await admin.from("profile_media_purchases").select("buyer_user_id,media_id,status").eq("id", sourceId).maybeSingle();
    if (!purchase || purchase.status !== "paid") return NextResponse.json({ error: "Esta compra não pode gerar uma avaliação de cliente." }, { status: 403 });
    const { data: media } = await admin.from("profile_media").select("profile_id").eq("id", purchase.media_id).maybeSingle();
    const { data: advertiser } = media?.profile_id ? await admin.from("advertiser_profiles").select("user_id").eq("id", media.profile_id).maybeSingle() : { data: null };
    if (!advertiser || advertiser.user_id !== user.id) return NextResponse.json({ error: "Você não é o vendedor desta compra." }, { status: 403 });
    customerUserId = purchase.buyer_user_id;
  } else {
    const { data: experience } = await admin.from("profile_service_experiences").select("user_id,profile_id,status").eq("id", sourceId).maybeSingle();
    if (!experience || experience.status !== "verified") return NextResponse.json({ error: "A experiência de serviço não está verificada." }, { status: 403 });
    const { data: advertiser } = await admin.from("advertiser_profiles").select("user_id").eq("id", experience.profile_id).maybeSingle();
    if (!advertiser || advertiser.user_id !== user.id) return NextResponse.json({ error: "Você não é o anunciante desta experiência." }, { status: 403 });
    customerUserId = experience.user_id;
  }

  if (!customerUserId || customerUserId === user.id) return NextResponse.json({ error: "Cliente inválido." }, { status: 400 });
  const { data: existing } = await admin.from("customer_reviews").select("id").eq("reviewer_user_id", user.id).eq("source_type", sourceType).eq("source_id", sourceId).maybeSingle();
  if (existing) return NextResponse.json({ error: "Você já avaliou este cliente nesta interação." }, { status: 409 });

  const { data: review, error } = await admin.from("customer_reviews").insert({ customer_user_id: customerUserId, reviewer_user_id: user.id, rating, comment: comment || null, source_type: sourceType, source_id: sourceId, verified_interaction: true, status: "approved" }).select("id,customer_user_id,rating,comment,source_type,source_id,verified_interaction,status,created_at").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Você já avaliou este cliente nesta interação." : error.message }, { status: error.code === "23505" ? 409 : 500 });
  return NextResponse.json({ review }, { status: 201 });
}
