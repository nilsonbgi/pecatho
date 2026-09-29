import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PRIVATE_BUCKET = "pecatho-profile-paid";
const PUBLIC_BUCKET = "pecatho-media";

function basename(path: string) {
  const value = path.split("/").pop() || "media";
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const mediaId = typeof body?.media_id === "string" ? body.media_id : "";
  const accessType = body?.access_type === "paid" ? "paid" : body?.access_type === "public" ? "public" : "";
  const price = body?.price == null ? 0 : Number(body.price);

  if (!mediaId || !accessType) return NextResponse.json({ error: "Configuração de mídia inválida." }, { status: 400 });
  if (accessType === "paid" && (!Number.isFinite(price) || price <= 0)) {
    return NextResponse.json({ error: "Informe um preço maior que zero para conteúdo pago." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("advertiser_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError || !profile) return NextResponse.json({ error: "Anúncio não encontrado." }, { status: 404 });

  const { data: media, error: mediaError } = await admin
    .from("profile_media")
    .select("id,profile_id,storage_bucket,storage_path,access_type,price,is_public")
    .eq("id", mediaId)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (mediaError || !media) return NextResponse.json({ error: "Mídia não encontrada." }, { status: 404 });

  const targetBucket = accessType === "paid" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  const currentBucket = media.storage_bucket;
  const targetPath = currentBucket === targetBucket
    ? media.storage_path
    : `${user.id}/${profile.id}/${media.id}-${basename(media.storage_path)}`;

  let moved = false;
  if (currentBucket !== targetBucket) {
    const { data: file, error: downloadError } = await admin.storage.from(currentBucket).download(media.storage_path);
    if (downloadError || !file) return NextResponse.json({ error: "Não foi possível preparar o arquivo para a nova política de acesso." }, { status: 409 });

    const { error: uploadError } = await admin.storage.from(targetBucket).upload(targetPath, file, { contentType: file.type || undefined, upsert: false });
    if (uploadError) return NextResponse.json({ error: "Não foi possível proteger o arquivo no armazenamento privado." }, { status: 409 });
    moved = true;

    const { error: deleteError } = await admin.storage.from(currentBucket).remove([media.storage_path]);
    if (deleteError) {
      await admin.storage.from(targetBucket).remove([targetPath]);
      return NextResponse.json({ error: "Não foi possível concluir a migração segura do arquivo." }, { status: 409 });
    }
  }

  const { error: updateError } = await admin
    .from("profile_media")
    .update({
      storage_bucket: targetBucket,
      storage_path: targetPath,
      access_type: accessType,
      price: accessType === "paid" ? price : 0,
      is_public: accessType === "public",
    })
    .eq("id", media.id)
    .eq("profile_id", profile.id);

  if (updateError) {
    if (moved) {
      await admin.storage.from(targetBucket).remove([targetPath]);
      await admin.storage.from(currentBucket).upload(media.storage_path, await admin.storage.from(targetBucket).download(targetPath).then((r) => r.data || new Blob()), { contentType: undefined, upsert: false }).catch(() => ({ error: null }));
    }
    return NextResponse.json({ error: "Arquivo migrado, mas não foi possível atualizar o cadastro da mídia." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    media: {
      id: media.id,
      storage_bucket: targetBucket,
      storage_path: targetPath,
      access_type: accessType,
      price: accessType === "paid" ? price : 0,
      is_public: accessType === "public",
    },
  });
}