import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMercadoPagoPreference } from "@/lib/fans/payments/mercado-pago";

export const dynamic = "force-dynamic";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para gerenciar os planos profissionais." }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: companion }, { data: creator }] = await Promise.all([
    admin.from("advertiser_profiles").select("id,status").eq("user_id", user.id).maybeSingle(),
    admin.from("fans_creators").select("id,status").eq("user_id", user.id).maybeSingle(),
  ]);
  const audiences: string[] = [];
  if (companion) audiences.push("companion");
  if (creator) audiences.push("content_creator");
  if (!audiences.length) return NextResponse.json({ audiences, plans: [], subscriptions: [], profile_status: null, creator_status: null });

  const [{ data: plans, error: plansError }, { data: subscriptions, error: subscriptionsError }] = await Promise.all([
    admin.from("pecatho_customer_premium_plans")
      .select("id,plan_key,name,description,price,currency,duration_days,benefits,active,sort_order,audience,feature_flags,card_style,badge_label")
      .eq("active", true).in("audience", audiences)
      .order("sort_order", { ascending: true }).order("price", { ascending: true }),
    admin.from("pecatho_professional_premium_subscriptions")
      .select("id,plan_id,audience,order_id,status,starts_at,ends_at,paid_amount,currency,created_at,feature_flags,card_style,badge_label,plan_name,duration_days,benefits,plan_description")
      .eq("user_id", user.id).in("status", ["active", "pending"])
      .order("created_at", { ascending: false }).limit(20),
  ]);
  if (plansError || subscriptionsError) {
    console.error("Falha ao consultar planos profissionais:", { plansCode: plansError?.code, subscriptionsCode: subscriptionsError?.code });
    return NextResponse.json({ error: "Não foi possível carregar os planos profissionais. Confirme se a migração de diferenciais Premium foi aplicada." }, { status: 503 });
  }
  const planMap = new Map((plans ?? []).map((plan) => [plan.id, plan]));
  const subscriptionPlanIds = [...new Set((subscriptions ?? []).map((item) => item.plan_id))];
  let historicalPlans: NonNullable<typeof plans> = [];
  if (subscriptionPlanIds.length) {
    const { data } = await admin.from("pecatho_customer_premium_plans")
      .select("id,plan_key,name,description,price,currency,duration_days,benefits,active,sort_order,audience,feature_flags,card_style,badge_label")
      .in("id", subscriptionPlanIds);
    historicalPlans = data ?? [];
  }
  for (const plan of historicalPlans) planMap.set(plan.id, plan);
  const enrichedSubscriptions = (subscriptions ?? []).map((item) => {
    const plan = planMap.get(item.plan_id);
    return {
      ...item,
      plan: plan ? {
        ...plan,
        name: item.plan_name || plan.name,
        price: item.paid_amount,
        duration_days: item.duration_days,
        benefits: item.benefits,
        description: item.plan_description,
        feature_flags: item.feature_flags,
        card_style: item.card_style,
        badge_label: item.badge_label,
      } : null,
    };
  });
  const now = Date.now();
  const current = enrichedSubscriptions.filter((item) =>
    item.status === "active" && item.starts_at && item.ends_at &&
    new Date(item.starts_at).getTime() <= now && new Date(item.ends_at).getTime() > now
  );

  return NextResponse.json({
    audiences,
    profile_status: companion?.status ?? null,
    creator_status: creator?.status ?? null,
    plans: plans ?? [],
    subscriptions: enrichedSubscriptions,
    current,
    server_time: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para contratar um plano profissional." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!isUuid(body?.plan_id)) return NextResponse.json({ error: "Selecione um plano válido." }, { status: 400 });

  const { data: intent, error: intentError } = await client.rpc("create_pecatho_professional_premium_checkout", { p_plan_id: body.plan_id });
  if (intentError || !intent || typeof intent.order_id !== "string") {
    const message = intentError?.message ?? "";
    const status = message.includes("AUTHENTICATION_REQUIRED") ? 401
      : message.includes("ACTIVE_PROFILE_REQUIRED") ? 403
      : message.includes("PROFESSIONAL_PREMIUM_CHECKOUT_PENDING") ? 409
      : message.includes("PROFESSIONAL_PREMIUM_PLAN_UNAVAILABLE") ? 409 : 503;
    const error = message.includes("ACTIVE_PROFILE_REQUIRED")
      ? "Para contratar este plano, publique seu perfil correspondente e mantenha-o ativo."
      : message.includes("PROFESSIONAL_PREMIUM_CHECKOUT_PENDING")
        ? "Você já possui uma contratação deste público aguardando pagamento."
        : message.includes("PROFESSIONAL_PREMIUM_PLAN_UNAVAILABLE")
          ? "Este plano não está mais disponível."
          : "Não foi possível iniciar a contratação. Confirme se a migration de planos profissionais foi aplicada.";
    return NextResponse.json({ error }, { status });
  }

  const admin = createAdminClient();
  const [{ data: order, error: orderError }, { data: payment, error: paymentError }] = await Promise.all([
    admin.from("orders").select("id,order_number,user_id,total,currency,status,metadata").eq("id", intent.order_id).eq("user_id", user.id).maybeSingle(),
    admin.from("payments").select("id,status,provider_payment_id,raw_reference").eq("order_id", intent.order_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (orderError || paymentError || !order || !payment || order.status !== "awaiting_payment" ||
      order.currency !== "BRL" || Number(order.total) <= 0 || payment.status === "paid" || payment.provider_payment_id ||
      order.metadata?.product_type !== "professional_premium_subscription") {
    return NextResponse.json({ error: "O pedido profissional não passou pela validação de segurança." }, { status: 409 });
  }

  try {
    const preference = await createMercadoPagoPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      title: typeof order.metadata?.title === "string" ? order.metadata.title : "Plano profissional Pecatho",
      amount: Number(order.total),
      buyerEmail: user.email ?? "",
      productType: "professional_premium_subscription",
    });
    const checkoutUrl = preference.init_point ?? preference.sandbox_init_point;
    if (!checkoutUrl) return NextResponse.json({ error: "O Mercado Pago não retornou um endereço de checkout." }, { status: 502 });
    const { error: updateError } = await admin.from("payments").update({
      provider: "mercadopago",
      raw_reference: {
        ...(payment.raw_reference && typeof payment.raw_reference === "object" ? payment.raw_reference : {}),
        channel: "pecatho_professional_premium",
        provider: "mercadopago",
        preference_id: preference.id,
        order_id: order.id,
        audience: intent.audience,
        plan_id: intent.plan_id,
      },
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id);
    if (updateError) return NextResponse.json({ error: "Checkout criado, mas não foi possível registrar a referência do pagamento. Tente novamente pelo painel." }, { status: 502 });
    return NextResponse.json({ checkout_url: checkoutUrl, order_id: order.id, sandbox: !preference.init_point && Boolean(preference.sandbox_init_point) });
  } catch (error) {
    console.error("Falha ao criar checkout Premium profissional:", error);
    return NextResponse.json({ error: "Não foi possível criar o checkout no Mercado Pago." }, { status: 502 });
  }
}
