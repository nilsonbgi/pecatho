import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === "Bearer " + secret;
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

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: sessions, error } = await admin
    .from("fans_live_sessions")
    .select("id, refund_status")
    .eq("status", "completed")
    .in("refund_status", ["required", "failed"])
    .order("refund_requested_at", { ascending: true, nullsFirst: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<Record<string, unknown>> = [];

  for (const session of sessions ?? []) {
    try {
      const { data: prepared, error: prepareError } = await admin.rpc(
        "prepare_fans_live_refund_system",
        { p_session_id: session.id },
      );

      if (prepareError) throw new Error(prepareError.message);

      const refund = prepared as {
        already_refunded?: boolean;
        order_id?: string;
        provider?: string;
        provider_payment_id?: string;
      };

      if (refund.already_refunded) {
        results.push({ session_id: session.id, status: "already_refunded" });
        continue;
      }

      if (refund.provider !== "mercadopago") {
        throw new Error("Provedor de pagamento não suportado.");
      }

      const providerResult = await refundMercadoPago(
        refund.provider_payment_id as string,
        refund.order_id as string,
      );

      const { error: settleError } = await admin.rpc("settle_fans_checkout", {
        p_order_id: refund.order_id,
        p_provider: "mercadopago",
        p_provider_payment_id: refund.provider_payment_id,
        p_payment_status: "refunded",
        p_payment_method: null,
        p_provider_fee: 0,
      });

      if (settleError) throw new Error(settleError.message);

      results.push({
        session_id: session.id,
        status: "refunded",
        provider_refund_id: providerResult?.id ?? null,
      });
    } catch (error) {
      await admin.rpc("mark_fans_live_refund_failed", {
        p_session_id: session.id,
      });

      results.push({
        session_id: session.id,
        status: "failed",
        error: error instanceof Error ? error.message : "Falha no reembolso.",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}
