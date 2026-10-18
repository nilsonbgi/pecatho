import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMercadoPagoPreference } from "@/lib/fans/payments/mercado-pago";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

function isMercadoPagoCheckoutUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" &&
      (host === "mercadopago.com.br" ||
        host.endsWith(".mercadopago.com.br") ||
        host === "mercadopago.com" ||
        host.endsWith(".mercadopago.com"));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "É necessário estar autenticado para continuar." }, { status: 401, headers: noStoreHeaders });
  }

  const body = await request.json().catch(() => null);
  const orderId = body?.order_id;
  if (typeof orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400, headers: noStoreHeaders });
  }

  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,order_number,user_id,total,currency,status,metadata")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (orderError) {
    console.error("Falha ao consultar pedido para checkout de conteúdo:", orderError);
    return NextResponse.json({ error: "Não foi possível validar o pedido neste momento." }, { status: 500, headers: noStoreHeaders });
  }
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404, headers: noStoreHeaders });
  if (order.status !== "awaiting_payment") {
    return NextResponse.json({ error: "Este pedido não está aguardando pagamento." }, { status: 409, headers: noStoreHeaders });
  }
  if (order.currency !== "BRL" || !Number.isFinite(Number(order.total)) || Number(order.total) <= 0) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 409, headers: noStoreHeaders });
  }

  const productType = order.metadata?.product_type;
  if (productType !== "digital_content" && productType !== "profile_media") {
    return NextResponse.json({ error: "Pedido não é de conteúdo comercial suportado." }, { status: 409, headers: noStoreHeaders });
  }

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("id,status,provider,provider_payment_id,raw_reference")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError) {
    console.error("Falha ao consultar pagamento para checkout de conteúdo:", paymentError);
    return NextResponse.json({ error: "Não foi possível validar o pagamento neste momento." }, { status: 500, headers: noStoreHeaders });
  }
  if (!payment) return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 409, headers: noStoreHeaders });
  if (payment.status === "paid") return NextResponse.json({ error: "Este pedido já foi pago." }, { status: 409, headers: noStoreHeaders });
  if (payment.provider_payment_id) {
    return NextResponse.json({ error: "Este pedido já possui transação no provedor." }, { status: 409, headers: noStoreHeaders });
  }

  const rawReference =
    payment.raw_reference && typeof payment.raw_reference === "object" && !Array.isArray(payment.raw_reference)
      ? payment.raw_reference as Record<string, unknown>
      : {};
  if (
    payment.provider === "mercadopago" &&
    typeof rawReference.preference_id === "string" &&
    rawReference.preference_id.length > 0 &&
    isMercadoPagoCheckoutUrl(rawReference.checkout_url)
  ) {
    return NextResponse.json({
      provider: "mercadopago",
      preference_id: rawReference.preference_id,
      checkout_url: rawReference.checkout_url,
      sandbox: rawReference.sandbox === true,
      reused: true,
    }, { headers: noStoreHeaders });
  }

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

    const checkoutUrl = preference.init_point ?? preference.sandbox_init_point ?? null;
    if (typeof preference.id !== "string" || !preference.id || !isMercadoPagoCheckoutUrl(checkoutUrl)) {
      console.error("Mercado Pago retornou preferência sem identificador ou URL de checkout válida.", {
        orderId: order.id,
        hasPreferenceId: typeof preference.id === "string" && Boolean(preference.id),
        hasCheckoutUrl: Boolean(checkoutUrl),
      });
      return NextResponse.json({ error: "O provedor não retornou um checkout válido. Tente novamente." }, { status: 502, headers: noStoreHeaders });
    }

    const { error: updateError } = await admin.from("payments").update({
      provider: "mercadopago",
      raw_reference: {
        ...rawReference,
        channel: productType === "profile_media" ? "pecatho_profile_media" : "pecatho_digital_content",
        provider: "mercadopago",
        preference_id: preference.id,
        checkout_url: checkoutUrl,
        sandbox: !preference.init_point && Boolean(preference.sandbox_init_point),
        order_id: order.id,
      },
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id);

    if (updateError) {
      console.error("Falha ao persistir a preferência do Mercado Pago:", updateError);
      return NextResponse.json({ error: "O checkout foi preparado, mas não foi possível registrar o pagamento. Atualize a página antes de tentar novamente." }, { status: 502, headers: noStoreHeaders });
    }

    return NextResponse.json({
      provider: "mercadopago",
      preference_id: preference.id,
      checkout_url: checkoutUrl,
      sandbox: !preference.init_point && Boolean(preference.sandbox_init_point),
    }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Falha ao criar checkout no Mercado Pago para conteúdo:", error);
    return NextResponse.json({ error: "Não foi possível criar o checkout no provedor. Tente novamente." }, { status: 502, headers: noStoreHeaders });
  }
}
