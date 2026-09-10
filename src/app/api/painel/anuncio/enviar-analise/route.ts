import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("advertiser_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "Não foi possível localizar o anúncio da conta." }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Você ainda não possui um anúncio para enviar à análise." }, { status: 404 });
  }

  const { data, error } = await supabase.rpc("submit_advertiser_for_review", {
    p_profile_id: profile.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: data });
}
