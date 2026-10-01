"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { optimizeImage } from "@/lib/media/optimize-image";
import CustomerReview from "@/components/CustomerReview";

type OwnerType = "advertiser" | "creator";
type Product = { id:string; title:string; description:string|null; product_type:string; price:number|string; status:string; created_at:string };
type Sale = { id:string; product_id:string; order_id:string; buyer_user_id:string; buyer:{id:string;display_name:string|null}|null; amount:number; owner_amount:number; status:string; paid_at:string|null; created_at:string; product:{id:string;title:string;product_type:string}|null };

function brl(value:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value);}
function fileSize(value:number){if(value<1024*1024)return Math.max(1,Math.round(value/1024))+" KB";return (value/1024/1024).toFixed(1).replace(".",",")+" MB";}

export default function DigitalContentManager({ownerType}:{ownerType:OwnerType}){
 const supabase=useMemo(()=>createClient(),[]);
 const [ownerId,setOwnerId]=useState("");const [products,setProducts]=useState<Product[]>([]);
 const [title,setTitle]=useState("");const [description,setDescription]=useState("");const [price,setPrice]=useState("");
 const [productType,setProductType]=useState<"single_image"|"single_video"|"package">("package");const [files,setFiles]=useState<File[]>([]);
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState("");
 const [metrics,setMetrics]=useState({sales:0,gross:0,ownerAmount:0,last30Sales:0,last30Gross:0});const [sales,setSales]=useState<Sale[]>([]);

 async function load(){
  setError("");const {data:{user}}=await supabase.auth.getUser();if(!user){setError("Sessão expirada.");return;}
  const table=ownerType==="creator"?"fans_creators":"advertiser_profiles";
  const {data:owner,error:ownerError}=await supabase.from(table).select("id").eq("user_id",user.id).maybeSingle();
  if(ownerError||!owner){setError(ownerType==="creator"?"Ative o Pecatho Fans antes de criar conteúdos.":"Crie seu anúncio antes de criar conteúdos.");return;}
  setOwnerId(owner.id);
  const {data:list,error:listError}=await supabase.from("digital_content_products").select("id,title,description,product_type,price,status,created_at").eq("owner_user_id",user.id).eq("owner_type",ownerType).order("created_at",{ascending:false});
  if(listError)setError(listError.message);else setProducts((list??[]) as Product[]);
 }
 async function loadMetrics(){const response=await fetch("/api/conteudos/sales",{cache:"no-store"});if(response.ok){const data=await response.json();setMetrics({sales:Number(data.sales||0),gross:Number(data.gross||0),ownerAmount:Number(data.ownerAmount||0),last30Sales:Number(data.last30Sales||0),last30Gross:Number(data.last30Gross||0)});setSales(Array.isArray(data.rows)?data.rows:[]);}}
 useEffect(()=>{void load();void loadMetrics()},[]);

 async function createProduct(){
  setBusy(true);setError("");setMessage("");
  try{
   if(!ownerId)throw new Error("Proprietário não identificado.");
   const normalized=Number(price.replace(/\./g,"").replace(",","."));
   if(!title.trim()||!Number.isFinite(normalized)||normalized<=0)throw new Error("Informe título e valor válido.");
   if(!files.length)throw new Error("Adicione pelo menos um arquivo.");
   if(productType==="single_image"&&(files.length!==1||!files[0].type.startsWith("image/")))throw new Error("Uma venda de imagem deve conter exatamente uma imagem.");
   if(productType==="single_video"&&(files.length!==1||!files[0].type.startsWith("video/")))throw new Error("Uma venda de vídeo deve conter exatamente um vídeo.");
   for(const file of files)if(file.size>250*1024*1024)throw new Error("Cada arquivo pode ter no máximo 250 MB.");
   const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Sessão expirada.");
   const {data:product,error:productError}=await supabase.from("digital_content_products").insert({owner_type:ownerType,owner_id:ownerId,owner_user_id:user.id,title:title.trim(),description:description.trim()||null,product_type:productType,price:normalized,currency:"BRL",status:"draft"}).select("id").single();
   if(productError||!product)throw new Error(productError?.message||"Não foi possível criar o produto.");
   const rows=[];
   for(let i=0;i<files.length;i++){const original=files[i];const file=original.type.startsWith("image/")?(await optimizeImage(original,2560,0.9)).file:original;const safe=original.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,120)||"arquivo";const path=user.id+"/digital-products/"+product.id+"/"+crypto.randomUUID()+"-"+(file.type==="image/webp"?"imagem.webp":safe);const {error:uploadError}=await supabase.storage.from("pecatho-private").upload(path,file,{upsert:false,contentType:file.type||"application/octet-stream"});if(uploadError)throw new Error("Falha no upload de "+original.name+": "+uploadError.message);const mediaType=file.type.startsWith("image/")?"image":file.type.startsWith("video/")?"video":file.type.startsWith("audio/")?"audio":"document";rows.push({product_id:product.id,owner_user_id:user.id,storage_bucket:"pecatho-private",storage_path:path,original_filename:original.name,mime_type:file.type||null,size_bytes:file.size,media_type:mediaType,sort_order:i});}
   const {error:itemError}=await supabase.from("digital_content_product_items").insert(rows);if(itemError)throw new Error(itemError.message);
   const {error:publishError}=await supabase.from("digital_content_products").update({status:"published",updated_at:new Date().toISOString()}).eq("id",product.id);if(publishError)throw new Error(publishError.message);
   setTitle("");setDescription("");setPrice("");setFiles([]);setMessage("Conteúdo publicado e disponível para venda.");await load();await loadMetrics();
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível criar o conteúdo.");}finally{setBusy(false);}
 }
 async function archive(id:string){setBusy(true);setError("");const {error:e}=await supabase.from("digital_content_products").update({status:"archived",updated_at:new Date().toISOString()}).eq("id",id);if(e)setError(e.message);else await load();setBusy(false);}

 const totalSize=files.reduce((sum,file)=>sum+file.size,0);
 const activeProducts=products.filter(p=>p.status==="published").length;
 const label=ownerType==="creator"?"FANS":"ACOMPANHANTE";

 return <main className="digitalManager">
  <div className="digitalManagerInner">
   <header className="digitalHeader">
    <div><div className="digitalKicker">PECATHO · {label} · CONTEÚDO DIGITAL</div><h1>Sua loja de conteúdo.</h1><p>Publique fotos, vídeos e pacotes com preço definido por você. O arquivo original fica privado e o comprador só recebe acesso após o pagamento confirmado.</p></div>
    <div className="digitalHeaderActions"><a href={ownerType==="creator"?"/fans/gerenciar/perfil":"/painel/anuncio"}>← Voltar ao perfil</a><a className="digitalPrimaryLink" href="/conteudos/minhas-compras">Minhas compras</a></div>
   </header>

   <section className="digitalStats">
    <div><span>Vendas confirmadas</span><strong>{metrics.sales}</strong><small>compras pagas</small></div>
    <div><span>Faturamento bruto</span><strong>{brl(metrics.gross)}</strong><small>antes das taxas</small></div>
    <div><span>A receber</span><strong>{brl(metrics.ownerAmount)}</strong><small>destinado ao vendedor</small></div>
    <div><span>Últimos 30 dias</span><strong>{metrics.last30Sales}</strong><small>{brl(metrics.last30Gross)}</small></div>
   </section>

   <div className="digitalLayout">
    <section className="digitalComposer">
     <div className="digitalSectionHead"><div><span>01</span><div><b>CRIAR PRODUTO</b><h2>Monte uma oferta.</h2></div></div><small>Você define o preço e o que será entregue.</small></div>
     <div className="digitalForm">
      <label>Título<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: Ensaio exclusivo — coleção de setembro"/></label>
      <label>Descrição<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} placeholder="Explique ao comprador o que ele receberá."/></label>
      <div className="digitalFormGrid">
       <label>Preço<input value={price} onChange={e=>setPrice(e.target.value)} inputMode="decimal" placeholder="49,90"/></label>
       <label>Tipo<select value={productType} onChange={e=>setProductType(e.target.value as typeof productType)}><option value="package">Pacote</option><option value="single_image">Imagem única</option><option value="single_video">Vídeo único</option></select></label>
      </div>
      <label className="digitalFileDrop"><span>02 · ARQUIVOS</span><strong>Selecione fotos ou vídeos</strong><small>Os originais permanecem privados. Até 250 MB por arquivo.</small><input type="file" multiple accept="image/*,video/*,audio/*,.pdf" onChange={e=>setFiles(Array.from(e.target.files??[]))}/></label>
      {files.length>0&&<div className="digitalFileList">{files.map((file,index)=><div key={file.name+"-"+index}><span>{file.type.startsWith("video/")?"▶":"✦"}</span><div><strong>{file.name}</strong><small>{file.type||"arquivo"} · {fileSize(file.size)}</small></div></div>)}</div>}
      {files.length>0&&<div className="digitalUploadSummary"><span>{files.length} arquivo(s)</span><strong>{fileSize(totalSize)}</strong></div>}
      <button type="button" className="digitalPublishButton" onClick={()=>void createProduct()} disabled={busy}>{busy?"Preparando conteúdo...":"Publicar para venda"}</button>
      {message&&<p className="digitalSuccess">{message}</p>}{error&&<p className="digitalError">{error}</p>}
     </div>
    </section>

    <section className="digitalLibrary">
     <div className="digitalSectionHead"><div><span>03</span><div><b>CATÁLOGO</b><h2>Seus produtos.</h2></div></div><strong>{activeProducts} à venda</strong></div>
     {products.length===0?<div className="digitalEmpty"><div>✦</div><h3>Sua loja ainda está vazia.</h3><p>Crie a primeira oferta ao lado. Ela aparecerá no seu perfil e poderá ser comprada pelos clientes.</p></div>:
      <div className="digitalProducts">{products.map(p=><article key={p.id} className="digitalProduct"><div className="digitalProductTop"><span className={"digitalStatus "+(p.status==="published"?"live":"archived")}>{p.status==="published"?"● À VENDA":"ARQUIVADO"}</span><span>{p.product_type==="package"?"PACOTE":p.product_type==="single_video"?"VÍDEO":"IMAGEM"}</span></div><div className="digitalProductBody"><div><h3>{p.title}</h3><p>{p.description||"Sem descrição."}</p></div><strong>{brl(Number(p.price))}</strong></div><div className="digitalProductFoot"><small>{new Date(p.created_at).toLocaleDateString("pt-BR")}</small>{p.status==="published"&&<button type="button" onClick={()=>void archive(p.id)} disabled={busy}>Arquivar</button>}</div></article>)}</div>}
    </section>
   </div>
   <section className="digitalSalesPanel"><div className="digitalSectionHead"><div><span>04</span><div><b>COMERCIAL</b><h2>Vendas realizadas.</h2></div></div><strong>{sales.length} registro{sales.length === 1 ? "" : "s"}</strong></div>{sales.length===0?<div className="digitalEmpty"><div>R$</div><h3>Ainda não há vendas.</h3><p>Quando um cliente confirmar uma compra, a transação aparecerá aqui.</p></div>:<div className="digitalSalesTable">{sales.map((sale)=><article key={sale.id} className="digitalSaleRow"><div><strong>{sale.product?.title || "Conteúdo"}</strong><span>{sale.buyer?.display_name ? "Cliente: "+sale.buyer.display_name : "Cliente Pecatho"}</span><small>{new Date(sale.paid_at || sale.created_at).toLocaleString("pt-BR")} · Venda {sale.id.slice(0,8)}</small></div><div><strong>{brl(sale.amount)}</strong><span>Você recebe {brl(sale.owner_amount)}</span><small className={"digitalSaleStatus digitalSaleStatus-"+sale.status}>{sale.status}</small><CustomerReview sourceType="digital_content" sourceId={sale.id} customerName={sale.buyer?.display_name} /></div></article>)}</div>}</section>
   <div className="digitalTrust"><span>🔒</span><div><strong>Venda protegida</strong><p>O conteúdo comercial permanece em armazenamento privado. O cliente não recebe o arquivo antes da confirmação do pagamento.</p></div><div><strong>Preço sob seu controle</strong><p>Você define e altera a oferta comercial de cada produto.</p></div></div>
  </div>
 </main>;
}
