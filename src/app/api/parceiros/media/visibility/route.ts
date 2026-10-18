import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PRIVATE_BUCKET = "pecatho-profile-paid";
const PUBLIC_PREVIEW_BUCKET = "pecatho-media-preview";

function safeBasename(path: string) {
  return (path.split("/").pop() || "preview.webp").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const mediaId = typeof body?.media_id === "string" ? body.media_id : "";
  if (!mediaId || typeof body?.is_public !== "boolean") {
    return NextResponse.json({ error: "Informe a mídia e a visibilidade desejada." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: media, error: mediaError } = await admin
    .from("partner_venue_media")
    .select("id,venue_id,owner_user_id,moderation_status,is_public,is_primary,preview_storage_bucket,preview_storage_path")
    .eq("id", mediaId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (mediaError || !media) return NextResponse.json({ error: "Mídia não encontrada para esta conta." }, { status: 404 });
  if (body.is_public && media.moderation_status !== "approved") {
    return NextResponse.json({ error: "A mídia precisa ser aprovada antes de ser exibida publicamente." }, { status: 409 });
  }

  const targetPreviewBucket = body.is_public ? PUBLIC_PREVIEW_BUCKET : PRIVATE_BUCKET;
  const currentPreviewBucket = media.preview_storage_bucket;
  const currentPreviewPath = media.preview_storage_path;
  const targetPreviewPath = !currentPreviewBucket || !currentPreviewPath
    ? null
    : currentPreviewBucket === targetPreviewBucket
      ? currentPreviewPath
      : `${user.id}/partners/${media.venue_id}/${media.id}-preview-${safeBasename(currentPreviewPath)}`;

  let previewMoved = false;
  let previewFile: Blob | null = null;
  if (currentPreviewBucket && currentPreviewPath && targetPreviewPath && currentPreviewBucket !== targetPreviewBucket) {
    const { data: downloaded, error: downloadError } = await admin.storage.from(currentPreviewBucket).download(currentPreviewPath);
    if (downloadError || !downloaded) {
      return NextResponse.json({ error: "Não foi possível preparar a miniatura para alterar a visibilidade." }, { status: 409 });
    }

    const { error: uploadError } = await admin.storage.from(targetPreviewBucket).upload(targetPreviewPath, downloaded, {
      contentType: downloaded.type || "image/webp",
      upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: "Não foi possível preparar a miniatura no destino." }, { status: 409 });

    const { error: removeError } = await admin.storage.from(currentPreviewBucket).remove([currentPreviewPath]);
    if (removeError) {
      await admin.storage.from(targetPreviewBucket).remove([targetPreviewPath]);
      return NextResponse.json({ error: "Não foi possível concluir a mudança segura da miniatura." }, { status: 409 });
    }
    previewMoved = true;
    previewFile = downloaded;
  }

  const { error: updateError } = await admin
    .from("partner_venue_media")
    .update({
      is_public: body.is_public,
      ...(body.is_public ? {} : { is_primary: false }),
      preview_storage_bucket: targetPreviewPath ? targetPreviewBucket : null,
      preview_storage_path: targetPreviewPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", media.id)
    .eq("owner_user_id", user.id);

  if (updateError) {
    if (previewMoved && previewFile && currentPreviewBucket && currentPreviewPath && targetPreviewPath) {
      await admin.storage.from(targetPreviewBucket).remove([targetPreviewPath]);
      await admin.storage.from(currentPreviewBucket).upload(currentPreviewPath, previewFile, {
        contentType: previewFile.type || "image/webp",
        upsert: false,
      });
    }
    return NextResponse.json({ error: "Não foi possível salvar a visibilidade da mídia." }, { status: 500 });
  }

  return NextResponse.json({ success: true, media_id: media.id, is_public: body.is_public });
}
