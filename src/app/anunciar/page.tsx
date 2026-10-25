"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import "./anunciar.css";

const initialForm = { contact_name: "", company_name: "", email: "", whatsapp: "", placement: "home", banner_format: "leaderboard", budget: "", message: "", website: "" };

export default function AnunciarPage() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!form.contact_name.trim() || !form.company_name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Preencha nome, empresa, e-mail e mensagem.");
      return;
    }
    setSending(true);
    try {
      const supabase = createClient();
      const { error: submitError } = await supabase.rpc("submit_public_advertising_inquiry", {
        p_contact_name: form.contact_name.trim(),
        p_company_name: form.company_name.trim(),
        p_email: form.email.trim(),
        p_whatsapp: form.whatsapp.trim(),
        p_placement: form.placement,
        p_budget: form.budget.trim(),
        p_message: `Formato preferido: ${form.banner_format}\n\n${form.message.trim()}`.slice(0, 3000),
        p_website: form.website.trim(),
      });
      if (submitError) {
        setError(submitError.message.includes("email") || submitError.message.includes("e-mail")
          ? "Confira o e-mail informado e tente novamente."
          : "Não foi possível enviar a solicitação agora. Revise os campos e tente novamente.");
        return;
      }
      setSent(true);
      setForm(initialForm);
    } catch {
      setError("Falha de conexão ao enviar a solicitação. Verifique sua internet e tente novamente; os dados preenchidos foram mantidos.");
    } finally {
      setSending(false);
    }
  }

  return <main className="advertisingLeadPage">
    <header className="advertisingLeadNav">
      <Link href="/" className="advertisingLeadBrand"><span>P</span> PECATHO</Link>
      <nav><Link href="/fans">Pecatho Fans</Link><Link href="/anunciantes">Explorar catálogo</Link><Link href="/cadastro">Criar perfil</Link></nav>
    </header>
    <section className="advertisingLeadHero">
      <div className="advertisingLeadCopy">
        <div className="advertisingLeadEyebrow">PUBLICIDADE · PARCERIAS COMERCIAIS</div>
        <h1>Sua marca, <em>em evidência.</em></h1>
        <p>Conte para a equipe Pecatho o que sua marca precisa. Vamos registrar sua solicitação e entrar em contato para alinhar formato, disponibilidade, período e condições de veiculação.</p>
        <ul><li>Espaços promocionais na página inicial</li><li>Campanhas próprias e de anunciantes</li><li>Planejamento de período e posicionamento</li></ul>
        <p className="advertisingLeadNote">Enviar o formulário não ativa anúncios nem representa contratação ou cobrança. A equipe confirma os detalhes antes da veiculação.</p>
      </div>
      <section className="advertisingLeadFormCard">
        {sent ? <div className="advertisingLeadSuccess" role="status"><span>✓</span><h2>Solicitação recebida</h2><p>Seu contato foi registrado para análise da equipe comercial. A solicitação não está publicada como anúncio.</p><button type="button" onClick={() => setSent(false)}>Enviar outra solicitação</button></div> :
        <form onSubmit={submit}>
          <h2>Solicitar proposta comercial</h2><p>Os campos com * são obrigatórios.</p>
          {error && <div className="advertisingLeadError" role="alert">{error}</div>}
          <label>Seu nome *<input required maxLength={120} autoComplete="name" value={form.contact_name} onChange={e => setForm({...form,contact_name:e.target.value})} /></label>
          <label>Empresa ou marca *<input required maxLength={160} autoComplete="organization" value={form.company_name} onChange={e => setForm({...form,company_name:e.target.value})} /></label>
          <div className="advertisingLeadFields"><label>E-mail comercial *<input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} /></label><label>WhatsApp<input maxLength={40} autoComplete="tel" value={form.whatsapp} onChange={e => setForm({...form,whatsapp:e.target.value})} /></label></div>
          <label>Onde deseja anunciar?<select value={form.placement} onChange={e => setForm({...form,placement:e.target.value})}><option value="home">Página inicial</option><option value="home_top">Página inicial · superior</option><option value="home_mid">Página inicial · intermediária</option><option value="home_bottom">Página inicial · inferior</option><option value="fans">Pecatho Fans</option><option value="catalog">Catálogo</option></select></label>
          <label>Formato preferido do banner<select value={form.banner_format} onChange={e => setForm({...form,banner_format:e.target.value})}><option value="leaderboard">Faixa horizontal · proporção 5:1 (até 1200 × 240 px)</option><option value="rectangle">Retangular · proporção 2:1 (até 600 × 300 px)</option><option value="square">Quadrado · proporção 1:1 (até 600 × 600 px)</option><option value="vertical">Vertical · proporção 1:2 (até 300 × 600 px)</option><option value="consultation">Preciso de orientação sobre o formato</option></select></label>
          <p className="advertisingLeadFormatNote">A escolha é uma preferência para a proposta. A equipe confirma o formato compatível com a posição, o material e o período contratados.</p>
          <label>Orçamento estimado (opcional)<input maxLength={80} value={form.budget} onChange={e => setForm({...form,budget:e.target.value})} placeholder="Ex.: ainda em definição" /></label>
          <label>Conte um pouco sobre a campanha *<textarea required maxLength={2800} rows={5} value={form.message} onChange={e => setForm({...form,message:e.target.value})} placeholder="Objetivo, público, período desejado e outras informações relevantes." /></label>
          <label className="advertisingLeadHoneypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => setForm({...form,website:e.target.value})} /></label>
          <button className="advertisingLeadSubmit" type="submit" disabled={sending}>{sending ? "Enviando solicitação…" : "Enviar solicitação comercial"}</button>
          <small>Ao enviar, você autoriza a equipe Pecatho a usar os dados informados para responder a esta solicitação.</small>
        </form>}
      </section>
    </section>
    <footer className="advertisingLeadFooter"><Link href="/">← Voltar à página inicial</Link><span>PECATHO · Relacionamento comercial</span></footer>
  </main>;
}
