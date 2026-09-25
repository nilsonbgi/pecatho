import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMercadoPagoPreference } from "@/lib/fans/payments/mercado-pago";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "É necessário estar autenticado para continuar." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const orderId = body?.order_id;
  if (typeof orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id,order_number,user_id,total,currency,status,metadata").eq("id", orderId).eq("user_id", user.id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  if (order.status !== "awaiting_payment") return NextResponse.json({ error: "Este pedido não está aguardando pagamento." }, { status: 409 });
  if (order.currency !== "BRL" || Number(order.total) <= 0) return NextResponse.json({ error: "Pedido inválido." }, { status: 409 });

  const productType = order.metadata?.product_type;
  if (productType !== "digital_content" && productType !== "profile_media") {
    return NextResponse.json({ error: "Pedido não é de conteúdo comercial suportado." }, { status: 409 });
  }

  const { data: payment } = await admin.from("payments").select("id,status,provider,provider_payment_id,raw_reference").eq("order_id", order.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!payment) return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 409 });
  if (payment.status === "paid") return NextResponse.json({ error: "Este pedido já foi pago." }, { status: 409 });
  if (payment.provider_payment_id) return NextResponse.json({ error: "Este pedido já possui transação no provedor." }, { status: 409 });

  try {
    const preference = await createMercadoPagoPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      title: typeof order.metadata?.title === "string"
        ? order.metadata.title
        : productType === "profile_media"
          ? "Conteúdo exclusivo do perfil"
          : "Conteúdo digital Pecatho",
      amount: Number(order.total),
      buyerEmail: user.email ?? "",
      productType,
    });

    await admin.from("payments").update({
      provider: "mercadopago",
      raw_reference: {
        ...(payment.raw_reference && typeof payment.raw_reference === "object" ? payment.raw_reference : {}),
        channel: productType === "profile_media" ? "pecatho_profile_media" : "pecatho_digital_content",
        provider: "mercadopago",
        preference_id: preference.id,
        order_id: order.id,
      },
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id);

    return NextResponse.json({
      provider: "mercadopago",
      preference_id: preference.id,
      checkout_url: preference.init_point ?? preference.sandbox_init_point ?? null,
      sandbox: !preference.init_point && Boolean(preference.sandbox_init_point),
    });
  } catch (error) {
    return NextResponse.json({
      error: "Não foi possível criar o checkout no provedor.",
      detail: error instanceof Error ? error.message : "Erro desconhecido.",
    }, { status: 502 });
  }
}
