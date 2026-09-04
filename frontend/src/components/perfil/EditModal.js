"use client";

import { useState } from "react";
import { INTER } from "./edit/constants";
import PField from "./edit/PField";
import PInput from "./edit/PInput";
import PTextarea from "./edit/PTextarea";
import TagInput from "./edit/TagInput";
import LinkRow from "./edit/LinkRow";
import PDivider from "./edit/PDivider";
import PTab from "./edit/PTab";

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
  const [nombre,    setNombre]    = useState(user.nombre || "");
  const [username,  setUsername]  = useState(user.username || "");
  const [estado,    setEstado]    = useState(profile.statusText || "");
  const [bio,       setBio]       = useState(profile.bio || "");
  const [tags,      setTags]      = useState(
    Array.isArray(profile.intereses) ? profile.intereses
    : profile.intereses ? Object.values(profile.intereses) : []
  );
  const [links, setLinks] = useState(
    Array.isArray(profile.links)
      ? profile.links.map((l,i) => ({ id:i+1, plat: l.label||"Discord", url: l.url||"" }))
      : []
  );
  const [privacy, setPrivacy] = useState({ spotify:true, activity:true });

  const updateLink = (id,key,val) => setLinks(ls=>ls.map(l=>l.id===id?{...l,[key]:val}:l));
  const removeLink = id => setLinks(ls=>ls.filter(l=>l.id!==id));
  const addLink    = () => setLinks(ls=>[...ls,{id:Date.now(),plat:"Discord",url:""}]);

  const handleSave = async () => {
    setSaving(true);
    const linksArr = links.filter(l=>l.url).map(l=>({ label:l.plat, url:l.url }));
    await onSave({ bio, statusText:estado, intereses:tags, links:linksArr, nombre });
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
            {[["perfil","Perfil"],["privacidad","Privacidad"],["cuenta","Cuenta"]].map(([k,l])=>(
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
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <PField label="Nombre completo">
                  <PInput value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Tu nombre"/>
                </PField>
                <PField label="Usuario" hint="@">
                  <PInput value={username} onChange={e=>setUsername(e.target.value)} placeholder="usuario"/>
                </PField>
              </div>
              <PField label="Estado" hint={`${estado.length}/60`}>
                <PInput value={estado} onChange={e=>setEstado(e.target.value.slice(0,60))} placeholder="¿Qué está pasando?"/>
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

          {/* ── TAB PRIVACIDAD ── */}
          {tab==="privacidad" && (
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {[
                { key:"spotify",  label:"Mostrar Spotify",   desc:"Tu actividad musical aparecerá en tu perfil" },
                { key:"activity", label:"Mostrar actividad", desc:"Los demás verán cuando estás en línea" },
              ].map(({ key, label, desc }, i, arr) => (
                <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:i<arr.length-1?"1px solid rgba(255,255,255,.05)":"none" }}>
                  <div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,.75)", fontFamily:INTER, fontWeight:500, marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", fontFamily:INTER }}>{desc}</div>
                  </div>
                  <div onClick={()=>setPrivacy(p=>({...p,[key]:!p[key]}))} style={{ width:40, height:22, borderRadius:999, background:privacy[key]?"rgba(255,255,255,.85)":"rgba(255,255,255,.1)", border:`1px solid ${privacy[key]?"rgba(255,255,255,.5)":"rgba(255,255,255,.15)"}`, cursor:"pointer", position:"relative", transition:"all .2s", flexShrink:0 }}>
                    <div style={{ position:"absolute", top:2, left:privacy[key]?20:2, width:16, height:16, borderRadius:"50%", background:privacy[key]?"#1a1a1a":"rgba(255,255,255,.35)", transition:"left .2s, background .2s" }}/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB CUENTA ── */}
          {tab==="cuenta" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <PField label="Correo electrónico">
                <PInput value={user.email||""} onChange={()=>{}} placeholder=""/>
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
