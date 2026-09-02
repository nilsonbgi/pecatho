import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim();
  if (!address) return NextResponse.json({ error: "Endereço não informado." }, { status: 400 });
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");
  const response = await fetch(url.toString(), { cache: "no-store", headers: { "User-Agent": "Pecatho/1.0 (plataforma Pecatho)" } });
  if (!response.ok) return NextResponse.json({ error: "Falha na geocodificação." }, { status: 502 });
  const data = await response.json(); const result = data?.[0];
  if (!result?.lat || !result?.lon) return NextResponse.json({ error: "Endereço não localizado." }, { status: 404 });
  return NextResponse.json({ latitude: Number(result.lat), longitude: Number(result.lon), placeId: result.osm_id ?? null });
}
