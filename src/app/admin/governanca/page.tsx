"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Evidence = { id: string; storage_path: string; original_filename: string; mime_type: string; size_bytes: number };
type Report = { id: string; reporter_user_id: string; target_user_id: string; category: string; justification: string; status: string; created_at: string; incident_at: string|null; decision_reason: string|null; triage_note: string|null; evidence?: Evidence[] };
type Decision = { outcome: string; rationale: string; suspension_until?: string };
type DecisionRecord = { id: string; outcome: string; rationale: string; suspension_until: string | null; created_at: string; reviewer_user_id: string };

const categories: Record<string,string> = {fraude:"Fraude/golpe",assedio:"Assédio",ameaca:"Ameaça/chantagem",privacidade:"Privacidade",conteudo_sem_consentimento:"Conteúdo sem consentimento",falsa_identidade:"Falsa identidade",spam:"Spam/abuso",outro:"Outro"};
const statuses: Record<string,string> = {submitted:"Recebida",under_review:"Em análise",actioned:"Medida aplicada",rejected:"Não procedente",appealed:"Contestada",closed:"Encerrada"};
const outcomes: Record<string,string> = {no_action:"Sem medida",warning:"Advertência",temporary_suspension:"Suspensão temporária",permanent_suspension:"Suspensão permanente",content_removal:"Remoção de conteúdo"};

export default function GovernanceAdminPage(){
 const supabase=createClient();
 const [authorized,setAuthorized]=useState<boolean|null>(null);
 const [reports,setReports]=useState<Report[]>([]);
 const [selected,setSelected]=useState<Report|null>(null);
 const [evidence,setEvidence]=useState<Array<Evidence&{url?:string}>>([]);
 const [history,setHistory]=useState<DecisionRecord[]>([]);
 const [decision,setDecision]=useState<Decision>({outcome:"warning",rationale:""});
 const [triageNote,setTriageNote]=useState("");
 const [status,setStatus]=useState("under_review");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [queueSearch,setQueueSearch]=useState("");
 const [queueStatusFilter,setQueueStatusFilter]=useState("all");
 const filteredReports=reports.filter(report=>{
  const term=queueSearch.trim().toLocaleLowerCase("pt-BR");
  const matchesStatus=queueStatusFilter==="all"||report.status===queueStatusFilter;
  const searchable=[report.id,report.reporter_user_id,report.target_user_id,report.category,categories[report.category]||"",report.justification].join(" ").toLocaleLowerCase("pt-BR");
  return matchesStatus&&(!term||searchable.includes(term));
 });
 async function load(){
  setError("");
  const {data,error:loadError}=await supabase.from("governance_reports").select("id,reporter_user_id,target_user_id,category,justification,status,created_at,incident_at,decision_reason,triage_note").order("created_at",{ascending:true}).limit(200);
  if(loadError){setError("Não foi possível carregar a fila de governança. Confirme a migration e suas permissões: "+loadError.message);return;}
  setReports((data||[]) as Report[]);
 }
 useEffect(()=>{(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){setAuthorized(false);return;}const {data:role,error:roleError}=await supabase.from("user_roles").select("role").eq("user_id",user.id).in("role",["super_admin","admin","moderator","support"]).limit(1).maybeSingle();if(roleError){setError(roleError.message);setAuthorized(false);return;}setAuthorized(Boolean(role));if(role)await load();})();},[]);
 async function openReport(report:Report){
  setSelected(report);setEvidence([]);setError("");setMessage("");setTriageNote(report.triage_note||"");setDecision(d=>({...d,rationale:"",suspension_until:""}));
  const [{data,error:evidenceError},{data:historyData,error:historyError}]=await Promise.all([
   supabase.from("governance_evidence").select("id,storage_path,original_filename,mime_type,size_bytes").eq("report_id",report.id).order("created_at"),
   supabase.from("governance_decisions").select("id,outcome,rationale,suspension_until,created_at,reviewer_user_id").eq("report_id",report.id).order("created_at",{ascending:false}),
  ]);
  if(evidenceError){setError(evidenceError.message);return;}
  if(historyError){setError(historyError.message);return;}
  const list=(data||[]) as Evidence[];
  const signed=await Promise.all(list.map(async item=>{const {data:result,error}=await supabase.storage.from("governance-evidence").createSignedUrl(item.storage_path,300);return {...item,url:error?undefined:result?.signedUrl};}));
  setEvidence(signed);setHistory((historyData||[]) as DecisionRecord[]);setStatus(report.status==="submitted"?"under_review":report.status);
 }
 async function saveStatus(){
  if(!selected)return;
  if(["actioned","rejected","closed"].includes(status)&&status!==selected.status){
   setError("Para encerrar uma denúncia ou aplicar uma medida, use “Registrar decisão”. Essa ação cria o registro auditável no histórico de decisões.");
   return;
  }
  setBusy(true);setError("");setMessage("");
  try{
   const user=(await supabase.auth.getUser()).data.user;
   if(!user)throw new Error("Sessão expirada. Entre novamente para continuar.");
   const {error:saveError}=await supabase.from("governance_reports").update({
    status,
    triage_note:triageNote.trim()||null,
    reviewer_user_id:user.id,
    ...( ["submitted","under_review","appealed"].includes(status) ? {decided_at:null} : {})
   }).eq("id",selected.id);
   if(saveError)throw saveError;
   setMessage("Triagem atualizada. As medidas finais devem ser registradas pela ação de decisão para preservar o histórico.");
   await load();
   setSelected({...selected,status,triage_note:triageNote.trim()||null});
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível salvar a triagem.");}
  finally{setBusy(false);}
 }
 async function saveDecision(){
  if(!selected)return;setBusy(true);setError("");setMessage("");
  try{
   if(decision.rationale.trim().length<20)throw new Error("A fundamentação deve conter pelo menos 20 caracteres.");
   const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error("Sessão expirada.");
   const until=decision.outcome==="temporary_suspension"?decision.suspension_until:null;
   if(decision.outcome==="temporary_suspension"&&!until)throw new Error("Defina a data final da suspensão temporária.");
   const {error:decisionError}=await supabase.rpc("record_governance_decision",{
    p_report_id:selected.id,
    p_reviewer_user_id:user.id,
    p_outcome:decision.outcome,
    p_rationale:decision.rationale.trim(),
    p_suspension_until:until?new Date(until).toISOString():null
   });
   if(decisionError)throw decisionError;
   const nextStatus=decision.outcome==="no_action"?"rejected":"actioned";
   setMessage(decision.outcome === "temporary_suspension" ? "Decisão registrada. A conta foi suspensa; o prazo será aplicado e a liberação será processada no próximo acesso autenticado ao painel após a data final." : decision.outcome === "permanent_suspension" ? "Decisão registrada. O status central da conta foi alterado para bloqueado." : "Decisão registrada de forma transacional, com histórico de auditoria.");
   setSelected({...selected,status:nextStatus});
   const {data:historyData,error:historyError}=await supabase.from("governance_decisions").select("id,outcome,rationale,suspension_until,created_at,reviewer_user_id").eq("report_id",selected.id).order("created_at",{ascending:false});
   if(historyError)setError(historyError.message);else setHistory((historyData||[]) as DecisionRecord[]);
   await load();
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível salvar a decisão.");}
  finally{setBusy(false);}
 }
 if(authorized===null)return <main className="shell"><section className="hero"><h1>Carregando governança…</h1></section></main>;
 if(!authorized)return <main className="shell"><section className="hero"><h1>Acesso restrito.</h1><p>Somente a equipe de moderação autorizada pode acessar denúncias e evidências.</p><Link href="/admin" className="primaryButton">Voltar</Link></section></main>;
 return <main className="shell governancePage"><nav className="topbar"><Link href="/admin" className="brand"><span className="brandMark">P</span><span>Administração Pecatho</span></Link><Link href="/painel/seguranca" className="navCta">Central do usuário</Link></nav><section className="hero" style={{maxWidth:1500}}><div className="eyebrow">MODERAÇÃO · AUDITORIA · PRIVACIDADE</div><h1>Governança da <em>comunidade.</em></h1><p className="heroCopy">Fila de denúncias, evidências privadas, decisões fundamentadas e histórico. A denúncia não equivale a prova conclusiva; registre uma decisão proporcional ao contexto.</p>{message&&<p className="feedback success">{message}</p>}{error&&<p className="feedback failure">{error}</p>}
 <div className="layout"><aside className="queue"><div className="queueHeader"><h2>Fila de denúncias</h2><span className="queueCount">{filteredReports.length} / {reports.length}</span></div><label className="queueLabel" htmlFor="governance-search">Buscar por protocolo, usuário ou relato</label><input id="governance-search" className="queueSearch" value={queueSearch} onChange={e=>setQueueSearch(e.target.value)} placeholder="Digite para pesquisar..." /><label className="queueLabel" htmlFor="governance-status">Filtrar por status</label><select id="governance-status" className="queueSearch" value={queueStatusFilter} onChange={e=>setQueueStatusFilter(e.target.value)}><option value="all">Todos os status</option>{Object.entries(statuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>{filteredReports.length===0?<p className="muted queueEmpty">Nenhuma denúncia corresponde aos filtros.</p>:filteredReports.map(r=><button type="button" key={r.id} className={"queueItem "+(selected?.id===r.id?"active":"")} onClick={()=>void openReport(r)}><strong>{categories[r.category]||r.category}</strong><small>{statuses[r.status]||r.status}</small><small>{new Date(r.created_at).toLocaleString("pt-BR")}</small><small>Protocolo {r.id.slice(0,8)}</small></button>)}</aside>
 <section className="detail">{!selected?<div><h2>Selecione uma denúncia</h2><p>Os relatos e anexos só ficam disponíveis para usuários autorizados da equipe.</p></div>:<><div className="detailHead"><div><span className="pill">{statuses[selected.status]||selected.status}</span><h2>{categories[selected.category]||selected.category}</h2><small>Protocolo: {selected.id}</small></div><span className="pill">Data: {new Date(selected.created_at).toLocaleDateString("pt-BR")}</span></div><div className="identifiers"><p><strong>Denunciante:</strong><code>{selected.reporter_user_id}</code></p><p><strong>Usuário denunciado:</strong><code>{selected.target_user_id}</code></p><p><strong>Ocorrido em:</strong>{selected.incident_at?new Date(selected.incident_at).toLocaleString("pt-BR"):"Não informado"}</p></div><h3>Relato apresentado</h3><p className="statement">{selected.justification}</p><h3>Evidências privadas ({evidence.length})</h3>{evidence.length?<div className="evidenceGrid">{evidence.map(item=><article key={item.id} className="evidenceCard"><strong>{item.original_filename}</strong><small>{item.mime_type} · {(item.size_bytes/1024/1024).toFixed(2)} MB</small>{item.url?<a href={item.url} target="_blank" rel="noreferrer">Abrir evidência temporária</a>:<small>Arquivo indisponível ou sem permissão</small>}</article>)}</div>:<p className="muted">Nenhum anexo cadastrado.</p>}<h3>Histórico de decisões</h3>{history.length?<div className="historyList">{history.map(item=><article key={item.id} className="historyItem"><strong>{outcomes[item.outcome]||item.outcome}</strong><small>{new Date(item.created_at).toLocaleString("pt-BR")} · responsável {item.reviewer_user_id}</small><p>{item.rationale}</p>{item.suspension_until&&<small>Suspensão até {new Date(item.suspension_until).toLocaleString("pt-BR")}</small>}</article>)}</div>:<p className="muted">Ainda não há decisões registradas para este protocolo.</p>}<h3>Triagem</h3><div className="field"><label>Status da triagem</label><select value={status} onChange={e=>setStatus(e.target.value)}>{Object.entries(statuses).filter(([v])=>["submitted","under_review","appealed"].includes(v)||v===selected.status).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select><small className="muted">Medidas finais (aplicada, não procedente ou encerrada) devem ser registradas em “Decisão administrativa” para manter o histórico de auditoria.</small></div><div className="field"><label>Nota da análise / motivo</label><textarea value={triageNote} onChange={e=>setTriageNote(e.target.value)} placeholder="Registre a nota de triagem, os fatos pendentes e o próximo encaminhamento." /></div><button className="secondaryButton" disabled={busy} onClick={()=>void saveStatus()}>Salvar triagem</button><h3>Decisão administrativa</h3><p className="muted">Suspensões temporárias e permanentes atualizam o status central da conta. A suspensão temporária é restaurada no próximo acesso autenticado ao painel após o prazo final; bloqueios permanentes exigem revisão administrativa.</p><div className="field"><label>Medida</label><select value={decision.outcome} onChange={e=>setDecision(d=>({...d,outcome:e.target.value}))}>{Object.entries(outcomes).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></div>{decision.outcome==="temporary_suspension"&&<div className="field"><label>Suspensão até</label><input type="datetime-local" value={decision.suspension_until||""} onChange={e=>setDecision(d=>({...d,suspension_until:e.target.value}))}/></div>}<div className="field"><label>Fundamentação obrigatória (mínimo 20 caracteres)</label><textarea value={decision.rationale} onChange={e=>setDecision(d=>({...d,rationale:e.target.value}))} placeholder="Explique os fatos considerados, a regra aplicável e a proporcionalidade da medida." /></div><button className="primaryButton" disabled={busy} onClick={()=>void saveDecision()}>Registrar decisão</button></>}</section></div></section>
 <style jsx>{`
 .governancePage{color:#F7F8FC}.governancePage h1,.governancePage h2,.governancePage h3{color:#F8FAFC}.governancePage p,.governancePage small,.muted{color:#C5CBD7;line-height:1.65}
 .layout{display:grid;grid-template-columns:minmax(260px,330px) minmax(0,1fr);gap:18px;margin-top:25px;align-items:start}
 .queue,.detail{min-width:0;border:1px solid #343846;border-radius:18px;background:#151821;padding:18px}.queueHeader{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px}.queue h2{font-size:20px;margin:0}.queueCount{font-size:11px;color:#E7C33F;font-weight:800;white-space:nowrap}.queueLabel{display:block;font-size:11px;font-weight:800;color:#C5CBD7;margin:12px 0 6px}.queueSearch{display:block;width:100%;box-sizing:border-box;padding:10px;background:#0E1017;border:1px solid #454958;border-radius:10px;color:#F7F8FC;font:inherit;font-size:12px}.queueEmpty{padding:10px 0;font-size:12px}.queueItem{display:grid;text-align:left;width:100%;gap:5px;padding:13px;margin-bottom:8px;border:1px solid #343846;border-radius:12px;background:#0E1017;color:#F7F8FC;cursor:pointer}.queueItem.active{border-color:#E7C33F;background:#24232A}.queueItem strong{font-size:13px}.queueItem small{font-size:11px;overflow-wrap:anywhere}
 .detail h2{margin:6px 0;font-size:23px}.detail h3{margin:24px 0 10px}.detailHead{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.pill{display:inline-flex;border-radius:999px;padding:6px 9px;background:#292C36;color:#E7C33F;font-size:11px;font-weight:800}.identifiers{display:grid;gap:5px;margin:18px 0;padding:14px;border-radius:12px;background:#20232D}.identifiers p{margin:0;display:grid;gap:4px;font-size:12px}.identifiers code{overflow-wrap:anywhere;color:#E7C33F}.statement{white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid #343846;border-radius:12px;padding:16px;background:#0E1017}
 .evidenceGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.evidenceCard{display:grid;gap:8px;align-content:start;padding:13px;border:1px solid #343846;border-radius:12px}.evidenceCard strong{overflow-wrap:anywhere}.evidenceCard a{color:#E7C33F;font-weight:800}.field{display:grid;gap:7px;margin:12px 0}.field label{font-size:12px;font-weight:800}.field select,.field textarea,.field input{width:100%;padding:11px;background:#0E1017;border:1px solid #454958;border-radius:10px;color:#F7F8FC;font:inherit}.field textarea{min-height:100px;resize:vertical}.historyList{display:grid;gap:9px}.historyItem{display:grid;gap:6px;padding:13px;border:1px solid #343846;border-radius:12px;background:#0E1017}.historyItem p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.historyItem small{font-size:11px;overflow-wrap:anywhere}.feedback{padding:14px;border-radius:12px}.success{background:#123226;border:1px solid #287452}.failure{background:#3A1B22;border:1px solid #9B3847}
 @media(max-width:800px){.layout{grid-template-columns:1fr}.queue{max-height:400px;overflow:auto}}
 `}</style>
 </main>;
}
