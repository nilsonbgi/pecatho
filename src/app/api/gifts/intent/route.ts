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
  const boostPlanId = body?.boost_plan_id ?? null;
  if (boostPlanId !== null && (recipientType !== "creator" || typeof boostPlanId !== "string" || !/^[0-9a-f-]{36}$/i.test(boostPlanId))) {
    return NextResponse.json({ error: "Plano de impulsionamento inválido para este destinatário." }, { status: 400 });
  }

  if (recipientType !== "advertiser" && recipientType !== "creator") {
    return NextResponse.json({ error: "Destinatário inválido." }, { status: 400 });
  }
  if (typeof recipientId !== "string" || !/^[0-9a-f-]{36}$/i.test(recipientId)) {
    return NextResponse.json({ error: "Destinatário inválido." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 5 || amount > 10000) {
    return NextResponse.json({ error: "O presente deve estar entre R$ 5,00 e R$ 10.000,00." }, { status: 400 });
  }

  const { data, error } = await client.rpc("create_pecatho_gift_with_boost_checkout_intent", {
    p_recipient_type: recipientType,
    p_recipient_id: recipientId,
    p_amount: Number(amount.toFixed(2)),
    p_message: message,
    p_boost_plan_id: boostPlanId,
  });

  if (error) {
    const code = error.message || "";
    const status =
      code.includes("CUSTOMER_ACCOUNT_REQUIRED") || code.includes("GIFTS_NOT_INCLUDED_IN_PUBLICATION_PLAN") ? 403 :
      code.includes("SELF_GIFT_NOT_ALLOWED") ? 409 :
      code.includes("RECIPIENT_NOT_FOUND") ? 404 :
      code.includes("INVALID_GIFT_AMOUNT") || code.includes("GIFT_AMOUNT_BELOW_BOOST_PLAN") || code.includes("BOOST_PLAN_NOT_AVAILABLE") || code.includes("NO_ELIGIBLE_PUBLISHED_POST") || code.includes("BOOST_GIFT_REQUIRES_CREATOR") ? 400 : 400;
    const message =
      code.includes("GIFTS_NOT_INCLUDED_IN_PUBLICATION_PLAN") ? "O plano de publicação vigente deste perfil não inclui o recebimento de presentes." :
      code.includes("CUSTOMER_ACCOUNT_REQUIRED") ? "Para enviar um presente, entre com uma conta de cliente ou habilite o perfil de cliente na sua conta." :
      code.includes("SELF_GIFT_NOT_ALLOWED") ? "Você não pode enviar um presente para o seu próprio perfil." :
      code.includes("RECIPIENT_NOT_FOUND") ? "Este perfil não está disponível para receber presentes no momento." :
      code.includes("GIFT_AMOUNT_BELOW_BOOST_PLAN") ? "O valor do presente precisa ser igual ou superior ao valor mínimo do plano de impulsionamento escolhido." :
      code.includes("NO_ELIGIBLE_PUBLISHED_POST") ? "Este criador não tem uma publicação disponível para impulsionar neste momento." :
      code.includes("BOOST_PLAN_NOT_AVAILABLE") ? "Este plano de impulsionamento não está disponível." :
      code.includes("BOOST_GIFT_REQUIRES_CREATOR") ? "O impulsionamento por presente está disponível apenas para criadores Fans." :
      code.includes("INVALID_GIFT_AMOUNT") ? "Informe um presente entre R$ 5,00 e R$ 10.000,00." :
      "Não foi possível preparar o presente agora. Confira sua conta e tente novamente.";
    return NextResponse.json({ error: message, code: status === 400 ? "GIFT_REQUEST_INVALID" : "GIFT_REQUEST_REJECTED" }, { status });
  }

  return NextResponse.json(data);
}
