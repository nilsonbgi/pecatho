import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMercadoPagoPreference } from "@/lib/fans/payments/mercado-pago";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para consultar o Premium." }, { status: 401 });

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [{ data: plans, error: plansError }, { data: subscriptions, error: subscriptionsError }] = await Promise.all([
    admin.from("pecatho_customer_premium_plans")
      .select("id,plan_key,name,description,price,currency,duration_days,benefits,sort_order,audience,feature_flags,card_style,badge_label")
      .eq("audience", "customer").eq("active", true).in("duration_days", [30, 90, 180, 365]).order("sort_order", { ascending: true }).order("price", { ascending: true }),
    admin.from("pecatho_customer_premium_subscriptions")
      .select("id,plan_id,order_id,status,starts_at,ends_at,paid_amount,currency,created_at")
      .eq("user_id", user.id).in("status", ["active", "pending"])
      .order("created_at", { ascending: false }).limit(10),
  ]);

  if (plansError || subscriptionsError) {
    return NextResponse.json({ error: "Não foi possível carregar os dados do Premium. Confirme se a migração de banco foi aplicada." }, { status: 503 });
  }

  const current = (subscriptions ?? []).find((item) =>
    item.status === "active" && item.starts_at && item.ends_at &&
    new Date(item.starts_at).getTime() <= Date.now() && new Date(item.ends_at).getTime() > Date.now()
  ) ?? null;

  return NextResponse.json({
    plans: plans ?? [],
    subscriptions: subscriptions ?? [],
    current,
    server_time: now,
  });
}

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para contratar o Premium." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const planId = body?.plan_id;
  const creatorId = body?.creator_id;
  if (typeof planId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(planId)) {
    return NextResponse.json({ error: "Selecione um plano Premium válido." }, { status: 400 });
  }
  if (creatorId !== undefined && (typeof creatorId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(creatorId))) {
    return NextResponse.json({ error: "Origem do perfil inválida. Abra novamente o perfil do vendedor." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (typeof creatorId === "string") {
    const { data: creator, error: creatorError } = await admin.from("fans_creators")
      .select("id,status,user_id").eq("id", creatorId).eq("status", "active").maybeSingle();
    if (creatorError || !creator || creator.user_id === user.id) {
      return NextResponse.json({ error: "Não foi possível validar a origem desta contratação Premium." }, { status: 409 });
    }
  }
  const { data: intent, error: intentError } = await client.rpc("create_pecatho_customer_premium_checkout", {
    p_plan_id: planId,
    p_creator_id: typeof creatorId === "string" ? creatorId : null,
  });
  if (intentError || !intent || typeof intent.order_id !== "string") {
    const message = intentError?.message ?? "";
    const customerRequired = message.includes("CUSTOMER_ACCOUNT_REQUIRED");
    const unavailable = message.includes("PREMIUM_PLAN_UNAVAILABLE");
    const invalidAttribution = message.includes("PREMIUM_ATTRIBUTION_CREATOR_INVALID");
    return NextResponse.json({
      error: customerRequired
        ? "O Premium está disponível para contas de cliente."
        : unavailable
          ? "Este plano não está mais disponível."
          : invalidAttribution
            ? "O perfil de origem não está mais disponível para atribuição."
            : "Não foi possível iniciar a contratação. Confirme se a migration de atribuição Premium foi aplicada.",
    }, { status: customerRequired ? 403 : unavailable || invalidAttribution ? 409 : 503 });
  }

  const { data: order, error: orderError } = await admin
    .from("orders").select("id,order_number,user_id,total,currency,status,metadata")
    .eq("id", intent.order_id).eq("user_id", user.id).maybeSingle();
  const { data: payment, error: paymentError } = await admin
    .from("payments").select("id,status,provider_payment_id,raw_reference")
    .eq("order_id", intent.order_id).order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (orderError || paymentError || !order || !payment || order.status !== "awaiting_payment" ||
      order.currency !== "BRL" || Number(order.total) <= 0 || payment.status === "paid" || payment.provider_payment_id) {
    return NextResponse.json({ error: "O pedido Premium não passou pela validação de segurança." }, { status: 409 });
  }

  try {
    const preference = await createMercadoPagoPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      title: typeof order.metadata?.title === "string" ? order.metadata.title : "Assinatura Pecatho Premium",
      amount: Number(order.total),
      buyerEmail: user.email ?? "",
      productType: "premium_subscription",
    });
    const checkoutUrl = preference.init_point ?? preference.sandbox_init_point;
    if (!checkoutUrl) return NextResponse.json({ error: "O Mercado Pago não retornou um endereço de checkout." }, { status: 502 });

    const { error: updateError } = await admin.from("payments").update({
      provider: "mercadopago",
      raw_reference: {
        ...(payment.raw_reference && typeof payment.raw_reference === "object" ? payment.raw_reference : {}),
        channel: "pecatho_customer_premium",
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
