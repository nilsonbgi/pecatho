import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401, headers });
  const saleId = new URL(request.url).searchParams.get("sale_id")?.trim();
  if (!saleId || !/^[0-9a-f-]{36}$/i.test(saleId)) return NextResponse.json({ error: "Compra inválida." }, { status: 400, headers });

  const admin = createAdminClient();
  const { data: sale, error: saleError } = await admin.from("digital_content_sales")
    .select("id,product_id,status,buyer_user_id").eq("id", saleId).eq("buyer_user_id", user.id).eq("status", "paid").maybeSingle();
  if (saleError) {
    console.error("Falha ao validar seleção de conteúdo:", saleError);
    return NextResponse.json({ error: "Não foi possível validar esta compra." }, { status: 503, headers });
  }
  if (!sale) return NextResponse.json({ error: "Você não tem acesso a esta compra." }, { status: 403, headers });

  const [{ data: product, error: productError }, { data: items, error: itemsError }, { data: selected, error: selectedError }] = await Promise.all([
    admin.from("digital_content_products").select("id,product_type,package_image_limit,package_video_limit").eq("id", sale.product_id).maybeSingle(),
    admin.from("digital_content_product_items").select("id,original_filename,media_type,sort_order").eq("product_id", sale.product_id).in("media_type", ["image", "video"]).order("sort_order", { ascending: true }),
    admin.from("digital_content_sale_selections").select("product_item_id").eq("sale_id", sale.id).eq("buyer_user_id", user.id),
  ]);
  if (productError || itemsError || selectedError || !product) {
    console.error("Falha ao carregar opções de seleção de conteúdo:", productError || itemsError || selectedError);
    return NextResponse.json({ error: "Não foi possível carregar os arquivos disponíveis." }, { status: 503, headers });
  }
  return NextResponse.json({
    sale_id: sale.id,
    product_type: product.product_type,
    limits: { images: product.package_image_limit ?? 1, videos: product.package_video_limit ?? 1 },
    items: (items ?? []).map(item => ({ id: item.id, filename: item.original_filename || "Conteúdo", media_type: item.media_type })),
    selected_ids: (selected ?? []).map(item => item.product_item_id),
  }, { headers });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401, headers });
  const body = await request.json().catch(() => null);
  const saleId = typeof body?.sale_id === "string" ? body.sale_id.trim() : "";
  const itemIds = body?.item_ids;
  if (!/^[0-9a-f-]{36}$/i.test(saleId) || !Array.isArray(itemIds) || itemIds.length < 1 || itemIds.length > 500 || itemIds.some((id: unknown) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))) {
    return NextResponse.json({ error: "Selecione arquivos válidos para esta compra." }, { status: 400, headers });
  }
  const { data, error } = await supabase.rpc("set_digital_content_sale_selection", { p_sale_id: saleId, p_product_item_ids: itemIds });
  if (error) {
    console.error("Falha ao salvar seleção de arquivos comprados:", error);
    const msg = error.message || "";
    const denied = /AUTH_REQUIRED|CONTENT_ACCESS_DENIED/i.test(msg);
    const invalid = /SELECTION_REQUIRED|DUPLICATE_SELECTION|INVALID_SELECTION_ITEM|SELECTION_LIMIT_EXCEEDED|UNSUPPORTED_MEDIA_SELECTION/i.test(msg);
    return NextResponse.json({ error: denied ? "Você não tem acesso a esta compra." : invalid ? "A seleção excede os limites do pacote ou contém arquivos inválidos. Revise as quantidades de imagens e vídeos." : "Não foi possível salvar sua seleção. Tente novamente." }, { status: denied ? 403 : invalid ? 400 : 503, headers });
  }
  return NextResponse.json({ ok: true, selection: data }, { headers });
}
