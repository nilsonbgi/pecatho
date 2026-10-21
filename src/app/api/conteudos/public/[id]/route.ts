import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicDigitalContentCover } from "@/lib/digital-content/public-cover";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Conteúdo inválido." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: product, error } = await admin
    .from("digital_content_products")
    .select(
      "id,title,description,product_type,package_image_limit,package_video_limit,price,currency,status,owner_type,owner_id,owner_user_id,cover_bucket,cover_path",
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível carregar o conteúdo." },
      { status: 500 },
    );
  }

  if (!product) {
    return NextResponse.json(
      { error: "Conteúdo não encontrado." },
      { status: 404 },
    );
  }

  let owner_name = "";
  let owner_slug = "";

  if (product.owner_type === "advertiser") {
    const { data: owner, error: ownerError } = await admin
      .from("advertiser_profiles")
      .select("display_name,title,slug")
      .eq("id", product.owner_id)
      .eq("status", "published")
      .maybeSingle();

    if (ownerError) {
      console.error(ownerError);
      return NextResponse.json(
        { error: "Não foi possível validar o vendedor." },
        { status: 500 },
      );
    }

    if (!owner) {
      return NextResponse.json(
        { error: "Conteúdo não encontrado." },
        { status: 404 },
      );
    }

    owner_name = owner.display_name || owner.title || "Anunciante";
    owner_slug = owner.slug || "";
  } else if (product.owner_type === "creator") {
    const { data: owner, error: ownerError } = await admin
      .from("fans_creators")
      .select("display_name,slug")
      .eq("id", product.owner_id)
      .eq("status", "active")
      .maybeSingle();

    if (ownerError) {
      console.error(ownerError);
      return NextResponse.json(
        { error: "Não foi possível validar o vendedor." },
        { status: 500 },
      );
    }

    if (!owner) {
      return NextResponse.json(
        { error: "Conteúdo não encontrado." },
        { status: 404 },
      );
    }

    owner_name = owner.display_name || "Criador";
    owner_slug = owner.slug || "";
  } else {
    return NextResponse.json(
      { error: "Conteúdo não encontrado." },
      { status: 404 },
    );
  }

  const cover_url = await getPublicDigitalContentCover(admin, product);

  const { data: items, error: itemsError } = await admin
    .from("digital_content_product_items")
    .select("media_type,mime_type,size_bytes,width,height,duration_seconds,is_large_media,preview_storage_path,preview_mime_type,storage_bucket")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    console.error(itemsError);
    return NextResponse.json(
      { error: "Não foi possível carregar os detalhes do conteúdo." },
      { status: 500 },
    );
  }

  const mediaTypes = Array.from(
    new Set((items ?? []).map((item) => item.media_type).filter(Boolean)),
  );
  const media_previews: Array<{ url:string; mime_type:string; width:number|null; height:number|null; duration_seconds:number|null }> = [];
  for (const item of items ?? []) {
    if (item.media_type !== "video" || item.is_large_media !== true || !item.preview_storage_path) continue;
    const bucket = item.storage_bucket || "pecatho-private";
    const { data: signedPreview, error: previewError } = await admin.storage.from(bucket).createSignedUrl(item.preview_storage_path, 1800);
    if (previewError || !signedPreview?.signedUrl) {
      console.error("Falha ao assinar prévia de vídeo:", previewError);
      continue;
    }
    media_previews.push({ url:signedPreview.signedUrl, mime_type:item.preview_mime_type || "video/webm", width:item.width ?? null, height:item.height ?? null, duration_seconds:3 });
  }
  const mediaGroups = new Map<string, { key: string; media_type: string; title: string; count: number; total_bytes: number; total_duration_seconds: number }>();
  for (const item of items ?? []) {
    const mediaType = item.media_type || "document";
    const width = Number(item.width);
    const height = Number(item.height);
    let aspect = "original";
    if (width > 0 && height > 0) {
      const ratio = width / height;
      const candidates = [{ label: "9:16", ratio: 9 / 16 }, { label: "2:3", ratio: 2 / 3 }, { label: "1:1", ratio: 1 }, { label: "16:9", ratio: 16 / 9 }];
      let closest = candidates[0];
      for (const candidate of candidates) {
        if (Math.abs(Math.log(ratio / candidate.ratio)) < Math.abs(Math.log(ratio / closest.ratio))) closest = candidate;
      }
      if (Math.abs(Math.log(ratio / closest.ratio)) <= Math.log(1.18)) aspect = closest.label;
    }
    const isGif = /image\/gif/i.test(item.mime_type || "");
    const key = mediaType + ":" + (mediaType === "image" || mediaType === "video" ? (isGif ? "gif" : aspect) : "file");
    const title = mediaType === "video" ? "Vídeos" : mediaType === "image" ? (isGif ? "GIFs animados" : "Fotos") : mediaType === "audio" ? "Áudios" : "Documentos";
    const group = mediaGroups.get(key) ?? { key, media_type: mediaType, title: title + (mediaType === "image" || mediaType === "video" ? " · " + (isGif ? "GIF" : aspect) : ""), count: 0, total_bytes: 0, total_duration_seconds: 0 };
    group.count += 1;
    group.total_bytes += Math.max(0, Number(item.size_bytes) || 0);
    group.total_duration_seconds += Math.max(0, Number(item.duration_seconds) || 0);
    mediaGroups.set(key, group);
  }
  const media_groups = [...mediaGroups.values()].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

  return NextResponse.json(
    {
      product: {
        id: product.id,
        title: product.title,
        description: product.description,
        product_type: product.product_type,
        package_image_limit: product.package_image_limit,
        package_video_limit: product.package_video_limit,
        price: product.price,
        currency: product.currency,
        owner_type: product.owner_type,
        owner_id: product.owner_id,
        owner_name,
        owner_slug,
        cover_url,
        file_count: items?.length ?? 0,
        media_types: mediaTypes,
        media_groups,
        media_previews,
      },
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
