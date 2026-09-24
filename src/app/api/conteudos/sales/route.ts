import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: advertiser }, { data: creator }] = await Promise.all([
    admin.from("advertiser_profiles").select("id").eq("user_id", user.id).maybeSingle(),
    admin.from("fans_creators").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  const ownerIds: { owner_type: "advertiser" | "creator"; owner_id: string }[] = [];
  if (advertiser?.id) ownerIds.push({ owner_type: "advertiser", owner_id: advertiser.id });
  if (creator?.id) ownerIds.push({ owner_type: "creator", owner_id: creator.id });
  if (!ownerIds.length) return NextResponse.json({ sales: 0, gross: 0, ownerAmount: 0, last30Sales: 0, last30Gross: 0 });

  let query = admin
    .from("digital_content_sales")
    .select("amount,owner_amount,status,paid_at,owner_type,owner_id")
    .eq("owner_user_id", user.id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const paid = (data ?? []).filter((row) => String(row.status).toLowerCase() === "paid");
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = paid.filter((row) => row.paid_at && new Date(row.paid_at).getTime() >= cutoff);

  const sum = (rows: typeof paid, key: "amount" | "owner_amount") =>
    rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);

  return NextResponse.json({
    sales: paid.length,
    gross: sum(paid, "amount"),
    ownerAmount: sum(paid, "owner_amount"),
    last30Sales: recent.length,
    last30Gross: sum(recent, "amount"),
  }, { headers: { "Cache-Control": "no-store" } });
}
