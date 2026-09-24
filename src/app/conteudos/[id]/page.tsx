"use client";

import { useEffect,useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Product={id:string;title:string;description:string|null;product_type:string;price:number|string;currency:string;status:string;owner_type:string;owner_id:string};
export default function DigitalContentProductPage(){
 const params=useParams<{id:string}>(); const [product,setProduct]=useState<Product|null>(null); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 useEffect(()=>{const supabase=createClient();supabase.from("digital_content_products").select("id,title,description,product_type,price,currency,status,owner_type,owner_id").eq("id",params.id).eq("status","published").maybeSingle().then(({data,error})=>{if(error||!data)setError("Conteúdo não encontrado.");else setProduct(data as Product)})},[params.id]);
 async function buy(){
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/conteudos/checkout/intent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:params.id})});
   const b=await r.json(); if(!r.ok) throw new Error(b.error||"Não foi possível iniciar a compra.");
   if(b.already_owned&&b.sale_id){window.location.href=`/conteudos/minhas-compras?sale=${encodeURIComponent(b.sale_id)}`;return;}
   const p=await fetch("/api/conteudos/checkout/provider",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({order_id:b.order_id})});
   const pb=await p.json();if(!p.ok||!pb.checkout_url)throw new Error(pb.error||"Checkout indisponível.");
   window.location.href=pb.checkout_url;
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível iniciar a compra.");setBusy(false)}
 }
 if(error&&!product)return <main className="min-h-screen grid place-items-center bg-slate-50 p-6"><div className="rounded-3xl bg-white p-8 shadow-sm"><p className="font-semibold text-red-600">{error}</p></div></main>;
 if(!product)return <main className="min-h-screen grid place-items-center bg-slate-50 p-6"><p>Carregando conteúdo…</p></main>;
 const kind=product.product_type==="package"?"PACOTE":product.product_type==="single_video"?"VÍDEO":"IMAGEM";
 return <main className="min-h-screen bg-[#090a0f] px-4 py-10 text-white"><section className="mx-auto max-w-2xl rounded-[30px] border border-white/10 bg-white/[.04] p-7 shadow-2xl sm:p-10"><div className="text-[10px] font-black tracking-[.2em] text-violet-300">PECATHO · CONTEÚDO EXCLUSIVO</div><div className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-black tracking-[.12em]">{kind}</div><h1 className="mt-4 text-4xl font-black tracking-[-.05em]">{product.title}</h1><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{product.description||"Conteúdo digital exclusivo disponível para compra."}</p><div className="mt-8 flex items-end justify-between gap-4 border-t border-white/10 pt-6"><div><span className="block text-[10px] font-black tracking-[.15em] text-slate-500">VALOR</span><strong className="mt-1 block text-3xl">R$ {Number(product.price).toFixed(2).replace(".",",")}</strong></div><button onClick={()=>void buy()} disabled={busy} className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{busy?"Preparando checkout…":"Comprar agora"}</button></div>{error&&<p className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}<p className="mt-7 text-xs leading-5 text-slate-500">Após a confirmação do pagamento, os arquivos ficam disponíveis na sua área de compras por links temporários. O conteúdo original não é exposto por URL pública.</p></section></main>;
}
