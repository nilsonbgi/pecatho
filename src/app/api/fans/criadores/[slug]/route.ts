import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug || slug.length > 100) return NextResponse.json({ error: "Criador inválido." }, { status: 400 });

  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  const admin = createAdminClient();
  const { data: creator, error: creatorError } = await admin.from("fans_creators")
    .select("id,slug,display_name,bio,avatar_url,status")
    .eq("slug", slug).maybeSingle();
  if (creatorError) return NextResponse.json({ error: "Não foi possível carregar o criador." }, { status: 500 });
  if (!creator || creator.status !== "active") return NextResponse.json({ error: "Criador não encontrado." }, { status: 404 });

  const { data: ownerRow } = await admin.from("fans_creators").select("user_id").eq("id", creator.id).maybeSingle();
  const isOwner = !!user && ownerRow?.user_id === user.id;
  const { data: posts } = await admin.from("fans_posts")
    .select("id,title,body,price,currency,access_type,status,published_at,created_at")
    .eq("creator_id", creator.id).eq("status", "published")
    .order("published_at", { ascending: false }).order("created_at", { ascending: false });

  const result = await Promise.all((posts ?? []).map(async post => {
    const { data: preview } = await admin.from("fans_post_media")
      .select("id,storage_bucket,storage_path,media_type,mime_type,width,height,is_preview,sort_order")
      .eq("post_id", post.id).eq("is_preview", true).order("sort_order", { ascending: true }).limit(1).maybeSingle();
    let previewUrl: string | null = null;
    if (preview?.storage_bucket === "pecatho-private") {
      const { data } = await admin.storage.from("pecatho-private").createSignedUrl(preview.storage_path, 180);
      previewUrl = data?.signedUrl ?? null;
    }
    const canSeeBody = isOwner || post.access_type === "free";
    return {
      id: post.id, title: post.title, body: canSeeBody ? post.body : null, price: post.price, currency: post.currency,
      access_type: post.access_type, published_at: post.published_at,
      preview: previewUrl ? { id: preview?.id, media_type: preview?.media_type, mime_type: preview?.mime_type, width: preview?.width, height: preview?.height, url: previewUrl } : null,
    };
  }));

  return NextResponse.json({ creator, posts: result });
}
