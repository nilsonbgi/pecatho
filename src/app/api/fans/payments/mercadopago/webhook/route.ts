import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!secret || !accessToken) return NextResponse.json({ error: "Mercado Pago não configurado." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const type = body?.type ?? body?.action;
  const paymentId = body?.data?.id;
  if (type !== "payment" || !paymentId) return NextResponse.json({ ok: true, ignored: true });

  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(xSignature.split(",").map((p) => p.trim().split("=", 2)).filter(([k,v]) => k && v));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !xRequestId) return NextResponse.json({ error: "Assinatura ausente." }, { status: 401 });
  const timestamp = Number(ts);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp * 1000) > 5 * 60 * 1000) {
    return NextResponse.json({ error: "Assinatura expirada." }, { status: 401 });
  }

  const manifest = "id:" + paymentId + ";request-id:" + xRequestId + ";ts:" + ts + ";";
  const expected = await hmacHex(secret, manifest);
  if (!constantTimeEqual(v1.toLowerCase(), expected.toLowerCase())) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  const response = await fetch("https://api.mercadopago.com/v1/payments/" + encodeURIComponent(String(paymentId)), {
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (!response.ok) return NextResponse.json({ error: "Não foi possível consultar o pagamento no provedor." }, { status: 502 });

  const payment = await response.json();
  const orderId = payment?.external_reference;
  if (typeof orderId !== "string") return NextResponse.json({ error: "Pagamento sem referência Pecatho." }, { status: 422 });

  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,user_id,total,currency,status,metadata")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order) return NextResponse.json({ error: "Pedido Pecatho não encontrado." }, { status: 404 });
  if (order.currency !== "BRL" || Math.abs(Number(order.total) - Number(payment?.transaction_amount)) > 0.01) {
    return NextResponse.json({ error: "Valor ou moeda do pagamento não correspondem ao pedido." }, { status: 409 });
  }
  if (payment?.status === "approved" && payment?.currency_id !== "BRL") {
    return NextResponse.json({ error: "Moeda do pagamento inválida." }, { status: 409 });
  }

  const statusMap: Record<string,string> = {
    approved: "paid",
    pending: "pending",
    in_process: "pending",
    authorized: "authorized",
    rejected: "failed",
    cancelled: "cancelled",
    refunded: "refunded",
    charged_back: "chargeback",
  };
  const status = statusMap[payment?.status] ?? "pending";
  const providerFee = Array.isArray(payment?.fee_details)
    ? payment.fee_details.reduce((sum: number, item: { amount?: number|string }) => sum + Math.max(Number(item.amount ?? 0), 0), 0)
    : 0;
  const paymentMethod = typeof payment?.payment_method_id === "string" ? payment.payment_method_id : null;

  const { data, error } = await admin.rpc("settle_fans_checkout", {
    p_order_id: orderId,
    p_provider: "mercadopago",
    p_provider_payment_id: String(paymentId),
    p_payment_status: status,
    p_payment_method: paymentMethod,
    p_provider_fee: providerFee,
  });

  if (error) return NextResponse.json({ error: "Não foi possível conciliar o pagamento.", detail: error.message }, { status: 500 });
  return NextResponse.json(data);
}
