import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "É necessário estar autenticado para enviar um presente." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const recipientType = body?.recipient_type;
  const recipientId = body?.recipient_id;
  const amount = Number(body?.amount);
  const message = typeof body?.message === "string" ? body.message.slice(0, 300) : null;

  if (recipientType !== "advertiser" && recipientType !== "creator") {
    return NextResponse.json({ error: "Destinatário inválido." }, { status: 400 });
  }
  if (typeof recipientId !== "string" || !/^[0-9a-f-]{36}$/i.test(recipientId)) {
    return NextResponse.json({ error: "Destinatário inválido." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 10 || amount > 10000) {
    return NextResponse.json({ error: "O presente deve estar entre R$ 10,00 e R$ 10.000,00." }, { status: 400 });
  }

  const { data, error } = await client.rpc("create_pecatho_gift_checkout_intent", {
    p_recipient_type: recipientType,
    p_recipient_id: recipientId,
    p_amount: Number(amount.toFixed(2)),
    p_message: message,
  });

  if (error) {
    const status =
      error.message.includes("CUSTOMER_ACCOUNT_REQUIRED") ? 403 :
      error.message.includes("SELF_GIFT_NOT_ALLOWED") ? 409 :
      error.message.includes("RECIPIENT_NOT_FOUND") ? 404 :
      error.message.includes("INVALID_GIFT_AMOUNT") ? 400 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(data);
}
