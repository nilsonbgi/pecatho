import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const requestedTitle = typeof body?.title === "string" ? body.title.trim() : "";
  const requestedCategoryId = Number(body?.category_id || 0) || null;

  const [{ data: account }, { data: existing, error: existingError }] = await Promise.all([
    supabase.from("profiles").select("display_name,legal_name,phone,birth_date").eq("id", user.id).maybeSingle(),
    supabase.from("advertiser_profiles").select("id,user_id,title,display_name,status,verification_status").eq("user_id", user.id).maybeSingle(),
  ]);
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });
  if (existing) return NextResponse.json({ profile: existing });

  const displayName = String(account?.display_name || account?.legal_name || user.email?.split("@")[0] || "Anunciante").trim();
  const title = requestedTitle || `Perfil de ${displayName}`;
  const slugBase = slugify(`${displayName}-${crypto.randomUUID().slice(0, 8)}`) || `perfil-${crypto.randomUUID().slice(0, 8)}`;

  const { data: created, error } = await supabase.from("advertiser_profiles").insert({
    user_id: user.id,
    title,
    display_name: displayName,
    slug: slugBase,
    category_id: requestedCategoryId,
    birth_date: account?.birth_date || null,
    phone: account?.phone || null,
    status: "draft",
    verification_status: "unverified",
    pricing: {},
    service_options: {},
    payment_options: {},
    social_links: {},
  }).select("id,user_id,title,display_name,status,verification_status").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: created }, { status: 201 });
}
