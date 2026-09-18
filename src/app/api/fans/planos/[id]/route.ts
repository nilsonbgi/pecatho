import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });

  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "É necessário estar autenticado para visualizar este plano." },
      { status: 401 },
    );
  }

  const renewal = new URL(request.url).searchParams.get("renovar") === "1";
  const admin = createAdminClient();
  const { data: plan, error } = await admin
    .from("fans_plans")
    .select("id,name,description,price,currency,duration_days,status,creator_id")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Não foi possível carregar o plano." }, { status: 500 });
  if (!plan || plan.status !== "active") {
    return NextResponse.json({ error: "Este plano não está disponível para assinatura." }, { status: 404 });
  }

  const { data: creator } = await admin
    .from("fans_creators")
    .select("id,slug,display_name,status,user_id")
    .eq("id", plan.creator_id)
    .maybeSingle();

  if (!creator || creator.status !== "active") {
    return NextResponse.json({ error: "O criador não está disponível." }, { status: 404 });
  }
  if (creator.user_id === user.id) {
    return NextResponse.json({ error: "O criador não pode assinar o próprio plano." }, { status: 409 });
  }

  const { data: existing } = await admin
    .from("fans_subscriptions")
    .select("id,status,starts_at,ends_at,auto_renew")
    .eq("subscriber_user_id", user.id)
    .eq("plan_id", plan.id)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && (existing.status === "pending" || !renewal)) {
    return NextResponse.json(
      {
        error:
          existing.status === "active"
            ? "Você já possui uma assinatura ativa deste plano."
            : "Já existe uma assinatura aguardando pagamento.",
        subscription: existing,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: Number(plan.price),
    currency: String(plan.currency || "BRL").trim() || "BRL",
    duration_days: plan.duration_days,
    creator: { slug: creator.slug, display_name: creator.display_name },
    renewal,
  });
}
