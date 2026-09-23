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
  const actual = signature.replace(/^sha256=/i, "").trim();
  const hex = Array.from(new Uint8Array(expected), b => b.toString(16).padStart(2, "0")).join("");
  return actual.length === hex.length && actual === hex;
}

export async function POST(request: Request) {
  const secret = process.env.FANS_PAYMENT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });

  const rawBody = await request.text();
  if (!(await verifySignature(rawBody, request.headers.get("x-pecatho-signature"), secret))) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const orderId = body?.order_id;
  const provider = typeof body?.provider === "string" ? body.provider.trim() : "";
  const providerPaymentId = typeof body?.provider_payment_id === "string" ? body.provider_payment_id.trim() : "";
  const status = body?.status;
  const paymentMethod = typeof body?.payment_method === "string" ? body.payment_method.trim() : null;
  const providerFee = Number(body?.provider_fee ?? 0);

  if (!orderId || !provider || !providerPaymentId || !Number.isFinite(providerFee) || providerFee < 0 || !["pending","authorized","paid","failed","cancelled","refunded","partially_refunded","chargeback"].includes(status)) {
    return NextResponse.json({ error: "Payload de pagamento inválido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: orderMeta } = await admin.from("orders").select("metadata").eq("id", orderId).maybeSingle();
  const settlementRpc = orderMeta?.metadata?.product_type === "live_extension" ? "settle_fans_live_extension_checkout" : "settle_fans_checkout";
  const { data, error } = await admin.rpc(settlementRpc, {
    p_order_id: orderId,
    p_provider: provider,
    p_provider_payment_id: providerPaymentId,
    p_payment_status: status,
    p_payment_method: paymentMethod,
    p_provider_fee: providerFee,
  });

  if (error) {
    return NextResponse.json({ error: "Não foi possível processar a confirmação do pagamento." }, { status: 500 });
  }

  return NextResponse.json(data);
}
