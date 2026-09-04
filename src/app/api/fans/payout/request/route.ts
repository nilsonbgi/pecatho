import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "É necessário estar autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const creatorId = body?.creator_id;
  const amount = Number(body?.amount);
  const idempotencyKey = typeof body?.idempotency_key === "string" ? body.idempotency_key.trim() : "";

  if (!isUuid(creatorId)) return NextResponse.json({ error: "Criador inválido." }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) {
    return NextResponse.json({ error: "Informe um valor válido com até duas casas decimais." }, { status: 400 });
  }
  if (!idempotencyKey || idempotencyKey.length > 120) return NextResponse.json({ error: "Chave de solicitação inválida." }, { status: 400 });

  const { data, error } = await supabase.rpc("request_fans_payout", {
    p_creator_id: creatorId,
    p_amount: Math.round(amount * 100) / 100,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    const message = error.message || "Não foi possível registrar o recebimento.";
    const status = /não autenticado|não autorizado|inválido|insuficiente|mínimo/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ payout: result }, { status: 201 });
}
