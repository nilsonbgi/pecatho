import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "É necessário estar autenticado." }, { status: 401 });

  const { data: profile } = await supabase.from("advertiser_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Perfil de anunciante não encontrado." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  const idempotencyKey = typeof body?.idempotency_key === "string" ? body.idempotency_key.trim() : "";

  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) {
    return NextResponse.json({ error: "Informe um valor válido com até duas casas decimais." }, { status: 400 });
  }
  if (!idempotencyKey || idempotencyKey.length > 120) {
    return NextResponse.json({ error: "Chave de solicitação inválida." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("request_seller_payout", {
    p_amount: Math.round(amount * 100) / 100,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    const message = error.message || "Não foi possível registrar o recebimento.";
    const status = /não autenticado|não encontrado|insuficiente|mínimo|inválido/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ payout: Array.isArray(data) ? data[0] : data }, { status: 201 });
}
