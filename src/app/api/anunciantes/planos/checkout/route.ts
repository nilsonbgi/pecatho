import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMercadoPagoPreference } from "@/lib/fans/payments/mercado-pago";

export const dynamic = "force-dynamic";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para contratar um plano de publicação." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const planId = body?.plan_id;
  const profileId = body?.profile_id;
  if (!isUuid(planId) || !isUuid(profileId)) {
    return NextResponse.json({ error: "Selecione um plano e um anúncio válidos." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: plan, error: planError } = await admin.from("publication_plans")
    .select("id,name,price,active,free,audience,duration_days")
    .eq("id", planId).maybeSingle();
  if (planError) return NextResponse.json({ error: "Não foi possível validar o plano de publicação." }, { status: 503 });
  if (!plan || !plan.active) return NextResponse.json({ error: "Este plano não está mais disponível." }, { status: 409 });

  if (plan.free) {
    const { data, error } = await client.rpc("activate_free_pecatho_publication_plan", {
      p_plan_id: planId,
      p_profile_id: profileId,
    });
    if (error || !data) {
      const message = error?.message ?? "";
      const status = message.includes("AUTHENTICATION_REQUIRED") ? 401
        : message.includes("PUBLICATION_PROFILE_NOT_OWNED") ? 403
        : message.includes("PUBLICATION_ALREADY_ACTIVE") ? 409
        : message.includes("PUBLICATION_PLAN_AUDIENCE_MISMATCH") || message.includes("FREE_PUBLICATION_PLAN_UNAVAILABLE") ? 409
        : 503;
      return NextResponse.json({
        error: message.includes("PUBLICATION_ALREADY_ACTIVE")
          ? "Seu anúncio já possui uma publicação vigente. Aguarde o término para ativar novamente um plano gratuito."
          : message.includes("PUBLICATION_PLAN_AUDIENCE_MISMATCH")
            ? "Este plano foi criado para outro tipo de perfil."
            : "Não foi possível ativar o plano gratuito. Confirme se a migration de planos de publicação foi aplicada.",
      }, { status });
    }
    return NextResponse.json({ activated: true, publication: data }, { status: 201 });
  }

  // O RPC valida titularidade e público do plano ao criar o pedido. A retomada
  // de um pedido existente precisa repetir essas verificações no estado atual.
  const { data: profile, error: profileError } = await admin
    .from("advertiser_profiles")
    .select("id,user_id")
    .eq("id", profileId)
    .maybeSingle();
  if (profileError) {
    return NextResponse.json({ error: "Não foi possível validar a titularidade do anúncio." }, { status: 503 });
  }
  if (!profile || profile.user_id !== user.id) {
    return NextResponse.json({ error: "O anúncio não pertence à sua conta." }, { status: 403 });
  }

  const { data: linkedCreator, error: linkedCreatorError } = await admin
    .from("fans_creators")
    .select("id")
    .eq("advertiser_profile_id", profileId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (linkedCreatorError) {
    return NextResponse.json({ error: "Não foi possível validar o tipo de perfil para este plano." }, { status: 503 });
  }
  const expectedAudience = linkedCreator ? "content_seller" : "companion";
  if (plan.audience !== "both" && plan.audience !== expectedAudience) {
    return NextResponse.json({ error: "Este plano foi criado para outro tipo de perfil." }, { status: 409 });
  }

  // Retoma o checkout pendente do mesmo plano/perfil após falha de rede ou retorno ao painel.
  let intent: { order_id: string } | null = null;
  let intentError: { message?: string } | null = null;
  const { data: pendingOrders, error: pendingOrdersError } = await admin.from("orders")
    .select("id,metadata")
    .eq("user_id", user.id)
    .eq("status", "awaiting_payment")
    .contains("metadata", { product_type: "publication_plan", profile_id: profileId })
    .order("created_at", { ascending: false })
    .limit(5);
  if (pendingOrdersError) {
    return NextResponse.json({ error: "Não foi possível verificar uma contratação pendente. Tente novamente." }, { status: 503 });
  }
  const matchingPendingOrder = (pendingOrders ?? []).find((order) => order.metadata?.product_id === planId) ?? null;
  if (matchingPendingOrder) {
    const { data: pendingPayment, error: pendingPaymentError } = await admin.from("payments")
      .select("status,provider_payment_id")
      .eq("order_id", matchingPendingOrder.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pendingPaymentError) {
      return NextResponse.json({ error: "Não foi possível validar o pagamento pendente." }, { status: 503 });
    }
    if (!pendingPayment || pendingPayment.status === "paid" || pendingPayment.provider_payment_id) {
      return NextResponse.json({ error: "Já existe um pagamento desta contratação em processamento. Aguarde a confirmação antes de tentar novamente." }, { status: 409 });
    }
    if (pendingPayment.status !== "pending") {
      return NextResponse.json({ error: "O pagamento anterior não está disponível para retomada. Atualize o painel e verifique o status da contratação." }, { status: 409 });
    }
    intent = { order_id: matchingPendingOrder.id };
  } else {
    const result = await client.rpc("create_pecatho_publication_checkout", {
      p_plan_id: planId,
      p_profile_id: profileId,
    });
    intent = result.data;
    intentError = result.error;
  }
  if (intentError || !intent || typeof intent.order_id !== "string") {
    const message = intentError?.message ?? "";
    const status = message.includes("AUTHENTICATION_REQUIRED") ? 401
      : message.includes("PUBLICATION_PROFILE_NOT_OWNED") ? 403
      : message.includes("PUBLICATION_CHECKOUT_ALREADY_PENDING") || message.includes("PUBLICATION_PLAN_UNAVAILABLE") || message.includes("PUBLICATION_PLAN_AUDIENCE_MISMATCH") ? 409
      : 503;
    return NextResponse.json({
      error: message.includes("PUBLICATION_CHECKOUT_ALREADY_PENDING")
        ? "Já existe um pagamento pendente para este anúncio. Conclua-o antes de iniciar outro."
        : message.includes("PUBLICATION_PLAN_AUDIENCE_MISMATCH")
          ? "Este plano foi criado para outro tipo de perfil."
          : "Não foi possível iniciar a contratação. Confirme se a migration de planos de publicação foi aplicada.",
    }, { status });
  }

  const { data: order, error: orderError } = await admin.from("orders")
    .select("id,order_number,user_id,total,currency,status,metadata")
    .eq("id", intent.order_id).eq("user_id", user.id).maybeSingle();
  const { data: payment, error: paymentError } = await admin.from("payments")
    .select("id,status,provider_payment_id,raw_reference")
    .eq("order_id", intent.order_id).order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (orderError || paymentError || !order || !payment || order.status !== "awaiting_payment" ||
      order.currency !== "BRL" || Number(order.total) <= 0 || payment.status === "paid" || payment.provider_payment_id) {
    return NextResponse.json({ error: "O pedido de publicação não passou pela validação de segurança." }, { status: 409 });
  }

  try {
    const preference = await createMercadoPagoPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      title: typeof order.metadata?.title === "string" ? order.metadata.title : "Plano de publicação Pecatho: " + plan.name,
      amount: Number(order.total),
      buyerEmail: user.email ?? "",
      productType: "publication_plan",
    });
    const checkoutUrl = preference.init_point ?? preference.sandbox_init_point;
    if (!checkoutUrl) return NextResponse.json({ error: "O Mercado Pago não retornou um endereço de checkout." }, { status: 502 });

    const { error: updateError } = await admin.from("payments").update({
      provider: "mercadopago",
      raw_reference: {
        ...(payment.raw_reference && typeof payment.raw_reference === "object" ? payment.raw_reference : {}),
        channel: "pecatho_publication_plan",
        provider: "mercadopago",
        preference_id: preference.id,
        order_id: order.id,
      },
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id);
    if (updateError) return NextResponse.json({ error: "Checkout criado, mas não foi possível registrar a referência do pagamento. Tente novamente pelo painel." }, { status: 502 });

    return NextResponse.json({ checkout_url: checkoutUrl, order_id: order.id, sandbox: !preference.init_point && Boolean(preference.sandbox_init_point) });
  } catch (error) {
    return NextResponse.json({
      error: "Não foi possível criar o checkout no Mercado Pago.",
      detail: error instanceof Error ? error.message : "Erro desconhecido.",
    }, { status: 502 });
  }
}
