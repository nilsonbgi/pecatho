import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SourceType = "digital_content" | "profile_media";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_seller_reviews")
    .select("id,owner_type,owner_id,rating,comment,source_type,source_id,created_at")
    .eq("buyer_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Não foi possível carregar suas avaliações." }, { status: 500 });

  return NextResponse.json({ reviews: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  let body: {
    source_type?: SourceType;
    source_id?: string;
    rating?: number;
    comment?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados de avaliação inválidos." }, { status: 400 });
  }

  const sourceType = body.source_type;
  const sourceId = typeof body.source_id === "string" ? body.source_id.trim() : "";
  const rating = Number(body.rating);
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : null;

  if ((sourceType !== "digital_content" && sourceType !== "profile_media") || !sourceId) {
    return NextResponse.json({ error: "Origem da compra inválida." }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "A avaliação deve ter entre 1 e 5 estrelas." }, { status: 400 });
  }

  const admin = createAdminClient();
  let ownerType: "advertiser" | "creator";
  let ownerId: string;

  if (sourceType === "digital_content") {
    const { data: sale, error: saleError } = await admin
      .from("digital_content_sales")
      .select("id,product_id,owner_type,owner_id")
      .eq("id", sourceId)
      .eq("buyer_user_id", user.id)
      .eq("status", "paid")
      .maybeSingle();

    if (saleError) return NextResponse.json({ error: "Não foi possível validar a compra." }, { status: 500 });
    if (!sale) return NextResponse.json({ error: "A avaliação só pode ser enviada após uma compra confirmada." }, { status: 403 });

    ownerType = sale.owner_type as "advertiser" | "creator";
    ownerId = sale.owner_id;
  } else {
    const { data: purchase, error: purchaseError } = await admin
      .from("profile_media_purchases")
      .select("id,media_id")
      .eq("id", sourceId)
      .eq("buyer_user_id", user.id)
      .eq("status", "paid")
      .maybeSingle();

    if (purchaseError) return NextResponse.json({ error: "Não foi possível validar a compra." }, { status: 500 });
    if (!purchase) return NextResponse.json({ error: "A avaliação só pode ser enviada após uma compra confirmada." }, { status: 403 });

    const { data: media, error: mediaError } = await admin
      .from("profile_media")
      .select("id,profile_id")
      .eq("id", purchase.media_id)
      .maybeSingle();

    if (mediaError) return NextResponse.json({ error: "Não foi possível identificar o vendedor." }, { status: 500 });
    if (!media) return NextResponse.json({ error: "Conteúdo adquirido não encontrado." }, { status: 404 });

    ownerType = "advertiser";
    ownerId = media.profile_id;
  }

  const { data: existing, error: existingError } = await admin
    .from("content_seller_reviews")
    .select("id")
    .eq("buyer_user_id", user.id)
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: "Não foi possível verificar sua avaliação anterior." }, { status: 500 });
  if (existing) return NextResponse.json({ error: "Você já avaliou este conteúdo.", review_id: existing.id }, { status: 409 });

  const { data: review, error: insertError } = await admin
    .from("content_seller_reviews")
    .insert({
      owner_type: ownerType,
      owner_id: ownerId,
      buyer_user_id: user.id,
      rating,
      comment: comment || null,
      source_type: sourceType,
      source_id: sourceId,
      verified_purchase: true,
      status: "approved",
    })
    .select("id,owner_type,owner_id,rating,comment,source_type,source_id,created_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Você já avaliou este conteúdo." }, { status: 409 });
    }
    console.error(insertError);
    return NextResponse.json({ error: "Não foi possível registrar sua avaliação." }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
