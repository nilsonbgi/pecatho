"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Session = {
  id:string; title:string; duration_minutes:number; amount:number; currency:string;
  status:string; scheduled_for:string|null; confirmed_at:string|null; created_at:string;
  creator_id:string; rejection_reason:string|null;
};

const statusMap:Record<string,{label:string; tone:string}> = {
 pending_payment:{label:"Pagamento pendente",tone:"bg-amber-50 text-amber-700 border-amber-200"},
 paid:{label:"Escolha seu horário",tone:"bg-emerald-50 text-emerald-700 border-emerald-200"},
 scheduled:{label:"Agendamento",tone:"bg-blue-50 text-blue-700 border-blue-200"},
 active:{label:"Em andamento",tone:"bg-violet-50 text-violet-700 border-violet-200"},
 completed:{label:"Concluída",tone:"bg-slate-100 text-slate-600 border-slate-200"},
 refunded:{label:"Reembolsada",tone:"bg-slate-100 text-slate-600 border-slate-200"},
 cancelled:{label:"Cancelada",tone:"bg-slate-100 text-slate-600 border-slate-200"},
 expired:{label:"Expirada",tone:"bg-slate-100 text-slate-600 border-slate-200"},
};

export default function MyFansCallsPage(){
 const [sessions,setSessions]=useState<Session[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [saving,setSaving]=useState<string|null>(null);
 const [dates,setDates]=useState<Record<string,string>>({});

 async function load(){
  const s=createClient();
  const {data:{user}}=await s.auth.getUser();
  if(!user){window.location.href="/login?next=/fans/videochamadas";return;}
  const {data,error}=await s.from("fans_live_sessions").select("id,title,duration_minutes,amount,currency,status,scheduled_for,confirmed_at,created_at,creator_id,rejection_reason").eq("buyer_user_id",user.id).order("created_at",{ascending:false});
  if(error)setError("Não foi possível carregar suas videochamadas.");
  else setSessions((data??[]) as Session[]);
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
   channel=s.channel("fans-live-buyer-sessions-"+user.id)
    .on("postgres_changes",{event:"UPDATE",schema:"public",table:"fans_live_sessions",filter:"buyer_user_id=eq."+user.id},payload=>{
      const next=payload.new as Session;
      setSessions(current=>{
       const exists=current.some(item=>item.id===next.id);
       if(!exists)return current;
       return current.map(item=>item.id===next.id?{...item,...next}:item);
      });
    })
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"fans_live_sessions",filter:"buyer_user_id=eq."+user.id},payload=>{
      const next=payload.new as Session;
      setSessions(current=>current.some(item=>item.id===next.id)?current:[next,...current]);
    })
    .subscribe();
  })();
  return ()=>{cancelled=true;if(channel)void createClient().removeChannel(channel)};
 },[]);

 async function schedule(id:string){
  const value=dates[id];
  if(!value){setError("Informe a data e horário.");return;}
  setSaving(id);setError("");
  const {error}=await createClient().rpc("request_fans_live_schedule",{p_session_id:id,p_scheduled_for:new Date(value).toISOString()});
  if(error)setError(error.message); else await load();
  setSaving(null);
 }

 const money=(v:number,c:string)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:c}).format(Number(v||0));
 const state=(s:Session)=>statusMap[s.status]??{label:s.status,tone:"bg-slate-100 text-slate-600 border-slate-200"};
 const active=sessions.filter(s=>["paid","scheduled","active"].includes(s.status)).length;
 const finished=sessions.filter(s=>["completed","refunded","cancelled","expired"].includes(s.status)).length;

 return <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
  <nav className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
   <Link href="/fans" className="text-lg font-black tracking-tight">Pecatho <span className="font-medium text-slate-400">Fans</span></Link>
   <div className="flex items-center gap-2"><Link href="/fans" className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 sm:block">Explorar</Link><Link href="/fans/gerenciar" className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Meu painel</Link></div>
  </div></nav>
  <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
   <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
     <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Área do cliente</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Minhas videochamadas</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Acompanhe seus pagamentos, escolha horários e entre na sala quando o criador confirmar.</p></div>
     <Link href="/fans" className="inline-flex w-fit rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950">Encontrar criadores</Link>
    </div>
    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Total</p><strong className="mt-1 block text-2xl">{sessions.length}</strong></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Em andamento</p><strong className="mt-1 block text-2xl">{active}</strong></div><div className="hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:block"><p className="text-xs text-slate-400">Finalizadas</p><strong className="mt-1 block text-2xl">{finished}</strong></div></div>
   </header>
   {error&&<div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
   {loading?<div className="py-16 text-center text-sm text-slate-500">Carregando suas videochamadas...</div>:sessions.length===0?
    <div className="mt-8 rounded-3xl border border-dashed bg-white p-12 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl">◉</div><h2 className="mt-4 text-xl font-bold">Você ainda não contratou uma videochamada</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Explore os criadores e escolha uma experiência privada quando encontrar uma oferta que combine com você.</p><Link href="/fans" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Explorar Pecatho Fans</Link></div>
    :
    <section className="mt-8 grid gap-5 lg:grid-cols-2">{sessions.map(s=>{const st=state(s);return <article key={s.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
     <div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${st.tone}`}>{st.label}</span><h2 className="mt-3 truncate text-xl font-black">{s.title}</h2><p className="mt-1 text-sm text-slate-500">{s.duration_minutes} minutos · contratação privada</p></div><strong className="shrink-0 text-lg">{money(s.amount,s.currency)}</strong></div></div>
     <div className="p-5 sm:p-6">
      {s.status==="paid"&&<div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><p className="text-sm font-bold text-emerald-900">{s.rejection_reason?"O criador recusou o horário anterior.":"Pagamento confirmado"}</p><p className="mt-1 text-xs leading-5 text-emerald-800">{s.rejection_reason?s.rejection_reason+" Escolha outro horário para enviar uma nova solicitação.":"Escolha um horário disponível para enviar ao criador."}</p><label className="mt-4 block text-xs font-bold text-slate-700">Data e horário<input type="datetime-local" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950" value={dates[s.id]??""} min={new Date().toISOString().slice(0,16)} onChange={e=>setDates(x=>({...x,[s.id]:e.target.value}))}/></label><button onClick={()=>void schedule(s.id)} disabled={saving===s.id} className="mt-3 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving===s.id?"Enviando solicitação...":"Solicitar este horário"}</button></div>}
      {s.status==="scheduled"&&s.scheduled_for&&<div className={`rounded-2xl border p-4 ${s.confirmed_at?"border-emerald-100 bg-emerald-50":"border-blue-100 bg-blue-50"}`}><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Horário solicitado</p><p className="mt-2 text-base font-bold">{new Intl.DateTimeFormat("pt-BR",{dateStyle:"full",timeStyle:"short"}).format(new Date(s.scheduled_for))}</p><p className="mt-1 text-sm text-slate-600">{s.confirmed_at?"✓ O criador confirmou este horário.":"Aguardando a confirmação do criador."}</p></div>}
      {s.status==="scheduled"&&s.confirmed_at&&<Link href={`/fans/videochamadas/sala/${s.id}`} className="mt-4 flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Entrar na sala privada →</Link>}
      {s.status==="active"&&<Link href={`/fans/videochamadas/sala/${s.id}`} className="mt-4 flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white">Entrar na chamada →</Link>}
      {s.status==="completed"&&<div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Chamada concluída</div>}
      {["refunded","cancelled","expired"].includes(s.status)&&<div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">{st.label}</div>}
     </div>
    </article>})}</section>}
  </div>
 </main>;
}
