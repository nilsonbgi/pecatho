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
    const code = error.message || "";
    const status =
      code.includes("CUSTOMER_ACCOUNT_REQUIRED") ? 403 :
      code.includes("SELF_GIFT_NOT_ALLOWED") ? 409 :
      code.includes("RECIPIENT_NOT_FOUND") ? 404 :
      code.includes("INVALID_GIFT_AMOUNT") ? 400 : 400;
    const message =
      code.includes("CUSTOMER_ACCOUNT_REQUIRED") ? "Para enviar um presente, entre com uma conta de cliente ou habilite o perfil de cliente na sua conta." :
      code.includes("SELF_GIFT_NOT_ALLOWED") ? "Você não pode enviar um presente para o seu próprio perfil." :
      code.includes("RECIPIENT_NOT_FOUND") ? "Este perfil não está disponível para receber presentes no momento." :
      code.includes("INVALID_GIFT_AMOUNT") ? "Informe um presente entre R$ 10,00 e R$ 10.000,00." :
      "Não foi possível preparar o presente agora. Confira sua conta e tente novamente.";
    return NextResponse.json({ error: message, code: status === 400 ? "GIFT_REQUEST_INVALID" : "GIFT_REQUEST_REJECTED" }, { status });
  }

  return NextResponse.json(data);
}
