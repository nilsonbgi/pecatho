"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Session = {
  id: string; title: string; duration_minutes: number; amount: number; currency: string;
  status: string; scheduled_for: string | null; confirmed_at: string | null; created_at: string;
  creator_id: string;
};

export default function MyFansCallsPage() {
  const [sessions,setSessions]=useState<Session[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [saving,setSaving]=useState<string|null>(null);
  const [dates,setDates]=useState<Record<string,string>>({});

  async function load(){
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){ window.location.href="/login?next=/fans/videochamadas"; return; }
    const {data,error}=await supabase.from("fans_live_sessions")
      .select("id,title,duration_minutes,amount,currency,status,scheduled_for,confirmed_at,created_at,creator_id")
      .eq("buyer_user_id",user.id).order("created_at",{ascending:false});
    if(error)setError("Não foi possível carregar suas videochamadas.");
    else setSessions((data??[]) as Session[]);
    setLoading(false);
  }
  useEffect(()=>{void load()},[]);

  async function schedule(id:string){
    const value=dates[id];
    if(!value){setError("Informe a data e horário.");return;}
    const iso=new Date(value).toISOString();
    setSaving(id);setError("");
    const supabase=createClient();
    const {error}=await supabase.rpc("request_fans_live_schedule",{p_session_id:id,p_scheduled_for:iso});
    if(error)setError(error.message);
    else await load();
    setSaving(null);
  }

  const money=(v:number,c:string)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:c}).format(Number(v||0));
  const label=(s:Session)=>s.status==="pending_payment"?"Aguardando pagamento":s.status==="paid"?"Pagamento confirmado — escolha um horário":s.status==="scheduled"?(s.confirmed_at?"Horário confirmado":"Aguardando confirmação do criador"):s.status==="active"?"Em andamento":s.status==="completed"?"Concluída":s.status==="refunded"?"Reembolsada":s.status==="cancelled"?"Cancelada":s.status==="expired"?"Expirada":s.status;

  return <main className="mx-auto min-h-screen max-w-5xl bg-slate-50 px-4 py-10 sm:px-6">
    <nav className="flex items-center justify-between"><Link href="/fans" className="font-semibold text-slate-950">Pecatho <span className="text-slate-500">Fans</span></Link><Link href="/fans/gerenciar" className="text-sm font-semibold text-slate-700">Painel</Link></nav>
    <header className="mt-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Área do assinante</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Minhas videochamadas</h1><p className="mt-2 text-sm leading-6 text-slate-600">Depois do pagamento confirmado, escolha um horário. O criador precisa confirmar a solicitação antes da chamada.</p></header>
    {error&&<p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {loading?<p className="mt-8 text-slate-500">Carregando...</p>:sessions.length===0?<div className="mt-8 rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500">Você ainda não possui videochamadas contratadas.</div>:
      <div className="mt-8 grid gap-5 md:grid-cols-2">{sessions.map(s=><article key={s.id} className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label(s)}</p><h2 className="mt-2 text-xl font-bold text-slate-950">{s.title}</h2></div><span className="text-sm font-bold text-slate-950">{money(s.amount,s.currency)}</span></div><p className="mt-3 text-sm text-slate-600">{s.duration_minutes} minutos</p>
      {s.status==="paid"&&<div className="mt-5 rounded-xl border bg-slate-50 p-4"><label className="text-sm font-semibold text-slate-900">Escolha a data e o horário<input type="datetime-local" className="mt-2 w-full rounded-lg border bg-white px-3 py-2" value={dates[s.id]??""} min={new Date().toISOString().slice(0,16)} onChange={e=>setDates(x=>({...x,[s.id]:e.target.value}))}/></label><button onClick={()=>void schedule(s.id)} disabled={saving===s.id} className="mt-3 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving===s.id?"Enviando...":"Solicitar horário"}</button></div>}
      {s.status==="scheduled"&&s.scheduled_for&&<div className="mt-5 rounded-xl border bg-slate-50 p-4 text-sm"><p><strong>Horário:</strong> {new Intl.DateTimeFormat("pt-BR",{dateStyle:"full",timeStyle:"short"}).format(new Date(s.scheduled_for))}</p><p className="mt-1 text-slate-600">{s.confirmed_at?"O criador confirmou este horário.":"Aguardando confirmação do criador."}</p></div>}
      {s.status==="scheduled"&&s.confirmed_at&&<Link href={`/fans/videochamadas/sala/${s.id}`} className="mt-5 block w-full rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">Entrar na sala</Link>}
      {s.status==="active"&&<Link href={`/fans/videochamadas/sala/${s.id}`} className="mt-5 block w-full rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">Entrar na chamada</Link>}
      {s.status==="completed"&&<button disabled className="mt-5 w-full rounded-xl border bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">Chamada concluída</button>}
      </article>)}</div>}
  </main>;
}
