"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

function onlyDigits(value: string) { return value.replace(/\D/g, ""); }
function formatCpf(value: string) { const v = onlyDigits(value).slice(0, 11); return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); }
function formatCep(value: string) { const v = onlyDigits(value).slice(0, 8); return v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v; }
function validCpf(value: string) { const cpf = onlyDigits(value); if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false; let sum = 0; for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i); let d = 11 - (sum % 11); const d1 = d >= 10 ? 0 : d; sum = 0; for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i); d = 11 - (sum % 11); const d2 = d >= 10 ? 0 : d; return Number(cpf[9]) === d1 && Number(cpf[10]) === d2; }
function adult(date: string) { if (!date) return false; const d = new Date(`${date}T00:00:00Z`); if (Number.isNaN(d.getTime())) return false; const now = new Date(); let age = now.getUTCFullYear() - d.getUTCFullYear(); const m = now.getUTCMonth() - d.getUTCMonth(); if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--; return age >= 18; }

export default function CadastroPage() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [cpf, setCpf] = useState(""); const [birthDate, setBirthDate] = useState(""); const [phone, setPhone] = useState(""); const [cep, setCep] = useState(""); const [street, setStreet] = useState(""); const [number, setNumber] = useState(""); const [complement, setComplement] = useState(""); const [neighborhood, setNeighborhood] = useState(""); const [city, setCity] = useState(""); const [uf, setUf] = useState(""); const [ibgeCode, setIbgeCode] = useState(""); const [loadingCep, setLoadingCep] = useState(false); const [msg, setMsg] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const cpfOk = useMemo(() => cpf.length === 0 || validCpf(cpf), [cpf]);

  async function lookupCep(raw: string) {
    const formatted = formatCep(raw); setCep(formatted);
    if (onlyDigits(formatted).length !== 8) { setIbgeCode(""); return; }
    setLoadingCep(true); setError("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${onlyDigits(formatted)}/json/`);
      const data = await response.json();
      if (data.erro) throw new Error("CEP não encontrado.");
      setStreet(data.logradouro || ""); setNeighborhood(data.bairro || ""); setCity(data.localidade || ""); setUf(data.uf || ""); setIbgeCode(data.ibge ? String(data.ibge) : "");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível consultar o CEP."); setIbgeCode(""); }
    finally { setLoadingCep(false); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMsg("");
    if (!validCpf(cpf)) { setError("Informe um CPF válido."); setBusy(false); return; }
    if (!adult(birthDate)) { setError("O cadastro de anunciante exige idade mínima de 18 anos."); setBusy(false); return; }
    if (onlyDigits(cep).length !== 8 || !ibgeCode) { setError("Informe um CEP válido para que a cidade seja identificada corretamente."); setBusy(false); return; }
    const supabase = createClient(); const registrationData = { display_name: name, cpf: onlyDigits(cpf), birth_date: birthDate, phone, cep: onlyDigits(cep), street, number, complement, neighborhood, city, uf, ibge_code: String(ibgeCode) }; const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: registrationData } });
    if (signUpError) { setError(signUpError.message); setBusy(false); return; }
    if (!data.user) { setError("Não foi possível criar a conta."); setBusy(false); return; }
    setMsg("Cadastro iniciado. Verifique seu e-mail para confirmar a conta. Após a confirmação, o Pecatho concluirá automaticamente seu perfil."); setBusy(false);
  }

  return <main className="shell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><Link href="/" className="navCta">Início</Link></nav><section className="hero authHero"><div className="eyebrow">CADASTRO DE ANUNCIANTE</div><h1>Seu perfil começa <em>aqui.</em></h1><p className="heroCopy">Preencha seus dados com atenção. Informações de identidade e endereço são utilizadas de forma privada para validação e segurança.</p><form className="authCard registrationCard" onSubmit={submit}><h2>Identidade</h2><label>Nome completo<input value={name} onChange={e => setName(e.target.value)} required autoComplete="name" /></label><label>CPF<input value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} required inputMode="numeric" autoComplete="off" aria-invalid={!cpfOk} placeholder="000.000.000-00" />{!cpfOk && <small className="formError">CPF inválido.</small>}</label><label>Data de nascimento<input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required /></label><label>Telefone<input value={phone} onChange={e => setPhone(e.target.value)} required inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" /></label><h2>Conta</h2><label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label><label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" /><small>Mínimo de 8 caracteres.</small></label><h2>Endereço</h2><label>CEP<input value={cep} onChange={e => lookupCep(e.target.value)} required inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" />{loadingCep && <small>Consultando CEP...</small>}</label><div className="formRow"><label>Logradouro<input value={street} onChange={e => setStreet(e.target.value)} required autoComplete="street-address" /></label><label>Número<input value={number} onChange={e => setNumber(e.target.value)} required /></label></div><label>Complemento<input value={complement} onChange={e => setComplement(e.target.value)} /></label><div className="formRow"><label>Bairro<input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} required /></label><label>Cidade<input value={city} readOnly /></label><label>UF<input value={uf} readOnly /></label></div><small>O município é identificado pelo código IBGE retornado pelo CEP e validado no cadastro do Pecatho.</small>{error && <p className="formError">{error}</p>}{msg && <p className="formSuccess">{msg}</p>}<button className="primaryButton" disabled={busy || loadingCep}>{busy ? "Criando cadastro..." : "Criar conta e continuar"}</button><p className="authHint">Já possui conta? <Link href="/login">Entrar</Link></p></form></section></main>;
}
