import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export async function POST(request: Request) {
  const userClient = await createClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Entre na sua conta para enviar mídias." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler os arquivos enviados." }, { status: 400 });
  }

  const postId = String(form.get("post_id") ?? "");
  const file = form.get("file");
  if (!/^[0-9a-f-]{36}$/i.test(postId) || !(file instanceof File)) {
    return NextResponse.json({ error: "Informe uma publicação e um arquivo válidos." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Arquivo inválido. Aceitos: JPG, PNG, WebP, GIF, MP4, WebM e MOV até 50 MB." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: creator, error: creatorError } = await admin
    .from("fans_creators")
    .select("id,status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (creatorError) return NextResponse.json({ error: "Não foi possível validar o perfil criador." }, { status: 500 });
  if (!creator || creator.status !== "active") return NextResponse.json({ error: "Perfil criador ativo não encontrado." }, { status: 403 });

  const { data: post, error: postError } = await admin
    .from("fans_posts")
    .select("id,creator_id,status")
    .eq("id", postId)
    .eq("creator_id", creator.id)
    .maybeSingle();
  if (postError) return NextResponse.json({ error: "Não foi possível validar a publicação." }, { status: 500 });
  if (!post) return NextResponse.json({ error: "Publicação não encontrada ou sem permissão." }, { status: 404 });
  if (!["draft", "rejected"].includes(post.status)) {
    return NextResponse.json({ error: "Só é possível adicionar mídias a rascunhos ou publicações rejeitadas." }, { status: 409 });
  }
  if (file.type.startsWith("video/")) {
    const { data: planFeatures, error: planFeatureError } = await admin.rpc("get_public_fans_creator_plan_features", { p_creator_ids: [creator.id] });
    if (planFeatureError) return NextResponse.json({ error: "Não foi possível validar a permissão de vídeo do seu plano." }, { status: 503 });
    if (!(planFeatures ?? []).some((item: { has_video?: boolean }) => item.has_video === true)) {
      return NextResponse.json({ error: "O envio de vídeos exige um plano de visibilidade vigente que inclua esse diferencial.", code: "VIDEO_REQUIRES_PUBLICATION_PLAN" }, { status: 403 });
    }
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentSha256 = createHash("sha256").update(bytes).digest("hex");
  const { data: duplicate, error: duplicateError } = await admin
    .from("fans_post_media")
    .select("id,post_id")
    .eq("content_sha256", contentSha256)
    .limit(1)
    .maybeSingle();

  if (duplicateError) {
    return NextResponse.json({ error: "A proteção contra mídia repetida ainda não está disponível. Nenhum arquivo foi enviado; tente novamente mais tarde." }, { status: 503 });
  }
  if (duplicate) {
    return NextResponse.json({
      error: duplicate.post_id === post.id
        ? "Este arquivo já está nesta publicação."
        : "Este arquivo já foi usado em outra publicação. Para evitar conteúdo repetido, envie uma mídia diferente ou edite a publicação existente.",
      code: "duplicate_media",
    }, { status: 409 });
  }

  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  const bucket = "pecatho-private";
  const objectPath = `${creator.id}/${post.id}/${randomUUID()}.${extensionByType[file.type]}`;
  const { error: uploadError } = await admin.storage.from(bucket).upload(objectPath, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.json({ error: "Não foi possível armazenar a mídia com segurança." }, { status: 502 });
  }

  const { data: existingMedia, error: mediaReadError } = await admin
    .from("fans_post_media")
    .select("id,sort_order,is_preview")
    .eq("post_id", post.id)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (mediaReadError) {
    await admin.storage.from(bucket).remove([objectPath]);
    return NextResponse.json({ error: "Não foi possível preparar o registro da mídia." }, { status: 500 });
  }

  const nextSortOrder = (existingMedia?.[0]?.sort_order ?? -1) + 1;
  const { data: row, error: rowError } = await admin
    .from("fans_post_media")
    .insert({
      post_id: post.id,
      storage_bucket: bucket,
      storage_path: objectPath,
      media_type: file.type.startsWith("video/") ? "video" : "image",
      mime_type: file.type,
      size_bytes: file.size,
      sort_order: nextSortOrder,
      is_preview: !existingMedia?.length,
      content_sha256: contentSha256,
    })
    .select("id,storage_bucket,storage_path,media_type,mime_type,size_bytes,sort_order,is_preview")
    .single();

  if (rowError) {
    await admin.storage.from(bucket).remove([objectPath]);
    if (rowError.code === "23505") {
      return NextResponse.json({ error: "Este arquivo já foi usado em outra publicação.", code: "duplicate_media" }, { status: 409 });
    }
    return NextResponse.json({ error: "O arquivo foi recebido, mas não foi possível registrar a mídia. Nenhum arquivo órfão foi mantido." }, { status: 500 });
  }

  const { data: signed } = await admin.storage.from(bucket).createSignedUrl(objectPath, 300);
  return NextResponse.json({
    media: { ...row, url: signed?.signedUrl ?? null },
    message: "Mídia enviada e verificada com sucesso.",
  }, { status: 201 });
}
