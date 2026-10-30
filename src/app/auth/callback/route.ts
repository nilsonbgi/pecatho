import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function digits(value: string) { return String(value || "").replace(/\D/g, ""); }
function validCpf(value: string) { const cpf = digits(value); if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false; let sum = 0; for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i); let d = 11 - (sum % 11); const d1 = d >= 10 ? 0 : d; sum = 0; for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i); d = 11 - (sum % 11); const d2 = d >= 10 ? 0 : d; return Number(cpf[9]) === d1 && Number(cpf[10]) === d2; }
function isAdult(value: string) { const d = new Date(`${value}T00:00:00Z`); if (Number.isNaN(d.getTime())) return false; const now = new Date(); let age = now.getUTCFullYear() - d.getUTCFullYear(); const m = now.getUTCMonth() - d.getUTCMonth(); if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--; return age >= 18; }
function slugify(value: string) { return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "perfil"; }

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

  const user = userData.user;
  const { data: intent, error: intentError } = await supabase.rpc("consume_registration_intent", { p_user_id: user.id });
  if (intentError) return NextResponse.redirect(new URL("/login?error=registration_data", url.origin));

  const registration = intent as Record<string, unknown> | null;
  const name = String(registration?.display_name || "").trim();
  const cpf = digits(String(registration?.cpf || ""));
  const birthDate = String(registration?.birth_date || "");
  const phone = String(registration?.phone || "").trim();
  const cep = digits(String(registration?.zipcode || ""));
  const street = String(registration?.street || "").trim();
  const number = String(registration?.number || "").trim();
  const complement = String(registration?.complement || "").trim();
  const neighborhood = String(registration?.neighborhood || "").trim();
  const city = String(registration?.city || "").trim();
  const uf = String(registration?.uf || "").trim().toUpperCase();
  const ibgeCode = String(registration?.ibge_code || "").trim();
  const entryMode = ["customer", "advertiser", "fans", "both"].includes(String(registration?.entry_mode)) ? String(registration?.entry_mode) : "customer";
  const referralCreatorId = String(registration?.referral_creator_id || "");
  const referralAffiliateUserId = String(registration?.referral_affiliate_user_id || "");
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(referralCreatorId)) {
    await supabase.rpc("record_pecatho_affiliate_referral", { p_creator_id: referralCreatorId });
  } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(referralAffiliateUserId)) {
    await supabase.rpc("record_pecatho_affiliate_referral_by_user", { p_affiliate_user_id: referralAffiliateUserId });
  }

  if (!name || !user.email || !validCpf(cpf) || !isAdult(birthDate)) {
    return NextResponse.redirect(new URL("/login?error=registration_profile", url.origin));
  }

  const { data: existingCpf, error: cpfError } = await supabase
    .from("profiles")
    .select("id")
    .eq("cpf", cpf)
    .neq("id", user.id)
    .maybeSingle();

  if (cpfError) {
    return NextResponse.redirect(new URL("/login?error=registration_profile", url.origin));
  }

  if (existingCpf) {
    return NextResponse.redirect(new URL("/login?error=cpf_in_use", url.origin));
  }

  // Identity fields are protected by guard_profile_sensitive_fields().
  // The authorized RPC sets the transaction-local authorization flag and
  // performs the update for the authenticated user.
  const { error: profileError } = await supabase.rpc("update_my_profile", {
    p_display_name: name,
    p_legal_name: name,
    p_phone: phone,
    p_birth_date: birthDate,
    p_cpf: cpf,
  });

  if (profileError) {
    console.error("[auth/callback] Falha ao concluir perfil:", profileError);
    return NextResponse.redirect(new URL("/login?error=registration_profile", url.origin));
  }

  if (cep.length !== 8 || !street || !number || !neighborhood || !city || !/^[A-Z]{2}$/.test(uf) || !/^\d{7}$/.test(ibgeCode)) {
    console.error("[auth/callback] Dados de endereço incompletos.");
    return NextResponse.redirect(new URL("/login?error=registration_address", url.origin));
  }

  const { data: cityRow, error: cityError } = await supabase
    .from("cities")
    .select("id,state_id,name,ibge_code")
    .eq("ibge_code", ibgeCode)
    .maybeSingle();

  if (cityError || !cityRow) {
    console.error("[auth/callback] Município não localizado:", cityError);
    return NextResponse.redirect(new URL("/login?error=registration_address", url.origin));
  }

  const { data: stateRow, error: stateError } = await supabase
    .from("states")
    .select("id,uf,name")
    .eq("id", cityRow.state_id)
    .maybeSingle();

  if (stateError || !stateRow || stateRow.uf !== uf || cityRow.name.toLocaleLowerCase("pt-BR") !== city.toLocaleLowerCase("pt-BR")) {
    console.error("[auth/callback] Município/UF divergente:", stateError);
    return NextResponse.redirect(new URL("/login?error=registration_address", url.origin));
  }

  const coordinates = await geocode(`${street}, ${number}, ${neighborhood}, ${city}, ${uf}`, cep);
  const publicLatitude = coordinates ? Number(coordinates.latitude.toFixed(2)) : null;
  const publicLongitude = coordinates ? Number(coordinates.longitude.toFixed(2)) : null;
  const address = {
    user_id: user.id,
    address_type: "primary",
    zipcode: cep,
    street,
    number,
    complement: complement || null,
    city_id: cityRow.id,
    state_id: cityRow.state_id,
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    public_latitude: publicLatitude,
    public_longitude: publicLongitude,
    location_visibility: coordinates ? "approximate" : "private",
    is_primary: true,
  };

  const { data: existingAddress, error: existingAddressError } = await supabase
    .from("user_addresses")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  if (existingAddressError) {
    console.error("[auth/callback] Falha ao consultar endereço principal:", existingAddressError);
    return NextResponse.redirect(new URL("/login?error=registration_address", url.origin));
  }

  const addressResult = existingAddress?.id
    ? await supabase.from("user_addresses").update(address).eq("id", existingAddress.id)
    : await supabase.from("user_addresses").insert(address);

  if (addressResult.error) {
    console.error("[auth/callback] Falha ao salvar endereço:", addressResult.error);
    return NextResponse.redirect(new URL("/login?error=registration_address", url.origin));
  }

  const primaryAddressId = existingAddress?.id;
  let addressCleanup = supabase.from("user_addresses").update({ is_primary: false }).eq("user_id", user.id);
  if (primaryAddressId) addressCleanup = addressCleanup.neq("id", primaryAddressId);
  const { error: addressCleanupError } = await addressCleanup;

  if (addressCleanupError) {
    console.error("[auth/callback] Falha ao normalizar endereço principal:", addressCleanupError);
    return NextResponse.redirect(new URL("/login?error=registration_address", url.origin));
  }

  if ((entryMode === "advertiser" || entryMode === "both") && name) {
    const { data: advertiser, error: advertiserLookupError } = await supabase
      .from("advertiser_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (advertiserLookupError) {
      console.error("[auth/callback] Falha ao consultar perfil de acompanhante:", advertiserLookupError);
      return NextResponse.redirect(new URL("/login?error=registration_profile_type", url.origin));
    }

    if (!advertiser) {
      const { error: advertiserInsertError } = await supabase.from("advertiser_profiles").insert({
        user_id: user.id,
        display_name: name,
        title: `Perfil de ${name}`,
        summary: "Complete sua apresentação para publicar seu anúncio no Pecatho.",
        status: "draft",
        verification_status: "unverified",
        pricing: {},
        service_options: {},
        payment_options: {},
        social_links: {},
      });

      if (advertiserInsertError) {
        console.error("[auth/callback] Falha ao criar perfil de acompanhante:", advertiserInsertError);
        return NextResponse.redirect(new URL("/login?error=registration_profile_type", url.origin));
      }
    }
  }

  if ((entryMode === "fans" || entryMode === "both") && name) {
    const { data: creator, error: creatorLookupError } = await supabase
      .from("fans_creators")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (creatorLookupError) {
      console.error("[auth/callback] Falha ao consultar perfil Fans:", creatorLookupError);
      return NextResponse.redirect(new URL("/login?error=registration_profile_type", url.origin));
    }

    if (!creator) {
      const base = slugify(name);
      const suffix = user.id.replace(/-/g, "").slice(0, 8);
      const { data: advertiser, error: advertiserLookupError } = await supabase
        .from("advertiser_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (advertiserLookupError) {
        console.error("[auth/callback] Falha ao consultar perfil associado:", advertiserLookupError);
        return NextResponse.redirect(new URL("/login?error=registration_profile_type", url.origin));
      }

      const { error: creatorInsertError } = await supabase.from("fans_creators").insert({
        user_id: user.id,
        advertiser_profile_id: advertiser?.id ?? null,
        slug: `${base}-${suffix}`,
        display_name: name,
        bio: "Complete sua apresentação para começar a criar no Pecatho Fans.",
        status: "active",
      });

      if (creatorInsertError) {
        console.error("[auth/callback] Falha ao criar perfil Fans:", creatorInsertError);
        return NextResponse.redirect(new URL("/login?error=registration_profile_type", url.origin));
      }
    }
  }

  return NextResponse.redirect(new URL(entryMode === "customer" ? "/painel/cliente" : "/painel", url.origin));
}
