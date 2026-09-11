"use client";

import { useState } from "react";
import { INTER } from "./edit/constants";
import PField from "./edit/PField";
import PInput from "./edit/PInput";
import PTextarea from "./edit/PTextarea";
import PPills from "./edit/PPills";
import TagInput from "./edit/TagInput";
import LinkRow from "./edit/LinkRow";
import PDivider from "./edit/PDivider";
import PTab from "./edit/PTab";

// Opciones de "Situación sentimental" — reemplaza al viejo campo de texto
// libre "Estado" (2026-09-10, a pedido explícito).
const SITUACIONES = ["Soltero", "En una relación", "Casado"];

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/perfil/EditModal.js — modal de editar TU perfil
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: junta todos los campitos de components/perfil/edit/ (nombre,
// bio, intereses, links de redes) en un modal con pestañas. Arma su propio
// estado de formulario a partir del `profile`/`user` que recibe, y al
// guardar llama a `onSave(...)` con TODO junto — no le habla al backend
// directamente, delega en quien lo usa.
//
// CON QUÉ SE CONECTA:
//   - components/perfil/edit/* → cada campo del formulario.
//   - `onSave` → en app/perfil/page.js es `handleSave` de
//     hooks/useOwnProfile.js, que ahí sí hace el PUT /api/perfil real.
// ════════════════════════════════════════════════════════════════════════
export default function EditModal({ profile, user, onClose, onSave }) {
  const [tab,    setTab]    = useState("perfil");
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado del formulario
  const [username,   setUsername]   = useState(user.username || "");
  const [situacion,  setSituacion]  = useState(profile.statusText || "");
  const [bio,        setBio]        = useState(profile.bio || "");
  const [tags,       setTags]       = useState(
    Array.isArray(profile.intereses) ? profile.intereses
    : profile.intereses ? Object.values(profile.intereses) : []
  );
  const [links, setLinks] = useState(
    Array.isArray(profile.links)
      ? profile.links.map((l,i) => ({ id:i+1, plat: l.label||"Discord", url: l.url||"" }))
      : []
  );
  const [showEmail, setShowEmail] = useState(false);

  const updateLink = (id,key,val) => setLinks(ls=>ls.map(l=>l.id===id?{...l,[key]:val}:l));
  const removeLink = id => setLinks(ls=>ls.filter(l=>l.id!==id));
  const addLink    = () => setLinks(ls=>[...ls,{id:Date.now(),plat:"Discord",url:""}]);

  // Oculta el correo por default — "al***@dominio.com" — hasta que se
  // toque el ojito. No es una medida de seguridad real (el dato ya viaja
  // al cliente), es nada más para que no quede a la vista de cualquiera
  // que mire por encima del hombro.
  const maskEmail = email => {
    if (!email) return "";
    const [nombre, dominio] = email.split("@");
    if (!nombre || !dominio) return email;
    const visible = nombre.slice(0, 2);
    return `${visible}${"•".repeat(Math.max(nombre.length - 2, 3))}@${dominio}`;
  };

  const handleSave = async () => {
    setSaving(true);
    const linksArr = links.filter(l=>l.url).map(l=>({ label:l.plat, url:l.url }));
    await onSave({ bio, statusText:situacion, intereses:tags, links:linksArr });
    setSaved(true);
    setTimeout(() => { setSaved(false); setSaving(false); onClose(); }, 1200);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:24, animation:"fadeIn .15s ease" }}
      onClick={onClose}>
      <div style={{ background:"#1a1a1a", borderRadius:12, border:"1px solid rgba(255,255,255,.09)", width:"100%", maxWidth:780, maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,.7)", animation:"slideUp .2s ease", overflow:"hidden" }}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"20px 24px 0", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <div style={{ fontFamily:INTER, fontSize:17, fontWeight:600, color:"rgba(255,255,255,.88)", letterSpacing:"-.01em" }}>Editar perfil</div>
              <div style={{ fontFamily:INTER, fontSize:12, color:"rgba(255,255,255,.3)", marginTop:3 }}>Así te verán los demás en FacuLeaks</div>
            </div>
            <button onClick={onClose} style={{ width:28, height:28, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:6, color:"rgba(255,255,255,.35)", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.1)";e.currentTarget.style.color="rgba(255,255,255,.7)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.06)";e.currentTarget.style.color="rgba(255,255,255,.35)";}}>✕</button>
          </div>
          {/* Tabs */}
          <div style={{ display:"flex", gap:20, borderBottom:"1px solid rgba(255,255,255,.07)" }}>
            {[["perfil","Perfil"],["cuenta","Cuenta"]].map(([k,l])=>(
              <PTab key={k} active={tab===k} onClick={()=>setTab(k)}>{l}</PTab>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

          {/* ── TAB PERFIL ── */}
          {tab==="perfil" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <PDivider/>
              <PField label="Usuario" hint="@">
                <PInput value={username} onChange={e=>setUsername(e.target.value)} placeholder="usuario"/>
              </PField>
              <PField label="Situación sentimental">
                <PPills options={SITUACIONES} value={situacion} onChange={setSituacion}/>
              </PField>
              <PField label="Bio" hint={`${bio.length}/200`}>
                <PTextarea value={bio} onChange={e=>setBio(e.target.value.slice(0,200))} placeholder="Cuéntale a la gente quién eres..." rows={4}/>
              </PField>
              <PDivider label="intereses"/>
              <PField label="Intereses" hint="Enter para agregar">
                <TagInput tags={tags} setTags={setTags}/>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontFamily:INTER, marginTop:4 }}>Presiona Enter o coma para agregar · máximo 10</div>
              </PField>
              <PDivider label="links"/>
              <PField label="Redes y links">
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {links.map(l=>(
                    <LinkRow key={l.id} link={l} onChange={(key,val)=>updateLink(l.id,key,val)} onRemove={()=>removeLink(l.id)}/>
                  ))}
                  {links.length < 5 && (
                    <button onClick={addLink} style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"1px dashed rgba(255,255,255,.12)", borderRadius:6, color:"rgba(255,255,255,.3)", fontFamily:INTER, fontSize:12, padding:"8px 14px", cursor:"pointer", transition:"all .15s", width:"fit-content" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.25)";e.currentTarget.style.color="rgba(255,255,255,.6)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.12)";e.currentTarget.style.color="rgba(255,255,255,.3)";}}>
                      + añadir link
                    </button>
                  )}
                </div>
              </PField>
            </div>
          )}

          {/* ── TAB CUENTA ── */}
          {tab==="cuenta" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <PField label="Correo electrónico">
                <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:6, padding:"10px 12px" }}>
                  <span style={{ flex:1, minWidth:0, fontFamily:INTER, fontSize:14, color:"rgba(255,255,255,.85)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {showEmail ? (user.email || "") : maskEmail(user.email)}
                  </span>
                  <button type="button" onClick={()=>setShowEmail(v=>!v)} title={showEmail ? "ocultar correo" : "mostrar correo"}
                    style={{ flexShrink:0, width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"none", color:"rgba(255,255,255,.35)", cursor:"pointer", transition:"color .15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,.75)";}}
                    onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.35)";}}>
                    {showEmail ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.4 18.4 0 0 1 4.22-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.42 18.42 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8-10-8-10-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </PField>
              <PDivider/>
              <div style={{ padding:"12px 14px", background:"rgba(255,50,50,.05)", border:"1px solid rgba(255,50,50,.1)", borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, color:"rgba(255,140,140,.8)", fontFamily:INTER, fontWeight:500, marginBottom:3 }}>Eliminar cuenta</div>
                  <div style={{ fontSize:11, color:"rgba(255,100,100,.4)", fontFamily:INTER }}>Tu cuenta entrará en período de eliminación de 7 días</div>
                </div>
                <button style={{ background:"transparent", border:"1px solid rgba(255,80,80,.25)", borderRadius:6, color:"rgba(255,100,100,.6)", fontFamily:INTER, fontSize:12, padding:"6px 14px", cursor:"pointer", transition:"all .15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,50,50,.08)";e.currentTarget.style.color="rgba(255,120,120,.9)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,100,100,.6)";}}>
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px 20px", borderTop:"1px solid rgba(255,255,255,.07)", display:"flex", justifyContent:"flex-end", gap:10, flexShrink:0 }}>
          <button onClick={onClose} style={{ background:"transparent", border:"1px solid rgba(255,255,255,.1)", borderRadius:7, color:"rgba(255,255,255,.45)", fontFamily:INTER, fontSize:13, padding:"9px 18px", cursor:"pointer", transition:"all .15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.05)";e.currentTarget.style.color="rgba(255,255,255,.7)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.45)";}}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} style={{ background:saved?"rgba(60,200,100,.15)":"rgba(255,255,255,.92)", border:saved?"1px solid rgba(60,200,100,.3)":"1px solid rgba(255,255,255,.4)", borderRadius:7, color:saved?"rgba(60,200,100,.9)":"#111", fontFamily:INTER, fontSize:13, fontWeight:500, padding:"9px 22px", cursor:saving?"not-allowed":"pointer", transition:"all .2s", minWidth:130, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
            onMouseEnter={e=>{ if(!saved) e.currentTarget.style.background="#fff"; }}
            onMouseLeave={e=>{ if(!saved) e.currentTarget.style.background="rgba(255,255,255,.92)"; }}>
            {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
