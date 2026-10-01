import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const admin = createAdminClient();
  const { data: experiences, error } = await admin
    .from("profile_service_experiences")
    .select("id,profile_id,service_label,occurred_at,status")
    .eq("user_id", user.id)
    .eq("status", "verified")
    .order("occurred_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (experiences ?? []).map((item) => item.id);
  const { data: reviews, error: reviewError } = ids.length
    ? await admin.from("profile_feedback").select("id,experience_id,rating,comment,status,created_at").in("experience_id", ids)
    : { data: [], error: null };
  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 });

  const profileIds = Array.from(new Set((experiences ?? []).map((item) => item.profile_id)));
  const { data: profiles, error: profileError } = profileIds.length
    ? await admin.from("advertiser_profiles").select("id,display_name,title,slug").in("id", profileIds)
    : { data: [], error: null };
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const reviewMap = new Map((reviews ?? []).map((review) => [review.experience_id, review]));

  return NextResponse.json({
    experiences: (experiences ?? []).map((experience) => ({
      ...experience,
      profile: profileMap.get(experience.profile_id) ?? null,
      review: reviewMap.get(experience.id) ?? null,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const experienceId = String(body?.experience_id || "").trim();
  const rating = Number(body?.rating);
  const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 1000) : "";

  if (!experienceId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Experiência ou avaliação inválida." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: experience } = await admin
    .from("profile_service_experiences")
    .select("id,profile_id,user_id,status")
    .eq("id", experienceId)
    .maybeSingle();

  if (!experience || experience.user_id !== user.id || experience.status !== "verified") {
    return NextResponse.json({ error: "Esta experiência não está disponível para avaliação." }, { status: 403 });
  }

  const { data: existing } = await admin.from("profile_feedback").select("id").eq("experience_id", experienceId).maybeSingle();
  if (existing) return NextResponse.json({ error: "Esta experiência já possui uma avaliação." }, { status: 409 });

  const { data: feedback, error } = await admin
    .from("profile_feedback")
    .insert({
      profile_id: experience.profile_id,
      author_user_id: user.id,
      rating,
      comment: comment || null,
      status: "pending",
      experience_id: experienceId,
      experience_verified: true,
    })
    .select("id,experience_id,rating,comment,status,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.code === "23505" ? "Esta experiência já possui uma avaliação." : error.message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ review: feedback }, { status: 201 });
}
