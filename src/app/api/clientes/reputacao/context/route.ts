import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversationId = String(searchParams.get("conversation_id") || "").trim();
  if (!conversationId) return NextResponse.json({ error: "Conversa não informada." }, { status: 400 });

  const admin = createAdminClient();
  const { data: membership, error: membershipError } = await admin
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });
  if (!membership) return NextResponse.json({ error: "Acesso à conversa não autorizado." }, { status: 403 });

  const { data: members, error: membersError } = await admin
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId);

  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

  const otherUserId = (members ?? []).map((member) => member.user_id).find((memberUserId) => memberUserId !== user.id);
  if (!otherUserId) return NextResponse.json({ reputation: null });

  const { data: otherProfile, error: profileError } = await admin
    .from("profiles")
    .select("account_type")
    .eq("id", otherUserId)
    .maybeSingle();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (otherProfile?.account_type !== "customer") return NextResponse.json({ reputation: null });

  const { data: reviews, error: reviewsError } = await admin
    .from("customer_reviews")
    .select("rating")
    .eq("customer_user_id", otherUserId)
    .eq("status", "approved")
    .eq("verified_interaction", true);

  if (reviewsError) return NextResponse.json({ error: reviewsError.message }, { status: 500 });

  const ratings = (reviews ?? []).map((review) => Number(review.rating)).filter(Number.isFinite);
  return NextResponse.json({
    reputation: {
      average_rating: ratings.length ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)) : null,
      review_count: ratings.length,
      trust_badge: ratings.length > 0,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
