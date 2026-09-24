import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ownerType = searchParams.get("owner_type");
  const ownerId = searchParams.get("owner_id");

  if ((ownerType !== "advertiser" && ownerType !== "creator") || !ownerId) {
    return NextResponse.json({ error: "Proprietário inválido." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (ownerType === "advertiser") {
    const { data: owner } = await admin
      .from("advertiser_profiles")
      .select("id,status")
      .eq("id", ownerId)
      .eq("status", "published")
      .maybeSingle();

    if (!owner) return NextResponse.json({ products: [] }, { status: 200 });
  } else {
    const { data: owner } = await admin
      .from("fans_creators")
      .select("id,status")
      .eq("id", ownerId)
      .eq("status", "active")
      .maybeSingle();

    if (!owner) return NextResponse.json({ products: [] }, { status: 200 });
  }

  const { data, error } = await admin
    .from("digital_content_products")
    .select("id,title,description,product_type,price,currency")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível carregar os conteúdos." }, { status: 500 });
  }

  return NextResponse.json({ products: data ?? [] }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
