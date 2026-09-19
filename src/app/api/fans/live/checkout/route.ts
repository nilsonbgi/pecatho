import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "É necessário estar autenticado para continuar." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const offerId = body?.offer_id;

  if (!isUuid(offerId)) {
    return NextResponse.json({ error: "Oferta inválida." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_fans_live_checkout_intent", {
    p_offer_id: offerId,
  });

  if (error || !data) {
    const message = error?.message ?? "Não foi possível criar o pedido da videochamada.";
    const status = message.includes("AUTH_REQUIRED") ? 401
      : message.includes("OFFER_NOT_AVAILABLE") || message.includes("CREATOR_NOT_AVAILABLE") ? 404
      : message.includes("SELF_PURCHASE") || message.includes("LIVE_CHECKOUT_ALREADY_EXISTS") ? 409
      : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({
    session: data,
    checkout: {
      order_id: data.order_id,
      requires_provider_confirmation: true,
      message: "Pedido criado. A videochamada somente será liberada após a confirmação oficial do pagamento.",
    },
  }, { status: 201 });
}
