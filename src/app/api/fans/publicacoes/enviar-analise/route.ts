import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: { post_id?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Requisição inválida." }, { status: 400 }); }
  const postId = body.post_id;
  if (!postId || !/^[0-9a-f-]{36}$/i.test(postId)) return NextResponse.json({ error: "Publicação inválida." }, { status: 400 });

  const { data: creator } = await supabase.from("fans_creators").select("id").eq("user_id", user.id).maybeSingle();
  if (!creator) return NextResponse.json({ error: "Criador Fans não encontrado." }, { status: 403 });

  const { data: post } = await supabase.from("fans_posts").select("id,status,creator_id").eq("id", postId).eq("creator_id", creator.id).maybeSingle();
  if (!post) return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });
  if (!["draft", "rejected"].includes(post.status)) return NextResponse.json({ error: "Esta publicação não pode ser enviada para análise no estado atual." }, { status: 409 });

  const { error } = await supabase.from("fans_posts").update({ status: "pending_review" }).eq("id", post.id).eq("creator_id", creator.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, status: "pending_review" });
}
