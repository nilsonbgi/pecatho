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
function parsePrice(value:string):number{
 const raw=value.trim().replace(/\s/g,"");
 if(!raw)return Number.NaN;
 let normalized="";
 if(raw.includes(",")&&raw.includes(".")){
  const decimalSeparator=raw.lastIndexOf(",")>raw.lastIndexOf(".")?",":".";
  const thousandsSeparator=decimalSeparator===","?".":",";
  const parts=raw.split(decimalSeparator);
  if(parts.length!==2||!/^\d{1,3}(?:[.,]\d{3})*$/.test(parts[0])||!/^\d{1,2}$/.test(parts[1]))return Number.NaN;
  normalized=parts[0].split(thousandsSeparator).join("").replace(decimalSeparator,".")+"."+parts[1];
 }else if(raw.includes(",")){
  if(!/^\d+(,\d{1,2})?$/.test(raw))return Number.NaN;
  normalized=raw.replace(",",".");
 }else if(raw.includes(".")){
  if(/^\d{1,3}(\.\d{3})+$/.test(raw))normalized=raw.replace(/\./g,"");
  else if(/^\d+(\.\d{1,2})?$/.test(raw))normalized=raw;
  else return Number.NaN;
 }else{
  if(!/^\d+$/.test(raw))return Number.NaN;
  normalized=raw;
 }
 const result=Number(normalized);
 return Number.isFinite(result)&&result>0?Math.round(result*100)/100:Number.NaN;
}

export default function DigitalContentManager({ownerType}:{ownerType:OwnerType}){
 const supabase=useMemo(()=>createClient(),[]);
 const [ownerId,setOwnerId]=useState("");const [ownerUserId,setOwnerUserId]=useState("");const [products,setProducts]=useState<Product[]>([]);
 const [title,setTitle]=useState("");const [description,setDescription]=useState("");const [price,setPrice]=useState("");
 const [productType,setProductType]=useState<"single_image"|"single_video"|"package">("package");const [files,setFiles]=useState<File[]>([]);
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState("");
 const [metrics,setMetrics]=useState({sales:0,gross:0,ownerAmount:0,last30Sales:0,last30Gross:0});const [sales,setSales]=useState<Sale[]>([]);
 const [catalogSearch,setCatalogSearch]=useState("");const [catalogStatus,setCatalogStatus]=useState<"all"|"published"|"archived">("all");const [editingProduct,setEditingProduct]=useState<string|null>(null);const [editTitle,setEditTitle]=useState("");const [editDescription,setEditDescription]=useState("");const [editPrice,setEditPrice]=useState("");

 async function load(){
  setError("");const {data:{user}}=await supabase.auth.getUser();if(!user){setError("Sessão expirada.");return;}setOwnerUserId(user.id);
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
   const normalized=parsePrice(price);
   if(!title.trim())throw new Error("Informe o título do conteúdo.");
   if(!Number.isFinite(normalized))throw new Error("Informe um preço válido, por exemplo 49,90 ou 1.234,56.");
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
 function beginEdit(product:Product){setEditingProduct(product.id);setEditTitle(product.title);setEditDescription(product.description??"");setEditPrice(String(product.price).replace(".",","));setError("");setMessage("");}
 async function saveProduct(){if(!editingProduct||!ownerUserId)return;setBusy(true);setError("");setMessage("");try{const normalized=parsePrice(editPrice);if(!editTitle.trim())throw new Error("Informe o título do conteúdo.");if(!Number.isFinite(normalized))throw new Error("Informe um preço válido, por exemplo 49,90.");const {data:{user}}=await supabase.auth.getUser();if(!user||user.id!==ownerUserId)throw new Error("Sua sessão mudou. Atualize a página e tente novamente.");const {data:updated,error:updateError}=await supabase.from("digital_content_products").update({title:editTitle.trim(),description:editDescription.trim()||null,price:normalized,updated_at:new Date().toISOString()}).eq("id",editingProduct).eq("owner_user_id",user.id).eq("owner_type",ownerType).select("id").maybeSingle();if(updateError)throw new Error(updateError.message);if(!updated)throw new Error("O conteúdo não foi alterado. Confirme sua sessão e tente novamente.");setEditingProduct(null);setMessage("Oferta atualizada com sucesso.");await load();}catch(e){setError(e instanceof Error?e.message:"Não foi possível atualizar a oferta.");}finally{setBusy(false);}}
 async function changeStatus(id:string,nextStatus:"archived"|"published"){if(!ownerUserId)return;setBusy(true);setError("");setMessage("");try{const {data:{user}}=await supabase.auth.getUser();if(!user||user.id!==ownerUserId)throw new Error("Sua sessão mudou. Atualize a página e tente novamente.");const {data:updated,error:e}=await supabase.from("digital_content_products").update({status:nextStatus,updated_at:new Date().toISOString()}).eq("id",id).eq("owner_user_id",user.id).eq("owner_type",ownerType).select("id").maybeSingle();if(e)throw new Error(e.message);if(!updated)throw new Error("Não foi possível alterar o status deste conteúdo.");setMessage(nextStatus==="archived"?"Conteúdo arquivado. Você pode reativá-lo a qualquer momento.":"Conteúdo reativado e disponível para venda.");await load();}catch(e){setError(e instanceof Error?e.message:"Não foi possível alterar o status.");}finally{setBusy(false);}}

 const totalSize=files.reduce((sum,file)=>sum+file.size,0);
 const activeProducts=products.filter(p=>p.status==="published").length;
 const visibleProducts=products.filter(p=>(catalogStatus==="all"||p.status===catalogStatus)&&(`${p.title} ${p.description??""}`).toLocaleLowerCase("pt-BR").includes(catalogSearch.trim().toLocaleLowerCase("pt-BR")));
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
       <label>Preço (R$)<input value={price} onChange={e=>setPrice(e.target.value)} inputMode="decimal" maxLength={18} placeholder="49,90" aria-describedby="digital-price-help"/><small id="digital-price-help">Use vírgula para centavos. Também aceitamos valores como 1.234,56.</small></label>
       <label>Tipo<select value={productType} onChange={e=>setProductType(e.target.value as typeof productType)}><option value="package">Pacote</option><option value="single_image">Imagem única</option><option value="single_video">Vídeo único</option></select></label>
      </div>
      <label className="digitalFileDrop"><span>02 · ARQUIVOS</span><strong>Selecione fotos ou vídeos</strong><small>Os originais permanecem privados. Até 250 MB por arquivo. Você pode remover arquivos antes de publicar.</small><input key={files.length} type="file" multiple accept="image/*,video/*,audio/*,.pdf" onChange={e=>setFiles(Array.from(e.target.files??[]))}/></label>
      {files.length>0&&<div className="digitalFileList">{files.map((file,index)=><div key={file.name+"-"+index}><span aria-hidden="true">{file.type.startsWith("video/")?"▶":file.type.startsWith("image/")?"▧":"✦"}</span><div className="digitalFileDetails"><strong>{file.name}</strong><small>{file.type||"arquivo"} · {fileSize(file.size)}</small></div><button type="button" className="digitalRemoveFile" onClick={()=>setFiles(current=>current.filter((_,fileIndex)=>fileIndex!==index))} disabled={busy} aria-label={"Remover arquivo "+file.name}>Remover</button></div>)}</div>}
      {files.length>0&&<div className="digitalUploadSummary"><span>{files.length} arquivo(s) selecionado(s)</span><strong>{fileSize(totalSize)}</strong></div>}
      <aside className="digitalOfferPreview" aria-live="polite"><div className="digitalOfferPreviewTop"><span>PRÉVIA DA OFERTA</span><span>{productType==="package"?"PACOTE":productType==="single_video"?"VÍDEO":"IMAGEM"}</span></div><h3>{title.trim()||"Nome do seu conteúdo"}</h3><p>{description.trim()||"A descrição que você escrever aparecerá aqui para contextualizar a oferta."}</p><div className="digitalOfferPreviewBottom"><strong>{Number.isFinite(parsePrice(price))?brl(parsePrice(price)):"R$ 0,00"}</strong><span>{files.length} arquivo(s) · {fileSize(totalSize)}</span></div></aside>
      <button type="button" className="digitalPublishButton" onClick={()=>void createProduct()} disabled={busy}>{busy?"Preparando conteúdo...":"Publicar para venda"}</button>
      {message&&<p className="digitalSuccess">{message}</p>}{error&&<p className="digitalError">{error}</p>}
     </div>
    </section>

    <section className="digitalLibrary">
     <div className="digitalSectionHead"><div><span>03</span><div><b>CATÁLOGO</b><h2>Seus produtos.</h2></div></div><strong>{activeProducts} à venda</strong></div>
     <div className="digitalCatalogTools"><label className="digitalCatalogSearch">Buscar no catálogo<input value={catalogSearch} onChange={e=>setCatalogSearch(e.target.value)} placeholder="Nome ou descrição do conteúdo"/></label><label className="digitalCatalogFilter">Exibir<select value={catalogStatus} onChange={e=>setCatalogStatus(e.target.value as typeof catalogStatus)}><option value="all">Todos os produtos</option><option value="published">À venda</option><option value="archived">Arquivados</option></select></label><span>{visibleProducts.length} de {products.length} produto(s)</span></div>
     {products.length===0?<div className="digitalEmpty"><div>✦</div><h3>Sua loja ainda está vazia.</h3><p>Crie a primeira oferta ao lado. Ela aparecerá no seu perfil e poderá ser comprada pelos clientes.</p></div>:visibleProducts.length===0?<div className="digitalEmpty"><div>⌕</div><h3>Nenhum conteúdo encontrado.</h3><p>Altere a busca ou o filtro para localizar outros produtos do seu catálogo.</p><button type="button" onClick={()=>{setCatalogSearch("");setCatalogStatus("all");}}>Limpar filtros</button></div>:
      <div className="digitalProducts">{visibleProducts.map(p=><article key={p.id} className="digitalProduct"><div className="digitalProductTop"><span className={"digitalStatus "+(p.status==="published"?"live":"archived")}>{p.status==="published"?"● À VENDA":p.status==="archived"?"ARQUIVADO":"RASCUNHO"}</span><span>{p.product_type==="package"?"PACOTE":p.product_type==="single_video"?"VÍDEO":"IMAGEM"}</span></div><div className="digitalProductBody"><div><h3>{p.title}</h3><p>{p.description||"Sem descrição."}</p></div><strong>{brl(Number(p.price))}</strong></div>{editingProduct===p.id?<div className="digitalProductEditor"><label>Título da oferta<input value={editTitle} maxLength={140} onChange={e=>setEditTitle(e.target.value)}/></label><label>Descrição<textarea value={editDescription} rows={3} maxLength={3000} onChange={e=>setEditDescription(e.target.value)}/></label><label>Preço (R$)<input value={editPrice} inputMode="decimal" maxLength={18} onChange={e=>setEditPrice(e.target.value)}/></label><div className="digitalProductEditorActions"><button type="button" onClick={()=>void saveProduct()} disabled={busy}>{busy?"Salvando...":"Salvar alterações"}</button><button type="button" onClick={()=>setEditingProduct(null)} disabled={busy}>Cancelar</button></div></div>:null}<div className="digitalProductFoot"><small>Criado em {new Date(p.created_at).toLocaleDateString("pt-BR")}</small><div className="digitalProductActions"><button type="button" onClick={()=>beginEdit(p)} disabled={busy}>Editar oferta</button>{p.status==="published"?<button type="button" onClick={()=>void changeStatus(p.id,"archived")} disabled={busy}>Arquivar</button>:p.status==="archived"?<button type="button" onClick={()=>void changeStatus(p.id,"published")} disabled={busy}>Reativar venda</button>:null}</div></div></article>)}</div>}
     {message&&<p className="digitalSuccess" role="status">{message}</p>}{error&&<p className="digitalError" role="alert">{error}</p>}
    </section>
   </div>
   <section className="digitalSalesPanel"><div className="digitalSectionHead"><div><span>04</span><div><b>COMERCIAL</b><h2>Vendas realizadas.</h2></div></div><strong>{sales.length} registro{sales.length === 1 ? "" : "s"}</strong></div>{sales.length===0?<div className="digitalEmpty"><div>R$</div><h3>Ainda não há vendas.</h3><p>Quando um cliente confirmar uma compra, a transação aparecerá aqui.</p></div>:<div className="digitalSalesTable">{sales.map((sale)=><article key={sale.id} className="digitalSaleRow"><div><strong>{sale.product?.title || "Conteúdo"}</strong><span>{sale.buyer?.display_name ? "Cliente: "+sale.buyer.display_name : "Cliente Pecatho"}</span><small>{new Date(sale.paid_at || sale.created_at).toLocaleString("pt-BR")} · Venda {sale.id.slice(0,8)}</small></div><div><strong>{brl(sale.amount)}</strong><span>Você recebe {brl(sale.owner_amount)}</span><small className={"digitalSaleStatus digitalSaleStatus-"+sale.status}>{sale.status}</small><CustomerReview sourceType="digital_content" sourceId={sale.id} customerName={sale.buyer?.display_name} /></div></article>)}</div>}</section>
   <div className="digitalTrust"><span>🔒</span><div><strong>Venda protegida</strong><p>O conteúdo comercial permanece em armazenamento privado. O cliente não recebe o arquivo antes da confirmação do pagamento.</p></div><div><strong>Preço sob seu controle</strong><p>Você define e altera a oferta comercial de cada produto.</p></div></div>
  </div>
  <style>{`
   .digitalFileDetails{min-width:0;flex:1;overflow-wrap:anywhere}
   .digitalRemoveFile{flex-shrink:0;border:1px solid #e2e8f0;background:#fff;color:#64748b;border-radius:8px;padding:7px 9px;font-size:10px;font-weight:800;cursor:pointer}
   .digitalRemoveFile:hover{border-color:#fda4af;color:#be123c}
   .digitalRemoveFile:disabled{opacity:.5;cursor:wait}
   .digitalOfferPreview{border:1px solid #e9d5ff;border-radius:15px;padding:15px;background:linear-gradient(145deg,#faf5ff,#fff 72%)}
   .digitalOfferPreviewTop,.digitalOfferPreviewBottom{display:flex;justify-content:space-between;align-items:center;gap:10px}
   .digitalOfferPreviewTop{font-size:9px;letter-spacing:.12em;font-weight:900;color:#7c3aed}
   .digitalOfferPreviewTop span:last-child{background:#ede9fe;border-radius:999px;padding:5px 8px}
   .digitalOfferPreview h3{font-size:16px;line-height:1.35;margin:12px 0 5px;color:#111827;overflow-wrap:anywhere}
   .digitalOfferPreview p{font-size:11px;line-height:1.6;color:#64748b;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
   .digitalOfferPreviewBottom{margin-top:14px;padding-top:12px;border-top:1px solid #ede9fe}
   .digitalOfferPreviewBottom strong{font-size:20px;letter-spacing:-.04em;color:#111827}
   .digitalOfferPreviewBottom span{font-size:10px;color:#64748b;text-align:right}
   #digital-price-help{display:block;font-size:10px;color:#94a3b8;line-height:1.5;margin-top:5px}
   .digitalCatalogTools{display:grid;grid-template-columns:minmax(0,1fr) minmax(145px,.45fr) auto;gap:10px;align-items:end;margin:0 0 15px}
   .digitalCatalogTools label,.digitalProductEditor label{display:grid;gap:6px;font-size:10px;font-weight:800;color:#64748b}
   .digitalCatalogTools input,.digitalCatalogTools select,.digitalProductEditor input,.digitalProductEditor textarea{width:100%;min-width:0;border:1px solid #e2e8f0;border-radius:9px;background:#fff;padding:10px 11px;color:#111827;font:inherit;font-size:12px}
   .digitalCatalogTools>span{font-size:10px;color:#64748b;white-space:nowrap;padding-bottom:10px}
   .digitalProductEditor{display:grid;gap:11px;padding:14px;margin:14px 0;border:1px solid #e9d5ff;border-radius:12px;background:#faf5ff}
   .digitalProductEditor textarea{resize:vertical;line-height:1.5}
   .digitalProductEditorActions,.digitalProductActions{display:flex;flex-wrap:wrap;gap:7px}
   .digitalProductEditorActions button,.digitalProductActions button,.digitalEmpty button{border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#334155;padding:8px 10px;font-size:10px;font-weight:800;cursor:pointer}
   .digitalProductEditorActions button:first-child{background:#111827;border-color:#111827;color:#fff}
   .digitalProductActions button:hover,.digitalProductEditorActions button:hover,.digitalEmpty button:hover{border-color:#c4b5fd;color:#6d28d9}
   .digitalProductActions button:disabled,.digitalProductEditorActions button:disabled{opacity:.5;cursor:wait}
   @media(max-width:640px){.digitalCatalogTools{grid-template-columns:1fr 1fr}.digitalCatalogSearch{grid-column:1/-1}.digitalCatalogTools>span{padding:0;align-self:center}.digitalProductFoot{align-items:flex-start;gap:10px;flex-direction:column}.digitalProductActions{width:100%}.digitalProductActions button{flex:1}}
  `}</style>
 </main>;
}
