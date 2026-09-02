import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const profileId = typeof body?.profile_id === "string" ? body.profile_id : "";
  if (!profileId) return NextResponse.json({ error: "Anúncio não informado." }, { status: 400 });
  const { data, error } = await supabase.rpc("submit_advertiser_for_review", { p_profile_id: profileId });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}
