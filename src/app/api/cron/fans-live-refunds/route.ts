import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === "Bearer " + secret;
}

type ProviderFailure = {
  message: string;
  code: string | null;
  httpStatus: number;
  failureClass: "transient" | "permanent";
  metadata: Record<string, unknown>;
};

function classifyProviderFailure(httpStatus: number, payload: unknown, fallback: string): ProviderFailure {
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const message = typeof record.message === "string" ? record.message : fallback;
  const normalized = message.toLowerCase();
  const code = typeof record.error === "string"
    ? record.error
    : typeof record.code === "string"
      ? record.code
      : null;

  const explicitPermanent =
    httpStatus === 422 ||
    /not refundable|not refund|cannot be refunded|can't be refunded|invalid payment|payment not found|invalid request|already refunded|already reversed/i.test(normalized);

  return {
    message,
    code,
    httpStatus,
    failureClass: explicitPermanent ? "permanent" : "transient",
    metadata: {
      http_status: httpStatus,
      code,
      message,
    },
  };
}

async function refundMercadoPago(paymentId: string, orderId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw {
      message: "Mercado Pago não configurado.",
      code: "MERCADOPAGO_NOT_CONFIGURED",
      httpStatus: 500,
      failureClass: "permanent",
      metadata: {},
    } satisfies ProviderFailure;
  }

  let response: Response;
  let payload: unknown = null;

  try {
    response = await fetch(
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
    payload = await response.json().catch(() => null);
  } catch (error) {
    throw {
      message: error instanceof Error ? error.message : "Falha de comunicação com o Mercado Pago.",
      code: "NETWORK_ERROR",
      httpStatus: 503,
      failureClass: "transient",
      metadata: {},
    } satisfies ProviderFailure;
  }

  if (!response.ok) {
    throw classifyProviderFailure(
      response.status,
      payload,
      "O provedor não confirmou o reembolso.",
    );
  }

  return payload;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: reconciliation, error: reconciliationError } = await admin.rpc(
    "reconcile_fans_live_commercial_state",
    { p_session_id: null },
  );

  if (reconciliationError) {
    return NextResponse.json(
      { error: reconciliationError.message },
      { status: 500 },
    );
  }

  const { data: sessions, error } = await admin
    .from("fans_live_sessions")
    .select("id, refund_status, refund_failure_class, refund_next_attempt_at, refund_attempts")
    .eq("status", "completed")
    .in("refund_status", ["required", "failed"])
    .or("refund_next_attempt_at.is.null,refund_next_attempt_at.lte." + new Date().toISOString())
    .or("refund_failure_class.is.null,refund_failure_class.eq.transient")
    .order("refund_next_attempt_at", { ascending: true, nullsFirst: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<Record<string, unknown>> = [];

  for (const session of sessions ?? []) {
    let attemptId: string | null = null;

    try {
      const { data: begun, error: beginError } = await admin.rpc(
        "begin_fans_live_refund_attempt",
        { p_session_id: session.id },
      );

      if (beginError) throw new Error(beginError.message);

      const attempt = begun as {
        eligible?: boolean;
        reason?: string;
        attempt_id?: string;
        provider?: string;
        provider_payment_id?: string;
        order_id?: string;
      };

      if (!attempt.eligible) {
        results.push({
          session_id: session.id,
          status: "skipped",
          reason: attempt.reason ?? "not_eligible",
        });
        continue;
      }

      attemptId = attempt.attempt_id ?? null;

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
        const { error: settleError } = await admin.rpc("settle_fans_checkout", {
          p_order_id: refund.order_id,
          p_provider: "mercadopago",
          p_provider_payment_id: refund.provider_payment_id,
          p_payment_status: "refunded",
          p_payment_method: null,
          p_provider_fee: 0,
        });
        if (settleError) throw new Error(settleError.message);

        const { error: completeError } = await admin.rpc("complete_fans_live_refund_attempt", {
          p_attempt_id: attemptId,
          p_provider_reference: null,
          p_response_metadata: { source: "provider_already_refunded" },
        });
        if (completeError) throw new Error(completeError.message);

        results.push({ session_id: session.id, status: "already_refunded" });
        continue;
      }

      if (refund.provider !== "mercadopago") {
        throw {
          message: "Provedor de pagamento não suportado.",
          code: "UNSUPPORTED_PROVIDER",
          httpStatus: 422,
          failureClass: "permanent",
          metadata: { provider: refund.provider ?? null },
        } satisfies ProviderFailure;
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

      const providerReference =
        providerResult && typeof providerResult === "object" && "id" in providerResult
          ? String((providerResult as { id: unknown }).id)
          : null;

      const { error: completeError } = await admin.rpc("complete_fans_live_refund_attempt", {
        p_attempt_id: attemptId,
        p_provider_reference: providerReference,
        p_response_metadata: providerResult ?? {},
      });

      if (completeError) throw new Error(completeError.message);

      results.push({
        session_id: session.id,
        status: "refunded",
        provider_refund_id: providerReference,
      });
    } catch (error) {
      const failure = error && typeof error === "object" && "failureClass" in error
        ? error as ProviderFailure
        : {
            message: error instanceof Error ? error.message : "Falha no reembolso.",
            code: null,
            httpStatus: 500,
            failureClass: "transient" as const,
            metadata: {},
          };

      if (attemptId) {
        await admin.rpc("fail_fans_live_refund_attempt", {
          p_attempt_id: attemptId,
          p_failure_class: failure.failureClass,
          p_error_message: failure.message,
          p_error_code: failure.code,
          p_http_status: failure.httpStatus,
          p_response_metadata: failure.metadata,
        });
      } else {
        await admin.rpc("mark_fans_live_refund_failed", {
          p_session_id: session.id,
        });
      }

      results.push({
        session_id: session.id,
        status: "failed",
        failure_class: failure.failureClass,
        error_code: failure.code,
        error: failure.message,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    reconciliation: reconciliation?.[0] ?? null,
    processed: results.length,
    results,
  });
}
