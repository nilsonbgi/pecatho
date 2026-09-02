"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

function onlyDigits(value: string) { return value.replace(/\D/g, ""); }
function formatCpf(value: string) { const v = onlyDigits(value).slice(0, 11); return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); }
function formatCep(value: string) { const v = onlyDigits(value).slice(0, 8); return v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v; }
function validCpf(value: string) { const cpf = onlyDigits(value); if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false; let sum = 0; for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i); let d = 11 - (sum % 11); const d1 = d >= 10 ? 0 : d; sum = 0; for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i); d = 11 - (sum % 11); const d2 = d >= 10 ? 0 : d; return Number(cpf[9]) === d1 && Number(cpf[10]) === d2; }
function adult(date: string) { if (!date) return false; const d = new Date(`${date}T00:00:00Z`); if (Number.isNaN(d.getTime())) return false; const now = new Date(); let age = now.getUTCFullYear() - d.getUTCFullYear(); const m = now.getUTCMonth() - d.getUTCMonth(); if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--; return age >= 18; }

type EntryMode = "advertiser" | "fans" | "both";

export default function CadastroPage() {
  const [step, setStep] = useState(1);
  const [entryMode, setEntryMode] = useState<EntryMode>("advertiser");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState(""); const [birthDate, setBirthDate] = useState(""); const [phone, setPhone] = useState("");
  const [cep, setCep] = useState(""); const [street, setStreet] = useState(""); const [number, setNumber] = useState(""); const [complement, setComplement] = useState(""); const [neighborhood, setNeighborhood] = useState(""); const [city, setCity] = useState(""); const [uf, setUf] = useState(""); const [ibgeCode, setIbgeCode] = useState("");
  const [loadingCep, setLoadingCep] = useState(false); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(""); const [error, setError] = useState("");
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

  function nextStep() {
    setError("");
    if (step === 1 && !name.trim()) { setError("Informe seu nome para continuar."); return; }
    if (step === 1 && !adult(birthDate)) { setError("É necessário ter 18 anos ou mais para criar uma conta no Pecatho."); return; }
    if (step === 2 && (!email || password.length < 8)) { setError("Informe um e-mail válido e uma senha com pelo menos 8 caracteres."); return; }
    if (step === 3 && (!validCpf(cpf) || !phone.trim())) { setError("Informe um CPF válido e um telefone para continuar."); return; }
    if (step === 4 && (onlyDigits(cep).length !== 8 || !ibgeCode || !street || !number)) { setError("Informe um endereço válido. O CEP deve identificar o município corretamente."); return; }
    setStep((value) => Math.min(5, value + 1));
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMsg("");
    if (!validCpf(cpf)) { setError("Informe um CPF válido."); setBusy(false); return; }
    if (!adult(birthDate)) { setError("É necessário ter 18 anos ou mais para criar uma conta no Pecatho."); setBusy(false); return; }
    if (onlyDigits(cep).length !== 8 || !ibgeCode) { setError("Informe um CEP válido para que o município seja identificado corretamente."); setBusy(false); return; }
    try {
      const supabase = createClient();
      const registrationData = { display_name: name.trim(), cpf: onlyDigits(cpf), birth_date: birthDate, phone: phone.trim(), cep: onlyDigits(cep), street, number, complement, neighborhood, city, uf, ibge_code: String(ibgeCode), entry_mode: entryMode };
      const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: registrationData } });
      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Não foi possível criar a conta.");
      setMsg("Conta criada. Enviamos uma mensagem para seu e-mail. Depois da confirmação, seu perfil será concluído automaticamente.");
      setStep(6);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível concluir o cadastro."); }
    finally { setBusy(false); }
  }

  const progress = step >= 6 ? 100 : Math.round(((step - 1) / 5) * 100);

  return (
    <main className="onboardingShell">
      <nav className="onboardingNav">
        <Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link>
        <div className="onboardingNavRight"><span>Já tem uma conta?</span><Link href="/login" className="navCta">Entrar</Link></div>
      </nav>
      <section className="onboardingLayout">
        <aside className="onboardingIntro">
          <div className="eyebrow">BEM-VINDO AO PECATHO</div>
          <h1>Crie seu espaço.<br /><em>Do seu jeito.</em></h1>
          <p>Uma única conta para acessar o ecossistema Pecatho, criar seu anúncio, desenvolver sua presença no Fans ou usar os dois serviços.</p>
          <div className="onboardingBenefits">
            <div><span>01</span><strong>Uma identidade</strong><small>Seus dados ficam centralizados na sua conta.</small></div>
            <div><span>02</span><strong>Mais controle</strong><small>Você decide quais serviços deseja utilizar.</small></div>
            <div><span>03</span><strong>Mais confiança</strong><small>Cadastro preparado para verificação e publicação.</small></div>
          </div>
        </aside>
        <section className="onboardingCard">
          <div className="onboardingProgress"><div className="progressTrack"><span style={{ width: `${progress}%` }} /></div><span>{step >= 6 ? "Concluído" : `Etapa ${step} de 5`}</span></div>
          {step < 6 && <form onSubmit={submit}>
            {step === 1 && <div className="onboardingStep">
              <div className="stepIcon">✦</div><div className="stepKicker">PRIMEIRO PASSO</div><h2>Como você quer usar o Pecatho?</h2><p>Você poderá mudar e adicionar serviços depois. Esta escolha só nos ajuda a preparar sua experiência inicial.</p>
              <div className="intentGrid">
                <button type="button" className={`intentCard ${entryMode === "advertiser" ? "selected" : ""}`} onClick={() => setEntryMode("advertiser")}><span>◉</span><strong>Quero anunciar</strong><small>Criar e publicar meu perfil como anunciante.</small></button>
                <button type="button" className={`intentCard ${entryMode === "fans" ? "selected" : ""}`} onClick={() => setEntryMode("fans")}><span>◇</span><strong>Quero criar no Fans</strong><small>Produzir e vender meu próprio conteúdo.</small></button>
                <button type="button" className={`intentCard ${entryMode === "both" ? "selected" : ""}`} onClick={() => setEntryMode("both")}><span>✦</span><strong>Quero os dois</strong><small>Usar Pecatho e Fans com a mesma conta.</small></button>
              </div>
              <div className="formGrid"><label>Nome completo<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="Como devemos chamar você?" /></label><label>Data de nascimento<input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></label></div>
            </div>}
            {step === 2 && <div className="onboardingStep"><div className="stepIcon">@</div><div className="stepKicker">SUA CONTA</div><h2>Agora vamos proteger seu acesso.</h2><p>Use um e-mail que você consiga acessar. Ele será usado para confirmar a conta e recuperar o acesso.</p><div className="formStack"><label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="voce@exemplo.com" /></label><label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" /></label></div><div className="securityNote"><span>✓</span><div><strong>Confirmação por e-mail</strong><small>Seu cadastro só será ativado após a confirmação do endereço.</small></div></div></div>}
            {step === 3 && <div className="onboardingStep"><div className="stepIcon">ID</div><div className="stepKicker">IDENTIDADE</div><h2>Vamos validar seus dados básicos.</h2><p>Estas informações ajudam o Pecatho a manter uma plataforma confiável. Seu CPF não será exibido publicamente.</p><div className="formGrid"><label>CPF<input value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} inputMode="numeric" placeholder="000.000.000-00" aria-invalid={!cpfOk} />{!cpfOk && <small className="formError">CPF inválido.</small>}</label><label>Telefone<input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" /></label></div><div className="privacyNote">🔒 <span>Dados de identidade são tratados como informações privadas da conta.</span></div></div>}
            {step === 4 && <div className="onboardingStep"><div className="stepIcon">⌖</div><div className="stepKicker">LOCALIZAÇÃO</div><h2>Onde você está?</h2><p>O endereço é usado para organizar sua localização. A exibição pública poderá usar somente uma localização aproximada.</p><label>CEP<input value={cep} onChange={e => lookupCep(e.target.value)} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" />{loadingCep && <small>Consultando CEP...</small>}</label><div className="formGrid"><label>Logradouro<input value={street} onChange={e => setStreet(e.target.value)} placeholder="Rua, avenida..." /></label><label>Número<input value={number} onChange={e => setNumber(e.target.value)} placeholder="Nº" /></label></div><label>Complemento<input value={complement} onChange={e => setComplement(e.target.value)} placeholder="Apartamento, sala, referência..." /></label><div className="formGrid"><label>Bairro<input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} /></label><label>Cidade<input value={city} readOnly /></label><label>UF<input value={uf} readOnly /></label></div><small className="fieldNote">O município é identificado pelo código IBGE retornado pelo CEP e validado na base territorial do Pecatho.</small></div>}
            {step === 5 && <div className="onboardingStep"><div className="stepIcon">✓</div><div className="stepKicker">REVISÃO</div><h2>Está tudo certo?</h2><p>Confira o resumo antes de criar sua conta. Você poderá complementar seu perfil depois do primeiro acesso.</p><div className="reviewBox"><div><span>Experiência</span><strong>{entryMode === "advertiser" ? "Pecatho — Anunciante" : entryMode === "fans" ? "Pecatho Fans — Criador" : "Pecatho + Fans"}</strong></div><div><span>Nome</span><strong>{name || "Não informado"}</strong></div><div><span>E-mail</span><strong>{email || "Não informado"}</strong></div><div><span>Localização</span><strong>{city && uf ? `${city} — ${uf}` : "Não informado"}</strong></div></div><div className="reviewHint">Ao criar a conta, você receberá um e-mail de confirmação. Depois disso, o Pecatho concluirá o cadastro e levará você ao seu painel.</div></div>}
            {error && <div className="formAlert error">{error}</div>}
            {msg && <div className="formAlert success">{msg}</div>}
            <div className="stepActions"><button type="button" className="backButton" onClick={() => { setError(""); setStep(v => Math.max(1, v - 1)); }} disabled={step === 1}>Voltar</button>{step < 5 ? <button type="button" className="primaryButton wideButton" onClick={nextStep}>Continuar <span>→</span></button> : <button type="submit" className="primaryButton wideButton" disabled={busy || loadingCep}>{busy ? "Criando sua conta..." : "Criar minha conta"}</button>}</div>
          </form>}
          {step >= 6 && <div className="completion"><div className="completionIcon">✓</div><div className="stepKicker">CADASTRO RECEBIDO</div><h2>Falta só confirmar seu e-mail.</h2><p>{msg}</p><div className="completionActions"><Link href="/login" className="primaryButton">Ir para o login</Link><Link href="/" className="secondaryButton">Voltar ao início</Link></div></div>}
        </section>
      </section>
      <footer className="onboardingFooter"><span>© {new Date().getFullYear()} Pecatho</span><span>Cadastro seguro · Português (Brasil)</span></footer>
    </main>
  );
}
