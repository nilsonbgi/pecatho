import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "É necessário estar autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const productId = body?.product_id;
  if (typeof productId !== "string") return NextResponse.json({ error: "Conteúdo inválido." }, { status: 400 });
  const normalizedProductId = productId.trim();
  if (!normalizedProductId || normalizedProductId.length > 128) {
    return NextResponse.json({ error: "Conteúdo inválido." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_digital_content_checkout_intent", {
    p_product_id: normalizedProductId,
  });

  if (error) {
    console.error("Falha ao iniciar intenção de compra de conteúdo digital:", error);
    return NextResponse.json(
      { error: "Não foi possível iniciar a compra. O conteúdo pode estar indisponível; atualize a página e tente novamente." },
      { status: 409 },
    );
  }

  if (data?.already_owned) {
    if (typeof data.sale_id === "string" && data.sale_id) {
      return NextResponse.json({ ...data, already_owned: true }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(
      { error: "Este conteúdo já consta como adquirido, mas não foi possível localizar a compra. Acesse Minhas compras." },
      { status: 409 },
    );
  }

  if (!data || typeof data.order_id !== "string" || !data.order_id) {
    console.error("A RPC de checkout de conteúdo não retornou um identificador de pedido válido.");
    return NextResponse.json(
      { error: "Não foi possível preparar a compra neste momento. Tente novamente." },
      { status: 502 },
    );
  }

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
