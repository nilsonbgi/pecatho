import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };
const PRIVATE_CONTENT_BUCKET = "pecatho-private";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401, headers: noStoreHeaders });
  }

  const saleId = new URL(request.url).searchParams.get("sale_id")?.trim();
  if (!saleId || !/^[0-9a-f-]{36}$/i.test(saleId)) {
    return NextResponse.json({ error: "Venda inválida ou não informada." }, { status: 400, headers: noStoreHeaders });
  }

  const { data, error } = await supabase.rpc("get_digital_content_downloads", { p_sale_id: saleId });
  if (error) {
    console.error("Falha ao autorizar downloads de conteúdo digital:", error);
    return NextResponse.json({ error: "Não foi possível validar o acesso aos arquivos desta compra." }, { status: 403, headers: noStoreHeaders });
  }

  const admin = createAdminClient();
  const items = Array.isArray(data?.items) ? data.items : [];
  const downloads: { id: string; filename: string; url: string; expires_in: number }[] = [];

  for (const item of items) {
    const bucket = typeof item.storage_bucket === "string" ? item.storage_bucket : "";
    const path = typeof item.storage_path === "string" ? item.storage_path : "";
    if (
      bucket !== PRIVATE_CONTENT_BUCKET ||
      !path ||
      typeof item.id !== "string" ||
      typeof item.filename !== "string" ||
      !item.filename.trim()
    ) {
      if (bucket || path) {
        console.error("Item de download ignorado por metadados inválidos ou bucket não autorizado.", {
          saleId,
          itemId: typeof item.id === "string" ? item.id : null,
          bucket,
        });
      }
      continue;
    }

    const { data: signed, error: signedError } = await admin.storage
      .from(PRIVATE_CONTENT_BUCKET)
      .createSignedUrl(path, 600);

    if (signedError || !signed?.signedUrl) {
      console.error("Falha ao gerar URL temporária para conteúdo adquirido.", {
        saleId,
        itemId: item.id,
        error: signedError,
      });
      continue;
    }

    downloads.push({
      id: item.id,
      filename: item.filename,
      url: signed.signedUrl,
      expires_in: 600,
    });
  }

  return NextResponse.json({ sale_id: saleId, downloads }, { headers: noStoreHeaders });
}
