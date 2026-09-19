import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "É necessário estar autenticado para enviar uma gorjeta." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const sessionId = body?.session_id;
  const amount = Number(body?.amount);
  const message = typeof body?.message === "string" ? body.message.slice(0, 500) : null;

  if (typeof sessionId !== "string" || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 5 || amount > 10000) {
    return NextResponse.json({ error: "A gorjeta deve estar entre R$ 5,00 e R$ 10.000,00." }, { status: 400 });
  }

  const { data, error } = await client.rpc("create_fans_live_tip_checkout_intent", {
    p_session_id: sessionId,
    p_amount: Number(amount.toFixed(2)),
    p_message: message,
  });

  if (error) {
    const status =
      error.message.includes("LIVE_SESSION_NOT_ACTIVE") ? 409 :
      error.message.includes("INVALID_TIP_AMOUNT") ? 400 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(data);
}
