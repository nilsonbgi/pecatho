"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LeadForm({venueId,serviceId,eventId,source="profile"}:{venueId:string;serviceId?:string;eventId?:string;source?:string}){
 const [name,setName]=useState("");const [email,setEmail]=useState("");const [phone,setPhone]=useState("");const [message,setMessage]=useState("");const [loading,setLoading]=useState(false);const [done,setDone]=useState(false);const [error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setError("");setDone(false);setLoading(true);
  try{
   const supabase=createClient();
   const {error}=await supabase.rpc("create_partner_venue_lead",{p_venue_id:venueId,p_name:name,p_email:email||null,p_phone:phone||null,p_message:message||null,p_source:source,p_service_id:serviceId||null,p_event_id:eventId||null});
   if(error)throw error;
   setDone(true);setName("");setEmail("");setPhone("");setMessage("");
  }catch(err){setError(err instanceof Error?err.message:"Não foi possível enviar sua solicitação.");}
  finally{setLoading(false);}
 }
 return <form onSubmit={submit} className="authCard" style={{display:"grid",gap:12}}>
  <div><div className="eyebrow">CONTATO COM A CASA</div><h2 style={{marginBottom:6}}>Tenho interesse</h2><p style={{opacity:.75,marginTop:0}}>Envie seus dados e uma mensagem. O parceiro receberá sua solicitação diretamente no painel comercial.</p></div>
  <input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome" className="input"/>
  <input type="email" maxLength={180} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Seu e-mail (opcional)" className="input"/>
  <input maxLength={40} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Seu telefone / WhatsApp (opcional)" className="input"/>
  <textarea minLength={5} maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Como podemos ajudar? (opcional)" className="input" rows={5}/>
  <button className="primaryButton" disabled={loading}>{loading?"Enviando...":"Enviar solicitação"}</button>
  {done&&<div style={{padding:12,borderRadius:10,border:"1px solid rgba(231,195,63,.35)"}}>Solicitação enviada. O parceiro poderá entrar em contato pelos dados informados.</div>}
  {error&&<div style={{padding:12,borderRadius:10,border:"1px solid rgba(255,80,80,.35)"}}>{error}</div>}
 </form>;
}