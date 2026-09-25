import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: Request) {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "É necessário estar autenticado para consultar o pedido." }, { status: 401 });

  const orderId = new URL(request.url).searchParams.get("order");
  if (!isUuid(orderId)) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,order_number,user_id,status,total,currency,metadata,created_at,updated_at")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (orderError) return NextResponse.json({ error: "Não foi possível consultar o pedido." }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

  const { data: payment } = await admin
    .from("payments")
    .select("status,provider,provider_payment_id,payment_method,paid_at,updated_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const productType = typeof order.metadata?.product_type === "string" ? order.metadata.product_type : null;
  const productId = typeof order.metadata?.product_id === "string" ? order.metadata.product_id : null;
  let entitlement = { entitled: false, subscription_id: null as string | null, purchase_id: null as string | null, ends_at: null as string | null };

  if (productType === "subscription" && productId) {
    const { data: subscription } = await admin
      .from("fans_subscriptions")
      .select("id,status,starts_at,ends_at")
      .eq("plan_id", productId)
      .eq("subscriber_user_id", user.id)
      .eq("status", "active")
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscription) {
      const now = Date.now();
      const startsAt = subscription.starts_at ? new Date(subscription.starts_at).getTime() : 0;
      const endsAt = subscription.ends_at ? new Date(subscription.ends_at).getTime() : null;
      entitlement = {
        entitled: startsAt <= now && (endsAt === null || endsAt >= now),
        subscription_id: subscription.id,
        purchase_id: null,
        ends_at: subscription.ends_at,
      };
    }
  } else if (productType === "post" && productId) {
    const { data: purchase } = await admin
      .from("fans_purchases")
      .select("id,status,paid_at")
      .eq("post_id", productId)
      .eq("buyer_user_id", user.id)
      .eq("status", "paid")
      .not("paid_at", "is", null)
      .order("paid_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (purchase) {
      entitlement = {
        entitled: true,
        subscription_id: null,
        purchase_id: purchase.id,
        ends_at: null,
      };
    }
  } else if (productType === "digital_content" && productId) {
    const { data: sale } = await admin
      .from("digital_content_sales")
      .select("id,status,paid_at")
      .eq("product_id", productId)
      .eq("buyer_user_id", user.id)
      .eq("status", "paid")
      .not("paid_at", "is", null)
      .order("paid_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sale) {
      entitlement = { entitled: true, subscription_id: null, purchase_id: sale.id, ends_at: null };
    }
  }

  } else if (productType === "profile_media" && productId) {
    const { data: purchase } = await admin
      .from("profile_media_purchases")
      .select("id,status,purchased_at")
      .eq("order_id", order.id)
      .eq("media_id", productId)
      .eq("buyer_user_id", user.id)
      .eq("status", "paid")
      .not("purchased_at", "is", null)
      .order("purchased_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (purchase) {
      entitlement = { entitled: true, subscription_id: null, purchase_id: purchase.id, ends_at: null };
    }
  }

  return NextResponse.json({
    order: {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total: order.total,
      currency: order.currency,
      product_type: productType,
      product_id: productId,
      title: typeof order.metadata?.title === "string" ? order.metadata.title : null,
      updated_at: order.updated_at,
    },
    payment: payment ? {
      status: payment.status,
      provider: payment.provider,
      provider_payment_id: payment.provider_payment_id,
      payment_method: payment.payment_method,
      paid_at: payment.paid_at,
      updated_at: payment.updated_at,
    } : null,
    entitlement,
  });
}
