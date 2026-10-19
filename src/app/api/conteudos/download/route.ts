import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };
const PRIVATE_CONTENT_BUCKET = "pecatho-private";

type AuthorizedDownloadItem = {
  id: string;
  filename: string;
  storage_bucket: string;
  storage_path: string;
};

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
    const message = typeof error.message === "string" ? error.message : "";
    const denied = /AUTH_REQUIRED|CONTENT_ACCESS_DENIED/i.test(message);
    return NextResponse.json(
      { error: denied ? "Você não tem acesso aos arquivos desta compra." : "Não foi possível validar o acesso aos arquivos desta compra." },
      { status: denied ? 403 : 503, headers: noStoreHeaders },
    );
  }

  const items = Array.isArray(data?.items) ? data.items as AuthorizedDownloadItem[] : [];
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Esta compra não possui arquivos disponíveis para download. Entre em contato com o suporte se o problema persistir." },
      { status: 409, headers: noStoreHeaders },
    );
  }

  for (const item of items) {
    const bucket = typeof item?.storage_bucket === "string" ? item.storage_bucket : "";
    const path = typeof item?.storage_path === "string" ? item.storage_path : "";
    if (
      bucket !== PRIVATE_CONTENT_BUCKET ||
      !path ||
      typeof item.id !== "string" ||
      !item.id ||
      typeof item.filename !== "string" ||
      !item.filename.trim() ||
      path.includes("..") ||
      path.startsWith("/") ||
      path.includes("\\")
    ) {
      console.error("Download bloqueado por metadados de arquivo inválidos.", {
        saleId,
        itemId: typeof item?.id === "string" ? item.id : null,
        bucket,
      });
      return NextResponse.json(
        { error: "Os arquivos desta compra precisam de verificação. Tente novamente mais tarde ou contate o suporte." },
        { status: 500, headers: noStoreHeaders },
      );
    }
  }

  const admin = createAdminClient();
  const downloads: { id: string; filename: string; url: string; expires_in: number }[] = [];

  for (const item of items) {
    const { data: signed, error: signedError } = await admin.storage
      .from(PRIVATE_CONTENT_BUCKET)
      .createSignedUrl(item.storage_path, 600);

    if (signedError || !signed?.signedUrl) {
      console.error("Falha ao gerar URL temporária para conteúdo adquirido.", {
        saleId,
        itemId: item.id,
        error: signedError,
      });
      return NextResponse.json(
        { error: "Não foi possível preparar todos os arquivos desta compra. Tente novamente." },
        { status: 503, headers: noStoreHeaders },
      );
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
