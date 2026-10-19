import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
    new TextEncoder().encode(rawBody)
  );
  const actual = signature.replace(/^sha256=/i, "").trim().toLowerCase();
  const hex = Array.from(new Uint8Array(expected), b => b.toString(16).padStart(2, "0")).join("");
  if (!/^[0-9a-f]{64}$/.test(actual) || actual.length !== hex.length) return false;
  let difference = 0;
  for (let i = 0; i < hex.length; i++) difference |= hex.charCodeAt(i) ^ actual.charCodeAt(i);
  return difference === 0;
}

export async function POST(request: Request) {
  const secret = process.env.FANS_PAYMENT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });

  const rawBody = await request.text();
  if (rawBody.length > 64 * 1024) {
    return NextResponse.json({ error: "Payload excede o limite permitido." }, { status: 413 });
  }
  if (!(await verifySignature(rawBody, request.headers.get("x-pecatho-signature"), secret))) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  const orderId = payload.order_id;
  const provider = typeof payload.provider === "string" ? payload.provider.trim().toLowerCase() : "";
  const providerPaymentId = typeof payload.provider_payment_id === "string" ? payload.provider_payment_id.trim() : "";
  const status = payload.status;
  const paymentMethod = typeof payload.payment_method === "string" ? payload.payment_method.trim().slice(0, 80) || null : null;
  const providerFee = Number(payload.provider_fee ?? 0);

  if (typeof orderId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId) ||
      !["mercadopago"].includes(provider) || !providerPaymentId || providerPaymentId.length > 200 ||
      !Number.isFinite(providerFee) || providerFee < 0 ||
      typeof status !== "string" || !["pending","authorized","paid","failed","cancelled","refunded","partially_refunded","chargeback"].includes(status)) {
    return NextResponse.json({ error: "Payload de pagamento inválido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: orderMeta, error: orderMetaError } = await admin.from("orders").select("metadata").eq("id", orderId).maybeSingle();
  if (orderMetaError) {
    console.error("Falha ao consultar pedido no webhook de pagamento:", { orderId, code: orderMetaError.code });
    return NextResponse.json({ error: "Não foi possível validar o pedido." }, { status: 500 });
  }
  if (!orderMeta) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  const productType = orderMeta.metadata?.product_type;
  const settlementRpc =
    productType === "gift"
      ? "settle_pecatho_gift_checkout"
      : productType === "live_extension"
        ? "settle_fans_live_extension_checkout"
        : "settle_fans_checkout";
  const { data, error } = await admin.rpc(settlementRpc, {
    p_order_id: orderId,
    p_provider: provider,
    p_provider_payment_id: providerPaymentId,
    p_payment_status: status,
    p_payment_method: paymentMethod,
    p_provider_fee: providerFee,
  });

  if (error) {
    console.error("Falha na liquidação do webhook de pagamento:", { orderId, providerPaymentId, code: error.code });
    return NextResponse.json({ error: "Não foi possível processar a confirmação do pagamento." }, { status: 500 });
  }

  return NextResponse.json(data);
}
