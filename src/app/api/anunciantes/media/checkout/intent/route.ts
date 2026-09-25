import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "É necessário estar autenticado para continuar." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const mediaId = body?.media_id;
  if (typeof mediaId !== "string") return NextResponse.json({ error: "Mídia inválida." }, { status: 400 });

  const { data, error } = await client.rpc("create_profile_media_checkout_intent", { p_media_id: mediaId });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json(data);
}
