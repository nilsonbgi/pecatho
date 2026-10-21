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

  const rawBody = await request.text();
  if (rawBody.length > 64 * 1024) {
    return NextResponse.json({ error: "Payload excede o limite permitido." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Notificação inválida." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Notificação inválida." }, { status: 400 });
  }

  const notification = body as Record<string, unknown>;
  const notificationData = notification.data;
  const type = notification.type ?? notification.action;
  const paymentId = notificationData && typeof notificationData === "object" && !Array.isArray(notificationData)
    ? (notificationData as Record<string, unknown>).id
    : undefined;
  if (type !== "payment" || (typeof paymentId !== "string" && typeof paymentId !== "number") || !String(paymentId).trim()) {
    return NextResponse.json({ ok: true, ignored: true });
  }

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
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ error: "Não foi possível consultar o pagamento no provedor." }, { status: 502 });

  const payment = await response.json().catch(() => null);
  if (!payment || typeof payment !== "object" || Array.isArray(payment)) {
    return NextResponse.json({ error: "Resposta inválida do provedor de pagamento." }, { status: 502 });
  }

  const orderId = payment.external_reference;
  if (typeof orderId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    return NextResponse.json({ error: "Pagamento sem referência Pecatho válida." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,user_id,total,currency,status,metadata")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError) {
    console.error("Falha ao consultar pedido para conciliação Mercado Pago:", orderError);
    return NextResponse.json({ error: "Não foi possível validar o pedido Pecatho." }, { status: 500 });
  }
  if (!order) return NextResponse.json({ error: "Pedido Pecatho não encontrado." }, { status: 404 });
  if (order.currency !== "BRL" || !Number.isFinite(Number(payment.transaction_amount)) || Math.abs(Number(order.total) - Number(payment.transaction_amount)) > 0.01) {
    return NextResponse.json({ error: "Valor ou moeda do pagamento não correspondem ao pedido." }, { status: 409 });
  }
  if (payment.status === "approved" && payment.currency_id !== "BRL") {
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
  const status = typeof payment.status === "string" ? statusMap[payment.status] ?? "pending" : "pending";
  const providerFee = Array.isArray(payment.fee_details)
    ? payment.fee_details.reduce((sum: number, item: { amount?: number | string }) => {
        const amount = Number(item?.amount ?? 0);
        return sum + (Number.isFinite(amount) ? Math.max(amount, 0) : 0);
      }, 0)
    : 0;
  const paymentMethod = typeof payment.payment_method_id === "string" ? payment.payment_method_id : null;

  const productType = order.metadata?.product_type;
  const settlementFunction = productType === "premium_subscription"
    ? "settle_pecatho_customer_premium_checkout"
    : productType === "publication_plan"
      ? "settle_pecatho_publication_checkout"
      : productType === "digital_content"
      ? "settle_digital_content_checkout"
      : productType === "profile_media"
        ? "settle_profile_media_checkout"
        : productType === "gift"
          ? "settle_pecatho_gift_checkout"
          : "settle_fans_checkout";

  const { data, error } = await admin.rpc(settlementFunction, {
    p_order_id: orderId,
    p_provider: "mercadopago",
    p_provider_payment_id: String(paymentId),
    p_payment_status: status,
    p_payment_method: paymentMethod,
    p_provider_fee: providerFee,
  });

  if (error) {
    console.error("Falha na conciliação Mercado Pago:", { orderId, paymentId: String(paymentId), code: error.code });
    return NextResponse.json({ error: "Não foi possível conciliar o pagamento." }, { status: 500 });
  }

  // O endpoint de pagamento não garante um campo acumulado de reembolso em todas as respostas.
  // Consultamos a lista oficial de reembolsos e somamos somente os efetivamente aprovados.
  // Se a consulta falhar, devolvemos erro para que o webhook possa ser reenviado, sem
  // marcar silenciosamente um reembolso como conciliado quando o total é desconhecido.
  if (status === "paid" || status === "refunded") {
    const refundsResponse = await fetch(
      "https://api.mercadopago.com/v1/payments/" + encodeURIComponent(String(paymentId)) + "/refunds",
      {
        headers: { Authorization: "Bearer " + accessToken },
        cache: "no-store",
      },
    );

    if (!refundsResponse.ok) {
      console.error("Falha ao consultar reembolsos Mercado Pago:", {
        orderId,
        paymentId: String(paymentId),
        status: refundsResponse.status,
      });
      return NextResponse.json(
        { error: "Pagamento conciliado, mas não foi possível confirmar os reembolsos. A notificação precisa ser reenviada." },
        { status: 502 },
      );
    }

    const refundsPayload: unknown = await refundsResponse.json().catch(() => null);
    const refunds = Array.isArray(refundsPayload)
      ? refundsPayload
      : refundsPayload && typeof refundsPayload === "object" &&
          Array.isArray((refundsPayload as Record<string, unknown>).results)
        ? (refundsPayload as { results: unknown[] }).results
        : null;

    if (!refunds) {
      console.error("Resposta inesperada ao consultar reembolsos Mercado Pago:", {
        orderId,
        paymentId: String(paymentId),
      });
      return NextResponse.json(
        { error: "Resposta de reembolsos inválida. A conciliação precisa ser repetida." },
        { status: 502 },
      );
    }

    const refundedAmount = refunds.reduce((sum: number, refund: unknown) => {
      if (!refund || typeof refund !== "object" || Array.isArray(refund)) return sum;
      const item = refund as Record<string, unknown>;
      const refundStatus = typeof item.status === "string" ? item.status.toLowerCase() : "";
      if (!["approved", "processed", "accredited"].includes(refundStatus)) return sum;
      const amount = Number(item.amount);
      return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
    }, 0);

    const transactionAmount = Number(payment.transaction_amount);
    // O estado terminal "refunded" do pagamento é confirmação do reembolso integral,
    // mesmo se a lista de reembolsos ainda estiver temporariamente vazia/incompleta.
    const normalizedRefundedAmount = status === "refunded"
      ? transactionAmount
      : Math.min(Math.max(Math.round(refundedAmount * 100) / 100, 0), transactionAmount);

    if (normalizedRefundedAmount > 0) {
      const { data: storedPayment, error: storedPaymentError } = await admin
        .from("payments")
        .select("id,amount,refunded_amount,status")
        .eq("order_id", orderId)
        .eq("provider", "mercadopago")
        .eq("provider_payment_id", String(paymentId))
        .maybeSingle();

      if (storedPaymentError || !storedPayment) {
        console.error("Pagamento conciliado, mas não foi possível localizar o registro para registrar o reembolso:", {
          orderId,
          paymentId: String(paymentId),
          code: storedPaymentError?.code,
        });
        return NextResponse.json(
          { error: "Pagamento conciliado, mas o reembolso precisa de nova conciliação." },
          { status: 500 },
        );
      }

      if (Math.abs(Number(storedPayment.amount) - transactionAmount) > 0.01) {
        return NextResponse.json(
          { error: "O valor reembolsado não corresponde ao pagamento registrado." },
          { status: 409 },
        );
      }

      const fullRefund = normalizedRefundedAmount >= transactionAmount;
      const currentRefundedAmount = Number(storedPayment.refunded_amount ?? 0);
      const currentStatus = storedPayment.status;
      const refundStateAlreadyMatches =
        Math.abs(currentRefundedAmount - normalizedRefundedAmount) < 0.005 &&
        currentStatus === (fullRefund ? "refunded" : "partially_refunded");

      if (!refundStateAlreadyMatches) {
        if (fullRefund) {
          // A liquidação normal também precisa atualizar pedido/assinatura e executar
          // os estornos dos demais livros financeiros, não apenas o registro payments.
          const { error: fullRefundSettlementError } = await admin.rpc(settlementFunction, {
            p_order_id: orderId,
            p_provider: "mercadopago",
            p_provider_payment_id: String(paymentId),
            p_payment_status: "refunded",
            p_payment_method: paymentMethod,
            p_provider_fee: providerFee,
          });

          if (fullRefundSettlementError) {
            console.error("Falha na liquidação do reembolso integral Mercado Pago:", {
              orderId,
              paymentId: String(paymentId),
              code: fullRefundSettlementError.code,
            });
            return NextResponse.json(
              { error: "Reembolso integral identificado, mas a liquidação precisa ser repetida." },
              { status: 500 },
            );
          }
        }

        const { error: refundUpdateError } = await admin
          .from("payments")
          .update({
            status: fullRefund ? "refunded" : "partially_refunded",
            refunded_amount: normalizedRefundedAmount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", storedPayment.id);

        if (refundUpdateError) {
          console.error("Falha ao registrar reembolso Mercado Pago:", {
            orderId,
            paymentId: String(paymentId),
            code: refundUpdateError.code,
          });
          return NextResponse.json(
            { error: "Pagamento conciliado, mas o reembolso precisa de nova conciliação." },
            { status: 500 },
          );
        }
      }
    }
  }

  return NextResponse.json(data);
}
