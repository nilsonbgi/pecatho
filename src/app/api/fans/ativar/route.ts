import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "criador";
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  if (origin && new URL(origin).origin !== requestUrl.origin) {
    return NextResponse.json({ error: "Origem da solicitação não autorizada." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });

  const { data: existing, error: existingError } = await supabase
    .from("fans_creators")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: "Não foi possível verificar seu espaço Fans." }, { status: 500 });
  if (existing) return NextResponse.json({ ok: true, redirect: "/fans" });

  const metadata = user.user_metadata as Record<string, unknown> | null;
  const metadataName = typeof metadata?.display_name === "string" ? metadata.display_name.trim() : "";
  const emailName = user.email?.split("@")[0]?.trim() || "criador";
  const displayName = metadataName || emailName;
  const baseSlug = slugify(displayName);

  let slug = baseSlug;
  const { data: slugExists, error: slugError } = await supabase
    .from("fans_creators")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (slugError) return NextResponse.json({ error: "Não foi possível validar o endereço do perfil Fans." }, { status: 500 });
  if (slugExists) slug = `${baseSlug}-${user.id.replace(/-/g, "").slice(0, 8)}`;

  const { data: advertiser } = await supabase
    .from("advertiser_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("fans_creators").insert({
    user_id: user.id,
    advertiser_profile_id: advertiser?.id ?? null,
    slug,
    display_name: displayName,
    bio: "Complete sua apresentação para começar a criar no Pecatho Fans.",
    status: "active",
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, redirect: "/fans" });
    return NextResponse.json({ error: `Não foi possível criar o espaço Fans: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true, redirect: "/fans" });
}
