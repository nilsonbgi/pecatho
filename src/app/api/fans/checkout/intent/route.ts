import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function money(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

export async function POST(request: Request) {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "É necessário estar autenticado para continuar." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const postId = body?.post_id;
  const planId = body?.plan_id;

  if ((postId && planId) || (!postId && !planId)) {
    return NextResponse.json({ error: "Informe uma publicação ou um plano, mas não ambos." }, { status: 400 });
  }
  if ((postId && !isUuid(postId)) || (planId && !isUuid(planId))) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const admin = createAdminClient();

  let creatorId: string;
  let amount: number;
  let productType: "post" | "subscription";
  let productId: string;
  let productTitle: string;

  if (postId) {
    const { data: post, error } = await admin
      .from("fans_posts")
      .select("id,creator_id,title,price,currency,access_type,status")
      .eq("id", postId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: "Não foi possível validar a publicação." }, { status: 500 });
    if (!post || post.status !== "published") {
      return NextResponse.json({ error: "Esta publicação não está disponível para compra." }, { status: 404 });
    }
    if (post.access_type !== "paid" || Number(post.price) <= 0) {
      return NextResponse.json({ error: "Esta publicação não possui uma compra avulsa disponível." }, { status: 409 });
    }

    creatorId = post.creator_id;
    amount = money(post.price);
    productType = "post";
    productId = post.id;
    productTitle = post.title;
  } else {
    const { data: plan, error } = await admin
      .from("fans_plans")
      .select("id,creator_id,name,price,currency,status,duration_days")
      .eq("id", planId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: "Não foi possível validar o plano." }, { status: 500 });
    if (!plan || plan.status !== "active" || Number(plan.price) <= 0) {
      return NextResponse.json({ error: "Este plano não está disponível para assinatura." }, { status: 404 });
    }

    creatorId = plan.creator_id;
    amount = money(plan.price);
    productType = "subscription";
    productId = plan.id;
    productTitle = plan.name;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "O valor do produto é inválido." }, { status: 409 });
  }

  const { data: creator } = await admin
    .from("fans_creators")
    .select("id,user_id,status")
    .eq("id", creatorId)
    .maybeSingle();

  if (!creator || creator.status !== "active") {
    return NextResponse.json({ error: "O criador não está disponível." }, { status: 409 });
  }

  if (creator.user_id === user.id) {
    return NextResponse.json({ error: "Você não pode comprar seu próprio conteúdo." }, { status: 409 });
  }

  if (productType === "post") {
    const { data: existing } = await admin
      .from("fans_purchases")
      .select("id,status")
      .eq("buyer_user_id", user.id)
      .eq("post_id", productId)
      .in("status", ["pending", "paid"])
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        error: existing.status === "paid" ? "Você já possui acesso a esta publicação." : "Já existe uma compra aguardando pagamento.",
        purchase_id: existing.id,
      }, { status: 409 });
    }
  } else {
    const { data: existing } = await admin
      .from("fans_subscriptions")
      .select("id,status")
      .eq("subscriber_user_id", user.id)
      .eq("plan_id", productId)
      .in("status", ["pending", "active"])
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        error: existing.status === "active" ? "Você já possui uma assinatura ativa deste plano." : "Já existe uma assinatura aguardando pagamento.",
        subscription_id: existing.id,
      }, { status: 409 });
    }
  }

  const orderNumber = `FAN-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      profile_id: creator.advertiser_profile_id ?? null,
      plan_id: productType === "subscription" ? productId : null,
      status: "awaiting_payment",
      subtotal: amount,
      discount: 0,
      fee: 0,
      total: amount,
      currency: "BRL",
      metadata: {
        channel: "pecatho_fans",
        product_type: productType,
        product_id: productId,
        creator_id: creatorId,
        title: productTitle,
      },
    })
    .select("id,order_number,status,total,currency")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Não foi possível criar a intenção de pagamento.", detail: orderError?.message }, { status: 500 });
  }

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .insert({
      order_id: order.id,
      user_id: user.id,
      provider: "pending",
      amount,
      currency: "BRL",
      status: "pending",
      raw_reference: {
        channel: "pecatho_fans",
        product_type: productType,
        product_id: productId,
        creator_id: creatorId,
      },
    })
    .select("id,status,amount,currency")
    .single();

  if (paymentError || !payment) {
    await admin.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "Não foi possível registrar a intenção de pagamento." }, { status: 500 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total: order.total,
      currency: order.currency,
    },
    payment: {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    },
    checkout: {
      product_type: productType,
      product_id: productId,
      requires_provider_confirmation: true,
      message: "Intenção criada. Nenhum acesso ou assinatura foi liberado. A confirmação dependerá do provedor de pagamento e do webhook oficial.",
    },
  }, { status: 201 });
}
