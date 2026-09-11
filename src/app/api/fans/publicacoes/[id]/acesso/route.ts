import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isUuid(value: string) { return /^[0-9a-f-]{36}$/i.test(value); }

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Publicação inválida." }, { status: 400 });

  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  const admin = createAdminClient();

  const { data: post, error: postError } = await admin
    .from("fans_posts")
    .select("id,creator_id,title,body,price,currency,access_type,status,published_at,created_at")
    .eq("id", id).maybeSingle();
  if (postError) return NextResponse.json({ error: "Não foi possível carregar a publicação." }, { status: 500 });
  if (!post || post.status !== "published") return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });

  const { data: creator } = await admin.from("fans_creators")
    .select("id,slug,display_name,bio,avatar_url,status,advertiser_profile_id,user_id")
    .eq("id", post.creator_id).maybeSingle();
  if (!creator || creator.status !== "active") return NextResponse.json({ error: "Criador não disponível." }, { status: 404 });

  const isOwner = !!user && user.id === creator.user_id;
  let isStaff = false;
  if (user) {
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).in("role", ["super_admin", "admin", "moderator", "support"]).maybeSingle();
    isStaff = !!role;
  }

  let entitled = post.access_type === "free" || Number(post.price) === 0 || isOwner || isStaff;
  if (!entitled && user && post.access_type === "paid") {
    const { data: purchase } = await admin.from("fans_purchases")
      .select("id").eq("post_id", post.id).eq("buyer_user_id", user.id).eq("status", "paid").not("paid_at", "is", null).limit(1).maybeSingle();
    entitled = !!purchase;
  }
  if (!entitled && user && post.access_type === "subscriber") {
    const now = new Date().toISOString();
    const { data: subscription } = await admin.from("fans_subscriptions")
      .select("id").eq("creator_id", post.creator_id).eq("subscriber_user_id", user.id).eq("status", "active")
      .lte("starts_at", now).or(`ends_at.is.null,ends_at.gte.${now}`).limit(1).maybeSingle();
    entitled = !!subscription;
  }

  const { data: media } = await admin.from("fans_post_media")
    .select("id,storage_bucket,storage_path,media_type,mime_type,size_bytes,width,height,duration_seconds,sort_order,is_preview")
    .eq("post_id", post.id).order("sort_order", { ascending: true }).order("created_at", { ascending: true });

  const visibleMedia = (media ?? []).filter(item => entitled || item.is_preview);
  const signed = await Promise.all(visibleMedia.map(async item => {
    const bucket = String(item.storage_bucket || "fans-private").trim();
    if (!bucket || !item.storage_path) return null;
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(item.storage_path, 180);
    if (error || !data?.signedUrl) return null;
    return { id: item.id, media_type: item.media_type, mime_type: item.mime_type, size_bytes: item.size_bytes, width: item.width, height: item.height, duration_seconds: item.duration_seconds, sort_order: item.sort_order, is_preview: item.is_preview, url: data.signedUrl };
  }));

  return NextResponse.json({
    post: { id: post.id, title: post.title, body: post.body, price: post.price, currency: post.currency, access_type: post.access_type, published_at: post.published_at },
    creator: { id: creator.id, slug: creator.slug, display_name: creator.display_name, bio: creator.bio, avatar_url: creator.avatar_url },
    access: { entitled, requires_login: !entitled && post.access_type !== "free", requires_purchase: !entitled && post.access_type === "paid", requires_subscription: !entitled && post.access_type === "subscriber" },
    media: signed.filter(Boolean),
  });
}
