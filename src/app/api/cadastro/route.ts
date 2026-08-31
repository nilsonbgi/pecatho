import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function digits(value: string) { return value.replace(/\D/g, ""); }
function validCpf(value: string) { const cpf = digits(value); if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false; let sum = 0; for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i); let d = 11 - (sum % 11); const d1 = d >= 10 ? 0 : d; sum = 0; for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i); d = 11 - (sum % 11); const d2 = d >= 10 ? 0 : d; return Number(cpf[9]) === d1 && Number(cpf[10]) === d2; }
function isAdult(value: string) { const d = new Date(`${value}T00:00:00Z`); if (Number.isNaN(d.getTime())) return false; const now = new Date(); let age = now.getUTCFullYear() - d.getUTCFullYear(); const m = now.getUTCMonth() - d.getUTCMonth(); if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--; return age >= 18; }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, email, cpf, birthDate, phone, cep, street, number, complement, neighborhood, city, uf } = body ?? {};
    if (!userId || !name || !email || !validCpf(cpf) || !isAdult(birthDate) || digits(cep).length !== 8 || !street || !number || !neighborhood || !city || !uf) return NextResponse.json({ error: "Dados cadastrais inválidos ou incompletos." }, { status: 400 });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "Configuração do servidor indisponível." }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(userId);
    if (authError || !authUser.user || authUser.user.email?.toLowerCase() !== String(email).toLowerCase()) return NextResponse.json({ error: "Usuário de autenticação não pôde ser validado." }, { status: 401 });
    const { data: existing } = await admin.from("profiles").select("id").eq("cpf", digits(cpf)).neq("id", userId).maybeSingle();
    if (existing) return NextResponse.json({ error: "Este CPF já está associado a outra conta." }, { status: 409 });
    const { error: profileError } = await admin.from("profiles").upsert({ id: userId, display_name: name, legal_name: name, email, phone, cpf: digits(cpf), birth_date: birthDate }, { onConflict: "id" });
    if (profileError) return NextResponse.json({ error: "Não foi possível salvar os dados pessoais." }, { status: 500 });
    await admin.from("user_addresses").update({ is_primary: false }).eq("user_id", userId);
    const { error: addressError } = await admin.from("user_addresses").insert({ user_id: userId, address_type: "primary", zipcode: digits(cep), street, number, complement: complement || null, is_primary: true });
    if (addressError) return NextResponse.json({ error: "Não foi possível salvar o endereço." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Não foi possível concluir o cadastro." }, { status: 500 }); }
}
