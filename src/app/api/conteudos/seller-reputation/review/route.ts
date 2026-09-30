import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SourceType = "digital_content" | "profile_media";

function isSourceType(value: unknown): value is SourceType {
  return value === "digital_content" || value === "profile_media";
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeComment(value: unknown) {
  if (typeof value !== "string") return null;
  const comment = value.trim();
  return comment ? comment.slice(0, 500) : null;
}

async function getAuthenticatedUser() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const admin = createAdminClient();
  const { data: reviews, error } = await admin
    .from("content_seller_reviews")
    .select("id,owner_type,owner_id,buyer_user_id,rating,comment,source_type,source_id,verified_purchase,status,created_at,updated_at")
    .eq("buyer_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível carregar suas avaliações." }, { status: 500 });
  }

  return NextResponse.json({ reviews: reviews ?? [] }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados da avaliação inválidos." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Dados da avaliação inválidos." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const sourceType = payload.source_type;
  const sourceId = payload.source_id;
  const ratingValue = payload.rating;
  const comment = normalizeComment(payload.comment);

  if (!isSourceType(sourceType) || !isUuid(sourceId)) {
    return NextResponse.json({ error: "Compra inválida." }, { status: 400 });
  }

  const rating = Number(ratingValue);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "A avaliação deve ter entre 1 e 5 estrelas." }, { status: 400 });
  }

  const admin = createAdminClient();

  let ownerType: "advertiser" | "creator";
  let ownerId: string;

  if (sourceType === "digital_content") {
    const { data: sale, error } = await admin
      .from("digital_content_sales")
      .select("id,buyer_user_id,owner_type,owner_id,status")
      .eq("id", sourceId)
      .eq("buyer_user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Não foi possível validar a compra." }, { status: 500 });
    }

    if (!sale || sale.status !== "paid") {
      return NextResponse.json({ error: "Somente compras confirmadas podem receber avaliação." }, { status: 403 });
    }

    ownerType = sale.owner_type as "advertiser" | "creator";
    ownerId = sale.owner_id;
  } else {
    const { data: purchase, error } = await admin
      .from("profile_media_purchases")
      .select("id,buyer_user_id,media_id,status")
      .eq("id", sourceId)
      .eq("buyer_user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Não foi possível validar a compra." }, { status: 500 });
    }

    if (!purchase || purchase.status !== "paid") {
      return NextResponse.json({ error: "Somente compras confirmadas podem receber avaliação." }, { status: 403 });
    }

    const { data: media, error: mediaError } = await admin
      .from("profile_media")
      .select("id,profile_id")
      .eq("id", purchase.media_id)
      .maybeSingle();

    if (mediaError) {
      console.error(mediaError);
      return NextResponse.json({ error: "Não foi possível identificar o vendedor." }, { status: 500 });
    }

    if (!media) return NextResponse.json({ error: "Conteúdo adquirido não encontrado." }, { status: 404 });

    ownerType = "advertiser";
    ownerId = media.profile_id;
  }

  const { data: existing, error: existingError } = await admin
    .from("content_seller_reviews")
    .select("id,owner_type,owner_id,buyer_user_id,rating,comment,source_type,source_id,verified_purchase,status,created_at,updated_at")
    .eq("buyer_user_id", user.id)
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .maybeSingle();

  if (existingError) {
    console.error(existingError);
    return NextResponse.json({ error: "Não foi possível verificar sua avaliação." }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ error: "Esta compra já possui uma avaliação." }, { status: 409 });
  }

  const { data: review, error: insertError } = await admin
    .from("content_seller_reviews")
    .insert({
      owner_type: ownerType,
      owner_id: ownerId,
      buyer_user_id: user.id,
      rating,
      comment,
      source_type: sourceType,
      source_id: sourceId,
      verified_purchase: true,
      status: "pending",
    })
    .select("id,owner_type,owner_id,buyer_user_id,rating,comment,source_type,source_id,verified_purchase,status,created_at,updated_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Esta compra já possui uma avaliação." }, { status: 409 });
    }
    console.error(insertError);
    return NextResponse.json({ error: "Não foi possível registrar sua avaliação." }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
