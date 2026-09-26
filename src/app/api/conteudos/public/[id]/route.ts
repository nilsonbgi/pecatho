import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Conteúdo inválido." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: product, error } = await admin
    .from("digital_content_products")
    .select(
      "id,title,description,product_type,price,currency,status,owner_type,owner_id,cover_bucket,cover_path",
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível carregar o conteúdo." },
      { status: 500 },
    );
  }

  if (!product) {
    return NextResponse.json(
      { error: "Conteúdo não encontrado." },
      { status: 404 },
    );
  }

  let owner_name = product.owner_type === "creator" ? "Criador" : "Anunciante";
  let owner_slug = "";

  if (product.owner_type === "advertiser") {
    const { data: owner } = await admin.from("advertiser_profiles").select("display_name,title,slug").eq("id", product.owner_id).eq("status", "published").maybeSingle();
    if (owner) { owner_name = owner.display_name || owner.title || owner_name; owner_slug = owner.slug || ""; }
  } else {
    const { data: owner } = await admin.from("fans_creators").select("display_name,slug").eq("id", product.owner_id).eq("status", "active").maybeSingle();
    if (owner) { owner_name = owner.display_name || owner_name; owner_slug = owner.slug || ""; }
  }

  let cover_url: string | null = null;

  if (product.cover_bucket && product.cover_path) {
    const { data: signed } = await admin.storage
      .from(product.cover_bucket)
      .createSignedUrl(product.cover_path, 300);

    cover_url = signed?.signedUrl ?? null;
  }

  const { data: items, error: itemsError } = await admin
    .from("digital_content_product_items")
    .select("media_type,mime_type,size_bytes")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    console.error(itemsError);
    return NextResponse.json(
      { error: "Não foi possível carregar os detalhes do conteúdo." },
      { status: 500 },
    );
  }

  const mediaTypes = Array.from(
    new Set((items ?? []).map((item) => item.media_type).filter(Boolean)),
  );

  return NextResponse.json(
    {
      product: {
        id: product.id,
        title: product.title,
        description: product.description,
        product_type: product.product_type,
        price: product.price,
        currency: product.currency,
        owner_type: product.owner_type,
        owner_id: product.owner_id,
        owner_name,
        owner_slug,
        cover_url,
        file_count: items?.length ?? 0,
        media_types: mediaTypes,
      },
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
