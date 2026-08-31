import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server environment is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const params = request.nextUrl.searchParams;
    const mode = params.get("mode") || "profiles";
    const stateId = params.get("state_id");
    const categoryId = params.get("category_id");
    const cityId = params.get("city_id");
    const q = params.get("q")?.trim();

    if (mode === "meta") {
      const [categories, states] = await Promise.all([
        supabase.from("categories").select("id,name").eq("display", true).order("name"),
        supabase.from("states").select("id,uf,name").order("name"),
      ]);
      if (categories.error) throw categories.error;
      if (states.error) throw states.error;
      return NextResponse.json({ categories: categories.data ?? [], states: states.data ?? [] }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
    }

    if (mode === "cities") {
      let query = supabase.from("cities").select("id,name,state_id").order("name").limit(1000);
      if (stateId) query = query.eq("state_id", Number(stateId));
      const cities = await query;
      if (cities.error) throw cities.error;
      return NextResponse.json({ cities: cities.data ?? [] }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
    }

    let query = supabase.from("advertiser_profiles").select("id,slug,title,display_name,summary,city_id,state_id,category_id,verification_status,primary_media_id,created_at").eq("status", "published").order("created_at", { ascending: false }).limit(48);
    if (categoryId) query = query.eq("category_id", Number(categoryId));
    if (cityId) query = query.eq("city_id", Number(cityId));
    if (stateId) query = query.eq("state_id", Number(stateId));
    if (q) query = query.or(`title.ilike.%${q.replace(/[%_,]/g, " ")}%,display_name.ilike.%${q.replace(/[%_,]/g, " ")}%,summary.ilike.%${q.replace(/[%_,]/g, " ")}%`);
    const profiles = await query;
    if (profiles.error) throw profiles.error;

    return NextResponse.json({ advertisers: profiles.data ?? [] }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch (error) {
    console.error("public advertisers API", error);
    return NextResponse.json({ error: "Não foi possível consultar os dados públicos." }, { status: 500 });
  }
}
