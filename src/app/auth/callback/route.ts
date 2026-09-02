import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function digits(value: string) { return String(value || "").replace(/\D/g, ""); }
function validCpf(value: string) {
  const cpf = digits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let d = 11 - (sum % 11);
  const d1 = d >= 10 ? 0 : d;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  d = 11 - (sum % 11);
  const d2 = d >= 10 ? 0 : d;
  return Number(cpf[9]) === d1 && Number(cpf[10]) === d2;
}
function isAdult(value: string) {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age >= 18;
}
function slugify(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "perfil";
}

async function geocode(address: string, cep: string) {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2"); url.searchParams.set("limit", "1"); url.searchParams.set("countrycodes", "br"); url.searchParams.set("q", `${address}, Brasil, CEP ${cep}`);
    const response = await fetch(url, { headers: { "User-Agent": "Pecatho/1.0 (localizacao@pecatho.com.br)" }, cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json(); const first = Array.isArray(data) ? data[0] : null;
    if (!first?.lat || !first?.lon) return null;
    return { latitude: Number(first.lat), longitude: Number(first.lon) };
  } catch { return null; }
}

export async function GET(request: Request) {
  const url = new URL(request.url); const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return NextResponse.redirect(new URL("/login?error=auth_callback", url.origin));
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return NextResponse.redirect(new URL("/login?error=missing_user", url.origin));

  const user = userData.user; const meta = user.user_metadata || {};
  const name = String(meta.display_name || "").trim(); const cpf = digits(meta.cpf); const birthDate = String(meta.birth_date || ""); const phone = String(meta.phone || "").trim();
  const cep = digits(meta.cep); const street = String(meta.street || "").trim(); const number = String(meta.number || "").trim(); const complement = String(meta.complement || "").trim();
  const neighborhood = String(meta.neighborhood || "").trim(); const city = String(meta.city || "").trim(); const uf = String(meta.uf || "").trim().toUpperCase(); const ibgeCode = String(meta.ibge_code || "").trim();
  const entryMode = ["advertiser", "fans", "both"].includes(String(meta.entry_mode)) ? String(meta.entry_mode) : "advertiser";

  if (name && user.email && validCpf(cpf) && isAdult(birthDate)) {
    const { data: existingCpf, error: cpfError } = await supabase.from("profiles").select("id").eq("cpf", cpf).neq("id", user.id).maybeSingle();
    if (!cpfError && !existingCpf) {
      await supabase.from("profiles").upsert({ id: user.id, display_name: name, legal_name: name, email: user.email, phone, cpf, birth_date: birthDate }, { onConflict: "id" });
    }
  }

  if (cep.length === 8 && street && number && neighborhood && city && /^[A-Z]{2}$/.test(uf) && /^\d{7}$/.test(ibgeCode)) {
    const { data: cityRow, error: cityError } = await supabase.from("cities").select("id,state_id,name,ibge_code").eq("ibge_code", ibgeCode).maybeSingle();
    if (!cityError && cityRow) {
      const { data: stateRow, error: stateError } = await supabase.from("states").select("id,uf,name").eq("id", cityRow.state_id).maybeSingle();
      if (!stateError && stateRow && stateRow.uf === uf && cityRow.name.toLocaleLowerCase("pt-BR") === city.toLocaleLowerCase("pt-BR")) {
        await supabase.from("user_addresses").update({ is_primary: false }).eq("user_id", user.id);
        const coordinates = await geocode(`${street}, ${number}, ${neighborhood}, ${city}, ${uf}`, cep);
        const publicLatitude = coordinates ? Number(coordinates.latitude.toFixed(2)) : null; const publicLongitude = coordinates ? Number(coordinates.longitude.toFixed(2)) : null;
        const { data: existingAddress } = await supabase.from("user_addresses").select("id").eq("user_id", user.id).eq("is_primary", true).maybeSingle();
        const address = { user_id: user.id, address_type: "primary", zipcode: cep, street, number, complement: complement || null, city_id: cityRow.id, state_id: cityRow.state_id, latitude: coordinates?.latitude ?? null, longitude: coordinates?.longitude ?? null, public_latitude: publicLatitude, public_longitude: publicLongitude, location_visibility: coordinates ? "approximate" : "private", is_primary: true };
        if (existingAddress?.id) await supabase.from("user_addresses").update(address).eq("id", existingAddress.id); else await supabase.from("user_addresses").insert(address);
      }
    }
  }

  // A escolha feita no cadastro já cria o espaço de trabalho correspondente.
  // Os dois módulos continuam independentes: ter um não obriga o outro.
  if ((entryMode === "advertiser" || entryMode === "both") && name) {
    const { data: advertiser } = await supabase.from("advertiser_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!advertiser) {
      await supabase.from("advertiser_profiles").insert({ user_id: user.id, display_name: name, title: `Perfil de ${name}`, summary: "Complete sua apresentação para publicar seu anúncio no Pecatho.", status: "draft", verification_status: "unverified", pricing: {}, service_options: {}, payment_options: {}, social_links: {} });
    }
  }

  if ((entryMode === "fans" || entryMode === "both") && name) {
    const { data: creator } = await supabase.from("fans_creators").select("id").eq("user_id", user.id).maybeSingle();
    if (!creator) {
      const base = slugify(name); const suffix = user.id.replace(/-/g, "").slice(0, 8);
      await supabase.from("fans_creators").insert({ user_id: user.id, slug: `${base}-${suffix}`, display_name: name, bio: "Complete sua apresentação para começar a criar no Pecatho Fans.", status: "active" });
    }
  }

  return NextResponse.redirect(new URL("/painel", url.origin));
}
