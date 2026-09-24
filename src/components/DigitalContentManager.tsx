"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type OwnerType = "advertiser" | "creator";
type Product = { id:string; title:string; description:string|null; product_type:string; price:number|string; status:string; created_at:string };

export default function DigitalContentManager({ ownerType }:{ ownerType: OwnerType }) {
  const supabase = useMemo(() => createClient(), []);
  const [ownerId,setOwnerId]=useState("");
  const [products,setProducts]=useState<Product[]>([]);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [price,setPrice]=useState("");
  const [productType,setProductType]=useState<"single_image"|"single_video"|"package">("package");
  const [files,setFiles]=useState<File[]>([]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function load(){
    setError("");
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){ setError("Sessão expirada."); return; }
    const table=ownerType==="creator"?"fans_creators":"advertiser_profiles";
    const {data:owner,error:ownerError}=await supabase.from(table).select("id").eq("user_id",user.id).maybeSingle();
    if(ownerError||!owner){setError(ownerType==="creator"?"Ative o Pecatho Fans antes de criar conteúdos.":"Crie seu anúncio antes de criar conteúdos.");return;}
    setOwnerId(owner.id);
    const {data:list,error:listError}=await supabase.from("digital_content_products").select("id,title,description,product_type,price,status,created_at").eq("owner_user_id",user.id).eq("owner_type",ownerType).order("created_at",{ascending:false});
    if(listError) setError(listError.message); else setProducts((list??[]) as Product[]);
  }
  useEffect(()=>{void load()},[]);

  async function createProduct(){
    setBusy(true);setError("");setMessage("");
    try{
      if(!ownerId) throw new Error("Proprietário não identificado.");
      const normalized=Number(price.replace(".","").replace(",",".")); 
      if(!title.trim()||!Number.isFinite(normalized)||normalized<=0) throw new Error("Informe título e valor válido.");
      if(!files.length) throw new Error("Adicione pelo menos um arquivo.");
      if(productType==="single_image" && files.length!==1) throw new Error("Uma venda de imagem deve conter exatamente uma imagem.");
      if(productType==="single_video" && files.length!==1) throw new Error("Uma venda de vídeo deve conter exatamente um vídeo.");
      if(productType==="single_image" && !files[0].type.startsWith("image/")) throw new Error("O arquivo precisa ser uma imagem.");
      if(productType==="single_video" && !files[0].type.startsWith("video/")) throw new Error("O arquivo precisa ser um vídeo.");
      for(const file of files) if(file.size>250*1024*1024) throw new Error("Cada arquivo pode ter no máximo 250 MB.");

      const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("Sessão expirada.");
      const {data:product,error:productError}=await supabase.from("digital_content_products").insert({
        owner_type:ownerType,owner_id:ownerId,owner_user_id:user.id,title:title.trim(),description:description.trim()||null,product_type:productType,price:normalized,currency:"BRL",status:"draft"
      }).select("id").single();
      if(productError||!product) throw new Error(productError?.message||"Não foi possível criar o produto.");

      const rows=[];
      for(let i=0;i<files.length;i++){
        const file=files[i];
        const safe=file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,120)||"arquivo";
        const path=`${user.id}/digital-products/${product.id}/${crypto.randomUUID()}-${safe}`;
        const {error:uploadError}=await supabase.storage.from("pecatho-private").upload(path,file,{upsert:false,contentType:file.type||"application/octet-stream"});
        if(uploadError) throw new Error(`Falha no upload de ${file.name}: ${uploadError.message}`);
        const mediaType=file.type.startsWith("image/")?"image":file.type.startsWith("video/")?"video":file.type.startsWith("audio/")?"audio":"document";
        rows.push({product_id:product.id,owner_user_id:user.id,storage_bucket:"pecatho-private",storage_path:path,original_filename:file.name,mime_type:file.type||null,size_bytes:file.size,media_type:mediaType,sort_order:i});
      }
      const {error:itemError}=await supabase.from("digital_content_product_items").insert(rows);
      if(itemError) throw new Error(itemError.message);
      const {error:publishError}=await supabase.from("digital_content_products").update({status:"published",updated_at:new Date().toISOString()}).eq("id",product.id);
      if(publishError) throw new Error(publishError.message);
      setTitle("");setDescription("");setPrice("");setFiles([]);setMessage("Conteúdo publicado e disponível para venda.");await load();
    }catch(e){setError(e instanceof Error?e.message:"Não foi possível criar o conteúdo.");}
    finally{setBusy(false);}
  }

  async function archive(id:string){
    setBusy(true);setError("");const {error:e}=await supabase.from("digital_content_products").update({status:"archived",updated_at:new Date().toISOString()}).eq("id",id);if(e)setError(e.message);else await load();setBusy(false);
  }

  return <main className="min-h-screen bg-[#f5f5f7] text-slate-950"><div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
    <div className="flex items-end justify-between gap-4"><div><div className="text-[10px] font-black tracking-[.2em] text-violet-600">PECATHO · {ownerType==="creator"?"FANS":"ANUNCIANTE"}</div><h1 className="mt-2 text-3xl font-black tracking-[-.05em]">Loja de conteúdo</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Crie vendas individuais de imagens e vídeos ou pacotes com vários arquivos. Você define o preço; o conteúdo original permanece em pasta privada e o comprador recebe links temporários somente após o pagamento.</p></div></div>
    <section className="mt-7 grid gap-5 lg:grid-cols-[420px_1fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-black tracking-[.14em] text-slate-400">NOVO PRODUTO</div>
        <div className="mt-4 grid gap-3">
          <label className="text-xs font-bold">Título<input className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: Ensaio exclusivo" /></label>
          <label className="text-xs font-bold">Descrição<textarea className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" value={description} onChange={e=>setDescription(e.target.value)} rows={4} placeholder="O que o comprador receberá?" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">Valor (R$)<input className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="49,90" /></label><label className="text-xs font-bold">Formato<select className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" value={productType} onChange={e=>setProductType(e.target.value as typeof productType)}><option value="package">Pacote</option><option value="single_image">Imagem</option><option value="single_video">Vídeo</option></select></label></div>
          <label className="text-xs font-bold">Arquivos<input className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" type="file" multiple onChange={e=>setFiles(Array.from(e.target.files??[]))} accept="image/*,video/*,audio/*,.pdf" /></label>
          {files.length>0&&<div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{files.length} arquivo(s) selecionado(s) · {Math.round(files.reduce((n,f)=>n+f.size,0)/1024/1024)} MB</div>}
          <button type="button" onClick={()=>void createProduct()} disabled={busy} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{busy?"Processando...":"Publicar para venda"}</button>
          {message&&<p className="text-sm font-semibold text-emerald-700">{message}</p>}{error&&<p className="text-sm font-semibold text-red-600">{error}</p>}
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><div className="text-xs font-black tracking-[.14em] text-slate-400">MINHA BIBLIOTECA</div><h2 className="mt-1 text-xl font-black">Produtos publicados</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{products.length}</span></div>
        <div className="mt-5 grid gap-3">{products.length===0?<div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Sua pasta comercial ainda está vazia.</div>:products.map(p=><article key={p.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.12em] text-violet-600">{p.product_type==="package"?"PACOTE":p.product_type==="single_video"?"VÍDEO":"IMAGEM"}</div><h3 className="mt-1 font-black">{p.title}</h3><p className="mt-1 text-xs text-slate-500">{p.description||"Sem descrição."}</p></div><strong>R$ {Number(p.price).toFixed(2).replace(".",",")}</strong></div><div className="mt-3 flex items-center justify-between text-xs"><span className={p.status==="published"?"text-emerald-700":"text-slate-500"}>{p.status==="published"?"À venda":"Arquivado"}</span>{p.status==="published"&&<button type="button" onClick={()=>void archive(p.id)} disabled={busy} className="font-bold text-red-600">Arquivar</button>}</div></article>)}</div>
      </div>
    </section>
  </div></main>;
}
