import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "É necessário estar autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const productId = body?.product_id;
  if (typeof productId !== "string") return NextResponse.json({ error: "Conteúdo inválido." }, { status: 400 });
  const { data, error } = await supabase.rpc("create_digital_content_checkout_intent", { p_product_id: productId });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  if (data?.already_owned) return NextResponse.json({ ...data, already_owned: true });
  return NextResponse.json(data);
}
