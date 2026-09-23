import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function refundMercadoPago(paymentId: string, orderId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Mercado Pago não configurado.");

  const response = await fetch(
    "https://api.mercadopago.com/v1/payments/" + encodeURIComponent(paymentId) + "/refunds",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
        "X-Idempotency-Key": "pecatho-live-refund-" + orderId,
      },
      body: "{}",
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload?.message === "string"
      ? payload.message
      : "O provedor não confirmou o reembolso.";
    throw new Error(message);
  }

  return payload;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "É necessário estar autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const sessionId = body?.session_id;
  const action = body?.action;

  if (!isUuid(sessionId) || !["end", "kick"].includes(action)) {
    return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 });
  }

  const rpc = action === "kick" ? "kick_fans_live_participant" : "end_fans_live_session";
  const { data: closed, error: closeError } = await supabase.rpc(rpc, { p_session_id: sessionId });

  if (closeError) {
    return NextResponse.json({ error: closeError.message }, { status: 409 });
  }

  const result = (closed ?? {}) as {
    refund_required?: boolean;
    refund_status?: string;
    refund_amount?: number;
  };

  if (!result.refund_required) {
    return NextResponse.json({ ...result, refund_processed: false });
  }

  const { data: prepared, error: prepareError } = await supabase.rpc("prepare_fans_live_refund", {
    p_session_id: sessionId,
  });

  if (prepareError) {
    return NextResponse.json({
      ...result,
      refund_processed: false,
      refund_status: "required",
      refund_error: prepareError.message,
    }, { status: 202 });
  }

  const refund = prepared as {
    order_id: string;
    provider: string;
    provider_payment_id: string;
    refund_amount: number;
  };

  try {
    if (refund.provider !== "mercadopago") {
      throw new Error("Provedor de pagamento não suportado para reembolso automático.");
    }

    const providerResult = await refundMercadoPago(
      refund.provider_payment_id,
      refund.order_id,
    );

    const admin = createAdminClient();
    const { data: settled, error: settleError } = await admin.rpc("settle_fans_checkout", {
      p_order_id: refund.order_id,
      p_provider: "mercadopago",
      p_provider_payment_id: refund.provider_payment_id,
      p_payment_status: "refunded",
      p_payment_method: null,
      p_provider_fee: 0,
    });

    if (settleError) {
      return NextResponse.json({
        ...result,
        refund_processed: true,
        refund_status: "requested",
        provider_refund: providerResult,
        settlement_error: settleError.message,
      }, { status: 202 });
    }

    return NextResponse.json({
      ...result,
      refund_processed: true,
      refund_status: "refunded",
      refund_amount: refund.refund_amount,
      provider_refund: providerResult,
      settlement: settled,
    });
  } catch (refundError) {
    const admin = createAdminClient();
    await admin.rpc("mark_fans_live_refund_failed", { p_session_id: sessionId });

    return NextResponse.json({
      ...result,
      refund_processed: false,
      refund_status: "failed",
      refund_error: refundError instanceof Error
        ? refundError.message
        : "Não foi possível processar o reembolso.",
    }, { status: 502 });
  }
}
