"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/browser";
import {optimizeImage} from "@/lib/media/optimize-image";

type Media={id:string;kind:"image"|"video";storage_bucket:string;storage_path:string;preview_storage_bucket:string|null;preview_storage_path:string|null;original_filename:string|null;moderation_status:string;is_primary:boolean;sort_order:number};

export default function ParceiroMidias(){
 const [venueId,setVenueId]=useState("");const [media,setMedia]=useState<Media[]>([]);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState("");
 async function load(){
  const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){location.href="/login";return}
  const {data:v,error:ve}=await s.from("partner_venues").select("id").eq("owner_user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();if(ve)throw ve;if(!v){setError("Cadastre sua casa antes de adicionar mídias.");return}setVenueId(v.id);
  const {data,error:e}=await s.from("partner_venue_media").select("id,kind,storage_bucket,storage_path,preview_storage_bucket,preview_storage_path,original_filename,moderation_status,is_primary,sort_order").eq("venue_id",v.id).order("sort_order");if(e)throw e;setMedia((data||[]) as Media[]);
 }
 useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Não foi possível carregar as mídias."))},[]);
 async function upload(e:React.ChangeEvent<HTMLInputElement>){
  const files=Array.from(e.target.files||[]);if(!files.length||!venueId)return;setBusy(true);setError("");setMessage("");
  try{const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user)throw new Error("Sessão expirada.");let order=media.length;
   for(const original of files){
    if(!original.type.startsWith("image/")&&!original.type.startsWith("video/"))throw new Error("Envie apenas imagens ou vídeos.");
    if(original.size>50*1024*1024)throw new Error("Cada arquivo deve ter no máximo 50 MB.");
    let file=original;let previewFile:File|null=null;
    if(original.type.startsWith("image/")){const optimized=await optimizeImage(original,2200,0.86);file=optimized.file;previewFile=optimized.preview;}
    const kind=file.type.startsWith("video/")?"video":"image";
    const path=user.id+"/partners/"+venueId+"/"+crypto.randomUUID()+"."+(file.name.split(".").pop()||"bin").toLowerCase();
    const up=await s.storage.from("pecatho-partner-media").upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;
    let preview_storage_bucket:string|null=null;let preview_storage_path:string|null=null;
    if(previewFile){preview_storage_bucket="pecatho-media-preview";preview_storage_path=user.id+"/partners/"+venueId+"/"+crypto.randomUUID()+".webp";const pu=await s.storage.from(preview_storage_bucket).upload(preview_storage_path,previewFile,{contentType:"image/webp",upsert:false});if(pu.error)throw pu.error;}
    const ins=await s.from("partner_venue_media").insert({venue_id:venueId,owner_user_id:user.id,kind,storage_bucket:"pecatho-partner-media",storage_path:path,preview_storage_bucket,preview_storage_path,original_filename:original.name,mime_type:file.type,size_bytes:file.size,sort_order:order}).select("id").single();if(ins.error)throw ins.error;order++;
   }
   setMessage("Mídia otimizada e enviada para moderação.");await load();
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível enviar a mídia.")}finally{setBusy(false);e.target.value=""}
 }
 async function remove(item:Media){if(!window.confirm("Remover esta mídia do perfil?"))return;setBusy(true);setError("");try{const s=createClient();const {error:e}=await s.from("partner_venue_media").delete().eq("id",item.id);if(e)throw e;await s.storage.from(item.storage_bucket).remove([item.storage_path]);await load()}catch(e){setError(e instanceof Error?e.message:"Não foi possível remover a mídia.")}finally{setBusy(false)}}
 async function primary(item:Media){if(item.kind!=="image"||item.moderation_status!=="approved")return;setBusy(true);setError("");try{const s=createClient();await s.from("partner_venue_media").update({is_primary:false}).eq("venue_id",venueId);const {error:e}=await s.from("partner_venue_media").update({is_primary:true}).eq("id",item.id);if(e)throw e;await load()}catch(e){setError(e instanceof Error?e.message:"Não foi possível definir a capa.")}finally{setBusy(false)}}
 return <main className="shell"><nav className="topbar"><Link className="brand" href="/painel"><span className="brandMark">P</span><span>Pecatho</span></Link><Link className="navCta" href="/painel/parceiro">Dados do parceiro</Link></nav><section className="hero"><div className="eyebrow">PARCEIRO · GALERIA</div><h1>Mostre sua <em>estrutura.</em></h1><p className="heroCopy">Envie fotos e vídeos da casa. Todo conteúdo passa por moderação antes de aparecer no perfil público.</p><div className="authCard"><h2>Adicionar mídia</h2><label className="primaryButton" style={{cursor:busy?"wait":"pointer"}}>Selecionar fotos ou vídeos<input type="file" accept="image/*,video/*" multiple onChange={upload} disabled={busy} style={{display:"none"}}/></label><p className="fieldNote">Até 50 MB por arquivo. Use imagens reais da estrutura, fachada, ambientes e áreas de atendimento.</p></div>{message&&<p className="formSuccess">{message}</p>}{error&&<p className="formError">{error}</p>}<section className="partnerGrid">{media.map(item=>{const url=item.preview_storage_bucket&&item.preview_storage_path?createClient().storage.from(item.preview_storage_bucket).getPublicUrl(item.preview_storage_path).data.publicUrl:null;return <article className="card" key={item.id}>{item.kind==="image"?<img src={url} alt={item.original_filename||"Imagem do parceiro"} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:12}}/>:<video src={url} controls style={{width:"100%",aspectRatio:"16/9",objectFit:"cover",borderRadius:12}}/>}<p><strong>{item.original_filename||"Mídia"}</strong></p><p className="fieldNote">{item.moderation_status==="approved"?"Aprovada":item.moderation_status==="rejected"?"Rejeitada":"Em moderação"}{item.is_primary?" · Capa pública":""}</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{item.kind==="image"&&<button className="secondaryButton" type="button" disabled={busy||item.moderation_status!=="approved"||item.is_primary} onClick={()=>void primary(item)}>Definir como capa</button>}<button className="secondaryButton" type="button" disabled={busy} onClick={()=>void remove(item)}>Remover</button></div></article>})}</section></section></main>
}