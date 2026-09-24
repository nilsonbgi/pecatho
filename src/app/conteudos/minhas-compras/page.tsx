"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect,useState } from "react";

type Download={id:string;filename:string;url:string;expires_in:number};

export default function MinhasComprasPage(){
 const params=useSearchParams(); const sale=params.get("sale");
 const [downloads,setDownloads]=useState<Download[]>([]); const [error,setError]=useState(""); const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!sale){setError("Compra não informada.");setLoading(false);return;} fetch(`/api/conteudos/download?sale_id=${encodeURIComponent(sale)}`,{cache:"no-store"}).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.error||"Não foi possível liberar os arquivos.");setDownloads(b.downloads??[])}).catch(e=>setError(e instanceof Error?e.message:"Não foi possível liberar os arquivos.")).finally(()=>setLoading(false))},[sale]);
 return <main className="min-h-screen bg-[#f5f5f7] px-4 py-10 text-slate-950"><section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9"><div className="text-[10px] font-black tracking-[.2em] text-violet-600">PECATHO · MINHAS COMPRAS</div><h1 className="mt-2 text-3xl font-black tracking-[-.05em]">Seu conteúdo está liberado</h1><p className="mt-3 text-sm leading-6 text-slate-500">Os links abaixo são temporários e apontam diretamente para a sua compra. O arquivo original permanece protegido.</p>{loading?<p className="mt-8 text-sm">Liberando arquivos…</p>:error?<div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>:downloads.length===0?<div className="mt-8 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">O pagamento foi confirmado, mas ainda não há arquivos disponíveis nesta compra.</div>:<div className="mt-7 grid gap-3">{downloads.map(d=><a key={d.id} href={d.url} target="_blank" rel="noreferrer" download className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 no-underline"><span className="min-w-0"><strong className="block truncate text-sm">{d.filename}</strong><small className="text-xs text-slate-500">Link válido por {Math.round(d.expires_in/60)} minutos</small></span><span className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Baixar</span></a>)}</div>}<div className="mt-8"><Link href="/" className="text-sm font-bold text-violet-700">Voltar ao Pecatho</Link></div></section></main>;
}
