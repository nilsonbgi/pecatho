"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type OwnReport = { id: string; category: string; justification: string; status: string; created_at: string; target_user_id: string };
type Block = { id: string; blocked_user_id: string; reason: string; created_at: string };

const categoryLabels: Record<string, string> = {
  fraude: "Fraude ou golpe", assedio: "Assédio ou perseguição", ameaca: "Ameaça ou chantagem",
  privacidade: "Exposição de dados privados", conteudo_sem_consentimento: "Conteúdo sem consentimento",
  falsa_identidade: "Falsa identidade", spam: "Spam ou abuso", outro: "Outro motivo"
};
const statusLabels: Record<string, string> = { submitted: "Recebida", under_review: "Em análise", actioned: "Medida aplicada", rejected: "Não procedente", appealed: "Contestada", closed: "Encerrada" };
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
const maxBytes = 10 * 1024 * 1024;

export default function SafetyCenterPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState("");
  const [reports, setReports] = useState<OwnReport[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [targetUsername, setTargetUsername] = useState("");
  const [category, setCategory] = useState("assedio");
  const [justification, setJustification] = useState("");
  const [incidentAt, setIncidentAt] = useState("");
  const [evidence, setEvidence] = useState<File[]>([]);
  const [blockReason, setBlockReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.assign("/login"); return; }
    setUserId(auth.user.id);
    const [r, b] = await Promise.all([
      supabase.from("governance_reports").select("id,category,justification,status,created_at,target_user_id").order("created_at", { ascending: false }).limit(30),
      supabase.from("governance_user_blocks").select("id,blocked_user_id,reason,created_at").order("created_at", { ascending: false }).limit(100)
    ]);
    if (r.error) setError("Não foi possível carregar os registros. Confirme se a governança já foi habilitada no banco.");
    else setReports((r.data || []) as OwnReport[]);
    if (!b.error) setBlocks((b.data || []) as Block[]);
  }
  useEffect(() => { void load(); }, []);

  async function findTarget() {
    const username = targetUsername.trim().replace(/^@/, "");
    if (!username) throw new Error("Informe o nome de usuário da pessoa.");
    const { data, error: lookupError } = await supabase.from("profiles").select("id,username").ilike("username", username).limit(2);
    if (lookupError) throw lookupError;
    const match = (data || []).find((p) => String(p.username || "").toLowerCase() === username.toLowerCase());
    if (!match) throw new Error("Usuário não encontrado. Confira o nome de usuário e tente novamente.");
    if (match.id === userId) throw new Error("Você não pode bloquear ou denunciar a própria conta.");
    return String(match.id);
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    let uploaded: string[] = [];
    try {
      if (justification.trim().length < 30) throw new Error("Descreva o ocorrido com pelo menos 30 caracteres.");
      if (evidence.length > 5) throw new Error("Anexe no máximo cinco evidências por denúncia.");
      for (const file of evidence) {
        if (!allowedTypes.includes(file.type)) throw new Error("Formato não permitido. Use JPG, PNG, WEBP, HEIC ou PDF.");
        if (file.size <= 0 || file.size > maxBytes) throw new Error("Cada evidência deve ter no máximo 10 MB.");
      }
      const target = await findTarget();
      const { data: report, error: reportError } = await supabase.from("governance_reports").insert({
        reporter_user_id: userId, target_user_id: target, category, justification: justification.trim(),
        incident_at: incidentAt ? new Date(incidentAt).toISOString() : null
      }).select("id").single();
      if (reportError || !report) throw reportError || new Error("Não foi possível registrar a denúncia.");
      for (const file of evidence) {
        const extension = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
        const path = userId + "/" + report.id + "/" + crypto.randomUUID() + "." + extension;
        const { error: uploadError } = await supabase.storage.from("governance-evidence").upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error("Denúncia registrada, mas um anexo não foi enviado: " + uploadError.message + ". O registro permanece salvo; tente anexar a evidência novamente pelo suporte.");
        uploaded.push(path);
        const { error: metadataError } = await supabase.from("governance_evidence").insert({
          report_id: report.id, uploader_user_id: userId, storage_bucket: "governance-evidence",
          storage_path: path, original_filename: file.name.slice(0,255), mime_type: file.type, size_bytes: file.size
        });
        if (metadataError) throw new Error("Arquivo enviado, mas o registro da evidência falhou. Informe o suporte e o protocolo " + report.id + ".");
      }
      setMessage("Denúncia registrada. O protocolo é " + report.id + ". A equipe analisará o relato; a denúncia não suspende automaticamente a conta denunciada.");
      setTargetUsername(""); setJustification(""); setIncidentAt(""); setEvidence([]);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível enviar a denúncia."); }
    finally { setBusy(false); }
  }

  async function blockUser(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const target = await findTarget();
      if (blockReason.trim().length < 10) throw new Error("Explique o motivo do bloqueio pessoal com pelo menos 10 caracteres.");
      const { error: insertError } = await supabase.from("governance_user_blocks").insert({ blocker_user_id: userId, blocked_user_id: target, reason: blockReason.trim() });
      if (insertError) throw insertError;
      setMessage("Bloqueio pessoal registrado. Isso não suspende a conta da outra pessoa para toda a plataforma.");
      setBlockReason(""); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível bloquear essa pessoa."); }
    finally { setBusy(false); }
  }

  async function unblock(id: string) {
    setBusy(true); setError(""); setMessage("");
    const { error: deleteError } = await supabase.from("governance_user_blocks").delete().eq("id", id);
    if (deleteError) setError(deleteError.message); else { setMessage("Bloqueio pessoal removido."); await load(); }
    setBusy(false);
  }

  return <main className="shell safetyPage">
    <nav className="topbar"><Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link><Link href="/como-funciona" className="navCta">Regras da comunidade</Link></nav>
    <section className="hero" style={{maxWidth:1050}}><div className="eyebrow">SEGURANÇA · PRIVACIDADE · GOVERNANÇA</div><h1>Central de <em>segurança.</em></h1><p className="heroCopy">Bloqueie alguém para proteger sua própria experiência ou envie uma denúncia confidencial para análise da equipe. São medidas diferentes: um bloqueio pessoal não coloca automaticamente outra conta na Blacklist geral.</p>
      {message && <p className="feedback success">{message}</p>}{error && <p className="feedback failure">{error}</p>}
      <div className="safetyGrid">
        <section className="panel"><div className="eyebrow">PROTEÇÃO PESSOAL</div><h2>Bloquear um usuário</h2><p>O bloqueio registra sua preferência de segurança. Ele não é uma punição global nem substitui a denúncia de uma conduta grave.</p><form onSubmit={blockUser}><label>Nome de usuário<input value={targetUsername} onChange={e=>setTargetUsername(e.target.value)} placeholder="@nome_de_usuario" required /></label><label>Motivo para seu registro privado<textarea value={blockReason} onChange={e=>setBlockReason(e.target.value)} minLength={10} maxLength={1000} required placeholder="Ex.: não desejo mais receber contato desta conta." /></label><button className="primaryButton" disabled={busy}>Bloquear para mim</button></form></section>
        <section className="panel"><div className="eyebrow">DENÚNCIA CONFIDENCIAL</div><h2>Solicitar análise da equipe</h2><p>Informe fatos objetivos. A equipe avaliará o contexto; uma denúncia, por si só, não prova a infração nem suspende automaticamente a conta.</p><form onSubmit={submitReport}><label>Nome de usuário da pessoa denunciada<input value={targetUsername} onChange={e=>setTargetUsername(e.target.value)} placeholder="@nome_de_usuario" required /></label><label>Categoria<select value={category} onChange={e=>setCategory(e.target.value)}>{Object.entries(categoryLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Quando ocorreu (opcional)<input type="datetime-local" value={incidentAt} onChange={e=>setIncidentAt(e.target.value)} /></label><label>Relato objetivo<textarea value={justification} onChange={e=>setJustification(e.target.value)} minLength={30} maxLength={5000} required placeholder="Descreva o que aconteceu, quando ocorreu e qual regra acredita ter sido violada. Evite incluir dados pessoais desnecessários." /></label><label>Evidências (até 5 arquivos, 10 MB cada)<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" multiple onChange={e=>setEvidence(Array.from(e.target.files||[]))} /><small>Armazenamento privado; somente você e a equipe autorizada podem acessar os anexos. Preserve os originais e não publique as provas.</small></label><button className="primaryButton" disabled={busy}>{busy ? "Enviando…" : "Enviar denúncia confidencial"}</button></form></section>
      </div>
    </section>
    <section className="section"><div className="eyebrow">SEUS REGISTROS</div><h2>Denúncias enviadas</h2>{reports.length ? <div className="reportList">{reports.map(r=><article key={r.id} className="record"><div><strong>{categoryLabels[r.category]||r.category}</strong><small>Protocolo: {r.id}</small><p>{r.justification}</p><small>{new Date(r.created_at).toLocaleString("pt-BR")}</small></div><span className="status">{statusLabels[r.status]||r.status}</span></article>)}</div>:<p className="muted">Nenhuma denúncia registrada ou ainda não foi possível carregar os registros.</p>}</section>
    <section className="section"><div className="eyebrow">SEUS BLOQUEIOS</div><h2>Bloqueios pessoais</h2>{blocks.length ? <div className="reportList">{blocks.map(b=><article key={b.id} className="record"><div><strong>Usuário: {b.blocked_user_id}</strong><p>{b.reason}</p><small>{new Date(b.created_at).toLocaleString("pt-BR")}</small></div><button className="secondaryButton" disabled={busy} onClick={()=>void unblock(b.id)}>Desbloquear</button></article>)}</div>:<p className="muted">Você ainda não tem bloqueios pessoais ativos.</p>}</section>
    <style jsx>{`
      .safetyPage{color:#F7F8FC}.safetyPage h1,.safetyPage h2{color:#FAFAFC}.safetyPage p,.safetyPage small,.muted{color:#C6CBD6;line-height:1.65}
      .safetyGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:28px}
      .panel{background:#171A24;border:1px solid rgba(231,195,63,.2);border-radius:20px;padding:22px;min-width:0}
      .panel h2,.section h2{font-size:24px;letter-spacing:-.03em;margin:8px 0}
      form{display:grid;gap:14px;margin-top:18px}label{display:grid;gap:7px;color:#F4F6FB;font-size:13px;font-weight:750}
      input,textarea,select{width:100%;min-width:0;border:1px solid #454958;border-radius:10px;background:#0D0F16;color:#F7F8FC;padding:12px;font:inherit}
      textarea{min-height:118px;resize:vertical}input[type=file]{font-size:12px}small{font-size:11px;font-weight:500}
      .feedback{padding:14px;border-radius:12px}.success{background:#123226;border:1px solid #287452}.failure{background:#3A1B22;border:1px solid #9B3847}
      .section{margin:40px 0}.reportList{display:grid;gap:10px}.record{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:16px;background:#171A24;border:1px solid #303442;border-radius:14px}.record p{margin:8px 0;white-space:pre-wrap;overflow-wrap:anywhere}.record small{display:block}.status{white-space:nowrap;padding:6px 9px;border-radius:99px;background:#292B35;color:#E7C33F;font-size:11px;font-weight:800}
      @media(max-width:720px){.safetyGrid{grid-template-columns:1fr}.panel{padding:18px}.record{flex-direction:column}}
    `}</style>
  </main>;
}
