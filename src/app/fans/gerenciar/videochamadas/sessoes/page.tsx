"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Session={id:string;title:string;duration_minutes:number;amount:number;currency:string;status:string;scheduled_for:string|null;confirmed_at:string|null;created_at:string;buyer_user_id:string;rejection_reason:string|null;paid_at:string|null;started_at:string|null;ended_at:string|null;ended_reason:string|null;commercial_outcome:string|null;refund_status:string|null;refund_amount:number|null;refund_reason:string|null;refund_requested_at:string|null;refund_processed_at:string|null};

export default function CreatorLiveSessionsPage(){
 const [sessions,setSessions]=useState<Session[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState<string|null>(null);

 async function load(){
  const s=createClient();
  const {data:{user}}=await s.auth.getUser();
  if(!user){window.location.href="/login?next=/fans/gerenciar/videochamadas/sessoes";return;}
  const {data:c}=await s.from("fans_creators").select("id").eq("user_id",user.id).maybeSingle();
  if(!c){setError("Espaço Fans não encontrado.");setLoading(false);return;}
  const {data,error:e}=await s.from("fans_live_sessions").select("id,title,duration_minutes,amount,currency,status,scheduled_for,confirmed_at,created_at,buyer_user_id,rejection_reason,paid_at,started_at,ended_at,ended_reason,commercial_outcome,refund_status,refund_amount,refund_reason,refund_requested_at,refund_processed_at").eq("creator_id",c.id).order("created_at",{ascending:false});
  if(e)setError("Não foi possível carregar as solicitações.");else setSessions((data??[]) as Session[]);
  setLoading(false);
 }

 useEffect(()=>{void load()},[]);

 useEffect(()=>{
  let channel: ReturnType<ReturnType<typeof createClient>["channel"]>|null=null;
  let cancelled=false;
  void (async()=>{
   const s=createClient();
   const {data:{user}}=await s.auth.getUser();
   if(!user||cancelled)return;
   const {data:c}=await s.from("fans_creators").select("id").eq("user_id",user.id).maybeSingle();
   if(!c||cancelled)return;
   channel=s.channel("fans-live-creator-sessions-"+c.id)
    .on("postgres_changes",{event:"UPDATE",schema:"public",table:"fans_live_sessions",filter:"creator_id=eq."+c.id},payload=>{
      const next=payload.new as Session;
      setSessions(current=>current.some(item=>item.id===next.id)?current.map(item=>item.id===next.id?{...item,...next}:item):current);
    })
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"fans_live_sessions",filter:"creator_id=eq."+c.id},payload=>{
      const next=payload.new as Session;
      setSessions(current=>current.some(item=>item.id===next.id)?current:[next,...current]);
    })
    .subscribe();
  })();
  return ()=>{cancelled=true;if(channel)void createClient().removeChannel(channel)};
 },[]);

 async function action(id:string,type:"confirm"|"reject"){
  setBusy(id);setError("");
  const s=createClient();
  const {error:e}=await s.rpc(type==="confirm"?"confirm_fans_live_schedule":"reject_fans_live_schedule",{p_session_id:id,...(type==="reject"?{p_reason:"Horário recusado pelo criador."}:{})});
  if(e)setError(e.message);else await load();
  setBusy(null);
 }

 const money=(v:number,c:string)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:c}).format(Number(v||0));
 const label:Record<string,string>={pending_payment:"Pagamento pendente",paid:"Aguardando horário",scheduled:"Aguardando confirmação",active:"Em andamento",completed:"Concluída",refunded:"Reembolsada",cancelled:"Cancelada",expired:"Expirada"}; const reason=(s:Session)=>{const map:Record<string,string>={creator_removed_participant:"Participante removido pelo criador",creator_ended_early:"Criador encerrou antes do término contratado",creator_ended:"Encerrada pelo criador",buyer_left:"Participante saiu da chamada",system_expired:"Encerrada automaticamente pelo sistema"};return map[s.ended_reason??""]??s.ended_reason??"—";}; const duration=(s:Session)=>s.started_at&&s.ended_at?Math.max(0,Math.round((new Date(s.ended_at).getTime()-new Date(s.started_at).getTime())/60000)):null;

 return <main className="mx-auto min-h-screen max-w-6xl bg-[#f6f7f9] px-4 py-7 sm:px-6 sm:py-10"><nav className="flex items-center justify-between"><Link href="/fans/gerenciar" className="font-semibold text-slate-950">Pecatho <span className="text-slate-500">Fans</span></Link><Link href="/fans/gerenciar/videochamadas" className="text-sm font-semibold text-slate-700">Ofertas</Link></nav><header className="mt-6 rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Área do anunciante · agenda</p><div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Solicitações de videochamada</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Confirme horários, acompanhe sessões pagas e entre na sala no momento certo.</p></div><Link href="/fans/gerenciar/videochamadas" className="inline-flex w-fit rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950">Gerenciar ofertas</Link></div></header>{error&&<p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}{loading?<p className="mt-8 text-slate-500">Carregando...</p>:<div className="mt-7 grid gap-5 md:grid-cols-2">{sessions.map(s=><article key={s.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label[s.status]??s.status}</p><h2 className="mt-2 text-xl font-bold text-slate-950">{s.title}</h2></div><strong>{money(s.amount,s.currency)}</strong></div><p className="mt-3 text-sm text-slate-600">{s.duration_minutes} minutos · comprador {s.buyer_user_id.slice(0,8)}…</p>{s.rejection_reason&&s.status==="paid"&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">O horário anterior foi recusado. O comprador pode enviar uma nova solicitação.</div>}{s.scheduled_for&&<div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm"><strong>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"full",timeStyle:"short"}).format(new Date(s.scheduled_for))}</strong>{s.confirmed_at&&<p className="mt-1 text-slate-600">Horário confirmado.</p>}</div>}{s.status==="scheduled"&&s.confirmed_at&&<Link href={`/fans/videochamadas/sala/${s.id}`} className="mt-5 block w-full rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white">Abrir sala</Link>}{s.status==="active"&&<Link href={`/fans/videochamadas/sala/${s.id}`} className="mt-5 block w-full rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">Entrar na chamada</Link>}{s.status==="completed"&&<div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-black text-slate-900">Encerramento e tratamento financeiro</p><div className="mt-3 grid gap-3 text-xs sm:grid-cols-2"><div><span className="text-slate-500">Motivo</span><p className="mt-1 font-bold text-slate-800">{reason(s)}</p></div><div><span className="text-slate-500">Duração efetiva</span><p className="mt-1 font-bold text-slate-800">{duration(s)===null?"Não registrada":duration(s)+" min"}</p></div><div><span className="text-slate-500">Valor da sessão</span><p className="mt-1 font-bold text-slate-800">{money(s.amount,s.currency)}</p></div><div><span className="text-slate-500">Resultado comercial</span><p className="mt-1 font-bold text-slate-800">{s.refund_status==="refunded"?"Reembolso integral processado":s.refund_status==="requested"?"Reembolso em processamento":s.refund_status==="failed"?"Reembolso requer tratamento":"Sessão concluída sem reembolso"}</p></div></div>{s.refund_status&&s.refund_status!=="not_required"&&<p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Reembolso: {money(Number(s.refund_amount??s.amount),s.currency)} · motivo: {s.refund_reason??"encerramento antecipado"}</p>}</div>}{s.status==="scheduled"&&!s.confirmed_at&&<div className="mt-5 grid grid-cols-2 gap-3"><button disabled={busy===s.id} onClick={()=>void action(s.id,"confirm")} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy===s.id?"...":"Confirmar"}</button><button disabled={busy===s.id} onClick={()=>void action(s.id,"reject")} className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60">Recusar</button></div>}</article>)}{sessions.length===0&&<div className="rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500">Nenhuma solicitação de videochamada.</div>}</div>}</main>;
}
