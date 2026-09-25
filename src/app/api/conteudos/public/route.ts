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

    if (!owner) return NextResponse.json({ products: [] });
  } else {
    const { data: owner } = await admin
      .from("fans_creators")
      .select("id,status")
      .eq("id", ownerId)
      .eq("status", "active")
      .maybeSingle();

    if (!owner) return NextResponse.json({ products: [] });
  }

  const { data, error } = await admin
    .from("digital_content_products")
    .select("id,title,description,product_type,price,currency,cover_bucket,cover_path")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível carregar os conteúdos." },
      { status: 500 },
    );
  }

  const products = await Promise.all(
    (data ?? []).map(async (product) => {
      let cover_url: string | null = null;

      if (product.cover_bucket && product.cover_path) {
        const { data: signed } = await admin.storage
          .from(product.cover_bucket)
          .createSignedUrl(product.cover_path, 300);

        cover_url = signed?.signedUrl ?? null;
      }

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        product_type: product.product_type,
        price: product.price,
        currency: product.currency,
        cover_url,
      };
    }),
  );

  return NextResponse.json(
    { products },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
