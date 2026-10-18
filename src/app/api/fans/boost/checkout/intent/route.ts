import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta de criador para impulsionar uma publicação." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const postId = body?.post_id;
  const planId = body?.plan_id;
  if (!isUuid(postId) || !isUuid(planId)) {
    return NextResponse.json({ error: "Selecione uma publicação e um plano de impulsionamento válidos." }, { status: 400 });
  }

  const { data, error } = await client.rpc("create_fans_boost_checkout_intent", {
    p_post_id: postId,
    p_plan_id: planId,
  });
  if (error || !data) {
    const message = error?.message ?? "Não foi possível preparar o pagamento do impulsionamento.";
    const status = message.includes("AUTH_REQUIRED") ? 401
      : message.includes("PUBLISHED_OWN_POST_REQUIRED") || message.includes("ACTIVE_CREATOR_REQUIRED") ? 403
      : message.includes("BOOST_PLAN_NOT_AVAILABLE") || message.includes("POST_ALREADY_BOOSTED") ? 409
      : message.includes("BOOST_DETAILS_REQUIRED") ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({
    order: {
      id: data.order_id,
      number: data.order_number,
      amount: data.amount,
      currency: data.currency,
      status: "awaiting_payment",
    },
    boost: {
      post_id: data.post_id,
      plan_id: data.plan_id,
      duration_hours: data.duration_hours,
      multiplier: data.multiplier,
      status: "awaiting_payment",
    },
    message: "Pedido criado. O impulsionamento só será ativado após a confirmação oficial do pagamento pelo Mercado Pago.",
  }, { status: 201 });
}
