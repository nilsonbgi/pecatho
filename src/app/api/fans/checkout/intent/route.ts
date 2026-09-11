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
  const postId = body?.post_id;
  const planId = body?.plan_id;
  const renewal = body?.renewal === true;

  if ((postId && planId) || (!postId && !planId)) {
    return NextResponse.json({ error: "Informe uma publicação ou um plano, mas não ambos." }, { status: 400 });
  }
  if ((postId && !isUuid(postId)) || (planId && !isUuid(planId))) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }
  if (renewal && !planId) {
    return NextResponse.json({ error: "A renovação exige um plano." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_fans_checkout_intent", {
    p_kind: planId ? "subscription" : "post",
    p_post_id: postId ?? null,
    p_plan_id: planId ?? null,
    p_renewal: renewal,
  });

  if (error || !data) {
    const message = error?.message ?? "Não foi possível criar a intenção de pagamento.";
    const status = message.includes("AUTH_REQUIRED") ? 401
      : message.includes("ALREADY_SUBSCRIBED") || message.includes("CHECKOUT_ALREADY_PENDING") ? 409
      : message.includes("SUBSCRIPTION_NOT_FOUND") ? 404
      : message.includes("PLAN_NOT_AVAILABLE") || message.includes("POST_NOT_AVAILABLE") ? 404
      : 500;
    return NextResponse.json({ error: message }, { status });
  }

  const result = data as Record<string, unknown>;
  return NextResponse.json({
    order: {
      id: result.order_id,
      order_number: result.order_number,
      status: "awaiting_payment",
      total: result.amount,
      currency: result.currency,
    },
    checkout: {
      product_type: result.product_type,
      product_id: result.product_id,
      post_id: result.post_id,
      plan_id: result.plan_id,
      renewal: result.renewal === true,
      requires_provider_confirmation: true,
      message: "Intenção criada. Nenhum acesso ou assinatura foi liberado. A confirmação dependerá do provedor de pagamento e do webhook oficial.",
    },
  }, { status: 201 });
}
