import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim();
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (!address) return NextResponse.json({ error: "Endereço não informado." }, { status: 400 });
  if (!key) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY não configurada." }, { status: 503 });

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("components", "country:BR");
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("key", key);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) return NextResponse.json({ error: "Falha na geocodificação." }, { status: 502 });

  const data = await response.json();
  const result = data?.results?.[0];
  if (!result?.geometry?.location) return NextResponse.json({ error: "Endereço não localizado." }, { status: 404 });

  return NextResponse.json({
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    placeId: result.place_id ?? null,
  });
}
