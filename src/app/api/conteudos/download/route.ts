import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const saleId = new URL(request.url).searchParams.get("sale_id");
  if (!saleId) return NextResponse.json({ error: "Venda não informada." }, { status: 400 });

  const { data, error } = await supabase.rpc("get_digital_content_downloads", { p_sale_id: saleId });
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });

  const admin = createAdminClient();
  const items = Array.isArray(data?.items) ? data.items : [];
  const downloads = [];
  for (const item of items) {
    const bucket = typeof item.storage_bucket === "string" ? item.storage_bucket : "";
    const path = typeof item.storage_path === "string" ? item.storage_path : "";
    if (!bucket || !path) continue;
    const { data: signed, error: signedError } = await admin.storage.from(bucket).createSignedUrl(path, 600);
    if (!signedError && signed?.signedUrl) {
      downloads.push({ id: item.id, filename: item.filename, url: signed.signedUrl, expires_in: 600 });
    }
  }
  return NextResponse.json({ sale_id: saleId, downloads });
}
