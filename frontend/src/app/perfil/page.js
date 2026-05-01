"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import SpotifyWidget from "@/components/SpotifyWidget";

const API = "http://localhost:4000";

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.95)", zIndex:99999, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
      <img src={src.startsWith("http") ? src : `${API}${src}`} alt="full"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth:"92vw", maxHeight:"92vh", objectFit:"contain", cursor:"default", border:"1px solid rgba(255,255,255,.1)" }} />
      <div style={{ position:"absolute", top:20, right:24, color:"rgba(255,255,255,.4)", fontSize:22, cursor:"pointer" }} onClick={onClose}>✕</div>
    </div>
  );
}

function TerminalCounter({ label, value, text }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === null || value === undefined) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 40));
    const t = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(t);
  }, [value]);
  return (
    <div style={{ fontSize: 12, color: "#555", display: "flex", justifyContent: "space-between", padding: "3px 0", fontFamily: "'Inter',sans-serif" }}>
      <span>{label}</span>
      <span style={{ color: "#e8e4d9", fontWeight: 500 }}>
        {text || display.toLocaleString()}
        {!text && <span style={{ animation: "blink 1s step-end infinite", color: "#333" }}>_</span>}
      </span>
    </div>
  );
}

// ── Pixel Trash ──
const TRASH_LID_C = [[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[0,0,1,1,1,0,0]];
const TRASH_LID_O = [[0,0,0,1,1,0,0],[0,1,1,1,1,1,0],[0,0,1,1,1,1,0]];
const TRASH_BODY  = [
  [0,1,1,1,1,1,0],
  [0,1,0,1,0,1,0],
  [0,1,0,1,0,1,0],
  [0,1,0,1,0,1,0],
  [0,1,1,1,1,1,0],
];

function PixelTrash({ s = 2, phase = "idle" }) {
  const lid = phase === "open" || phase === "shrink" ? TRASH_LID_O : TRASH_LID_C;
  const col = phase === "idle" ? "rgba(255,255,255,.28)" : phase === "open" ? "rgba(255,80,80,.85)" : "rgba(255,80,80,.5)";
  return (
    <svg width={7*s} height={8*s} viewBox={`0 0 ${7*s} ${8*s}`} style={{ display:"block" }}>
      {lid.map((row, r) => row.map((c, ci) => c ? <rect key={`l${r}${ci}`} x={ci*s} y={r*s} width={s} height={s} fill={col}/> : null))}
      {TRASH_BODY.map((row, r) => row.map((c, ci) => c ? <rect key={`b${r}${ci}`} x={ci*s} y={(r+3)*s} width={s} height={s} fill={col}/> : null))}
    </svg>
  );
}

function TrashBtn({ onDelete, s = 2 }) {
  const [phase, setPhase] = useState("idle");
  const [busy,  setBusy]  = useState(false);
  const ref = useRef();
  const handleClick = async () => {
    if (busy) return;
    setPhase("open");
    ref.current = setTimeout(() => {
      setPhase("shrink");
      setTimeout(async () => { setPhase("gone"); setBusy(true); await onDelete(); }, 300);
    }, 350);
  };
  useEffect(() => () => clearTimeout(ref.current), []);
  return (
    <button onClick={handleClick} disabled={busy} title="Eliminar"
      style={{ background:"none", border:"none", cursor: busy ? "default" : "pointer", padding:"2px 4px", display:"flex", alignItems:"center", opacity: busy ? .3 : 1, outline:"none" }}>
      <div style={{
        transition: phase === "shrink" ? "all .3s cubic-bezier(.4,0,.6,1)" : "none",
        transform: phase === "shrink" ? "scale(.05) perspective(200px) translateZ(-80px)" : phase === "open" ? "scale(1.15)" : "scale(1)",
        opacity: phase === "gone" ? 0 : 1,
        filter: phase === "open" || phase === "shrink" ? "brightness(1.4)" : "none",
      }}>
        <PixelTrash s={s} phase={phase} />
      </div>
    </button>
  );
}

const INTER = "'Inter',sans-serif";
const MONO  = "'IBM Plex Mono',monospace";

function PField({ label, hint, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
        <label style={{ fontSize:11, fontWeight:500, color:"rgba(255,255,255,.35)", letterSpacing:".06em", textTransform:"uppercase", fontFamily:INTER }}>{label}</label>
        {hint && <span style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontFamily:MONO }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function PInput({ value, onChange, placeholder, style={} }) {
  const [focus, setFocus] = useState(false);
  const base = { width:"100%", background:focus?"rgba(255,255,255,.07)":"rgba(255,255,255,.05)", border:`1px solid ${focus?"rgba(255,255,255,.25)":"rgba(255,255,255,.08)"}`, borderRadius:6, color:"rgba(255,255,255,.85)", fontFamily:INTER, fontSize:14, padding:"10px 12px", outline:"none", transition:"border-color .15s, background .15s", boxSizing:"border-box" };
  return <input value={value} onChange={onChange} placeholder={placeholder} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} style={{...base,...style}}/>;
}

function PTextarea({ value, onChange, placeholder, rows=4 }) {
  const [focus, setFocus] = useState(false);
  const base = { width:"100%", background:focus?"rgba(255,255,255,.07)":"rgba(255,255,255,.05)", border:`1px solid ${focus?"rgba(255,255,255,.25)":"rgba(255,255,255,.08)"}`, borderRadius:6, color:"rgba(255,255,255,.85)", fontFamily:INTER, fontSize:14, padding:"10px 12px", outline:"none", transition:"border-color .15s, background .15s", resize:"vertical", lineHeight:1.6, boxSizing:"border-box" };
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} style={base}/>;
}

function TagInput({ tags, setTags }) {
  const [val, setVal] = useState("");
  const [focus, setFocus] = useState(false);
  const add = e => {
    if ((e.key === "Enter" || e.key === ",") && val.trim()) {
      e.preventDefault();
      if (!tags.includes(val.trim()) && tags.length < 10) setTags([...tags, val.trim()]);
      setVal("");
    }
    if (e.key === "Backspace" && !val && tags.length) setTags(tags.slice(0,-1));
  };
  return (
    <div style={{ background:focus?"rgba(255,255,255,.07)":"rgba(255,255,255,.05)", border:`1px solid ${focus?"rgba(255,255,255,.25)":"rgba(255,255,255,.08)"}`, borderRadius:6, padding:"8px 10px", display:"flex", flexWrap:"wrap", gap:5, cursor:"text", transition:"all .15s", minHeight:44 }}
      onClick={e=>e.currentTarget.querySelector("input").focus()}>
      {tags.map(t => (
        <div key={t} style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,.1)", borderRadius:4, padding:"2px 8px" }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.75)", fontFamily:INTER }}>{t}</span>
          <span onClick={e=>{e.stopPropagation();setTags(tags.filter(x=>x!==t));}} style={{ fontSize:10, color:"rgba(255,255,255,.35)", cursor:"pointer", lineHeight:1, transition:"color .12s" }}
            onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.8)"}
            onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.35)"}>✕</span>
        </div>
      ))}
      <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={add}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        placeholder={tags.length===0?"añade intereses...":""}
        style={{ background:"transparent", border:"none", outline:"none", fontSize:12, color:"rgba(255,255,255,.65)", fontFamily:INTER, minWidth:100, flex:1 }}/>
    </div>
  );
}

const PLATFORMS = ["Discord","Twitter","Instagram","Tumblr","GitHub","YouTube","Spotify","otro"];

function LinkRow({ link, onChange, onRemove }) {
  const [f1, setF1] = useState(false);
  const [f2, setF2] = useState(false);
  return (
    <div style={{ display:"flex", gap:8 }}>
      <select value={link.plat} onChange={e=>onChange("plat",e.target.value)}
        style={{ background:"rgba(255,255,255,.05)", border:`1px solid ${f1?"rgba(255,255,255,.25)":"rgba(255,255,255,.08)"}`, borderRadius:6, color:"rgba(255,255,255,.65)", fontFamily:INTER, fontSize:12, padding:"8px 10px", outline:"none", width:110, flexShrink:0, cursor:"pointer", transition:"all .15s" }}
        onFocus={()=>setF1(true)} onBlur={()=>setF1(false)}>
        {PLATFORMS.map(p=><option key={p} value={p} style={{ background:"#1e1e1e" }}>{p}</option>)}
      </select>
      <input value={link.url} onChange={e=>onChange("url",e.target.value)} placeholder="https://..."
        style={{ flex:1, background:f2?"rgba(255,255,255,.07)":"rgba(255,255,255,.05)", border:`1px solid ${f2?"rgba(255,255,255,.25)":"rgba(255,255,255,.08)"}`, borderRadius:6, color:"rgba(255,255,255,.75)", fontFamily:MONO, fontSize:12, padding:"8px 12px", outline:"none", transition:"all .15s", boxSizing:"border-box" }}
        onFocus={()=>setF2(true)} onBlur={()=>setF2(false)}/>
      <button onClick={onRemove} style={{ width:34, height:34, background:"transparent", border:"1px solid rgba(255,255,255,.07)", borderRadius:6, color:"rgba(255,255,255,.25)", cursor:"pointer", fontSize:14, transition:"all .15s", flexShrink:0 }}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,50,50,.08)";e.currentTarget.style.color="rgba(255,100,100,.7)";e.currentTarget.style.borderColor="rgba(255,50,50,.15)";}}
        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.25)";e.currentTarget.style.borderColor="rgba(255,255,255,.07)";}}>✕</button>
    </div>
  );
}

function PDivider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,.06)" }}/>
      {label && <span style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontFamily:INTER, letterSpacing:".08em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{label}</span>}
      {label && <div style={{ flex:1, height:1, background:"rgba(255,255,255,.06)" }}/>}
    </div>
  );
}

function PTab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ background:"transparent", border:"none", cursor:"pointer", fontFamily:INTER, fontSize:13, fontWeight:active?500:400, color:active?"rgba(255,255,255,.88)":"rgba(255,255,255,.35)", padding:"10px 0", borderBottom:`2px solid ${active?"rgba(255,255,255,.7)":"transparent"}`, transition:"all .15s", letterSpacing:".01em" }}
      onMouseEnter={e=>{ if(!active) e.currentTarget.style.color="rgba(255,255,255,.6)"; }}
      onMouseLeave={e=>{ if(!active) e.currentTarget.style.color="rgba(255,255,255,.35)"; }}>
      {children}
    </button>
  );
}

function EditModal({ profile, user, onClose, onSave }) {
  const [tab,    setTab]    = useState("perfil");
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);

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

// ── PÁGINA PRINCIPAL ──
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router  = useRouter();
  const fileRef = useRef(null);
  const picRefs = useRef([null,null,null,null,null,null]);

  const [perfil,          setPerfil]          = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [showEdit,        setShowEdit]        = useState(false);
  const [avatarHover,     setAvatarHover]     = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveMsg,         setSaveMsg]         = useState("");
  const [pictures,        setPictures]        = useState([null,null,null,null,null,null]);
  const [localPosts,      setLocalPosts]      = useState(null);
  const [lightboxSrc,     setLightboxSrc]     = useState(null);

  const border = "1px solid rgba(255,255,255,.07)";
  const card   = { border, padding: 16, background: "#050505" };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "profile-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&display=swap');
      @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes savePop { 0%{opacity:0;transform:translateY(4px)} 20%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
      body { background:#000; color:#e8e4d9; font-family:'Inter',sans-serif; font-size:13px; overflow-x:hidden; }
      body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:.04; pointer-events:none; z-index:9998; }
      ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#000} ::-webkit-scrollbar-thumb{background:#222}
      .profile-wrap { padding:68px 28px 48px; max-width:960px; margin:0 auto; animation:fadeIn .5s ease; }
      .sec-title { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.18em; margin-bottom:12px; color:rgba(255,255,255,.7); }
      .avatar-wrap { width:100%; aspect-ratio:1; background:#0a0a0a; border:${border}; overflow:hidden; position:relative; cursor:pointer; }
      .avatar-ol { position:absolute; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:4px; transition:opacity .2s; font-family:'Inter',sans-serif; font-size:11px; color:#e8e4d9; }
      .pic-cell { aspect-ratio:1; background:#080808; border:1px solid rgba(255,255,255,.05); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:border-color .2s; overflow:hidden; }
      .pic-cell:hover { border-color:rgba(255,255,255,.15); }
      .post-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,.04); font-size:12px; font-family:'Inter',sans-serif; }
      .post-row:last-child { border-bottom:none; }
    `;
    document.head.appendChild(s);
    return () => document.getElementById("profile-styles")?.remove();
  }, []);

  const fetchPerfil = async () => {
    if (!session?.user?.dbId) return;
    try {
      let res = await fetch(`${API}/api/perfil`, { credentials: "include" });
      if (res.status === 401) {
        const googleId = session.user.googleId || session.user.id;
        await fetch(`${API}/api/auth/login`, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleId }),
        });
        res = await fetch(`${API}/api/perfil`, { credentials: "include" });
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPerfil(data);
      setLocalPosts(data.posts || []);
    } catch (err) {
      console.error("Error cargando perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchPerfil();
  }, [status, session]);

  const handleAvatarChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch(`${API}/api/perfil/avatar`, { method: "PUT", credentials: "include", body: fd });
      const data = await res.json();
      if (data.ok) {
        setPerfil(p => ({ ...p, user: { ...p.user, imagen: data.url } }));
        toast("Avatar actualizado");
      }
    } catch {}
    finally { setUploadingAvatar(false); e.target.value = ""; }
  };

  const handlePicUpload = async (idx, file) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch(`${API}/api/upload/imagen`, { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (data.url) {
        const arr = [...pictures]; arr[idx] = data.url; setPictures(arr);
      }
    } catch {}
  };

  const handleSave = async fields => {
    try {
      const res  = await fetch(`${API}/api/perfil`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (data.ok) { await fetchPerfil(); setShowEdit(false); toast("Perfil guardado"); }
    } catch {}
  };

  const handleDeletePost = async postId => {
    try {
      await fetch(`${API}/api/posts/${postId}`, { method: "DELETE", credentials: "include" });
      setLocalPosts(prev => prev.filter(p => p.id !== postId));
    } catch {}
  };

  const toast = msg => { setSaveMsg(msg); setTimeout(() => setSaveMsg(""), 2500); };

  if (status === "loading" || loading) return null;
  if (!perfil) return null;

  const { user, profile, stats } = perfil;
  const posts = localPosts ?? perfil.posts ?? [];

  const intereses = Array.isArray(profile.intereses) ? profile.intereses
    : profile.intereses ? Object.values(profile.intereses) : [];
  const links = Array.isArray(profile.links) ? profile.links
    : profile.links ? Object.values(profile.links) : [];

  const avatarUrl = user.imagen
    ? (user.imagen.startsWith("http") ? user.imagen : `${API}${user.imagen}`)
    : null;

  return (
    <>
      <Navbar />

      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarChange} />
      {[0,1,2,3,4,5].map(i => (
        <input key={i} type="file" accept="image/*" style={{ display:"none" }}
          ref={el => picRefs.current[i] = el}
          onChange={e => { const f = e.target.files?.[0]; if (f) handlePicUpload(i, f); e.target.value = ""; }} />
      ))}

      {showEdit && <EditModal profile={profile} user={user} onClose={() => setShowEdit(false)} onSave={handleSave} />}

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {saveMsg && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", background:"#fff", color:"#000", padding:"8px 20px", fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, zIndex:2000, animation:"savePop 2.5s ease forwards", borderRadius:4 }}>
          {saveMsg}
        </div>
      )}

      <div className="profile-wrap">

        {/* Header */}
        <div style={{ borderBottom:"1px solid rgba(255,255,255,.06)", paddingBottom:18, marginBottom:24 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:30, color:"#e8e4d9", letterSpacing:".06em", lineHeight:1.1 }}>
            {user.nombre || user.username}
          </div>
          {profile.statusText && (
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:"#555", marginTop:5, fontStyle:"italic" }}>
              {profile.statusText}
            </div>
          )}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"210px 1fr 230px", gap:12 }}>

          {/* IZQUIERDA */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div className="avatar-wrap"
              onClick={() => !uploadingAvatar && fileRef.current?.click()}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                : <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,.07)", lineHeight:1.3, textAlign:"center", whiteSpace:"pre", userSelect:"none" }}>
                    {"  ░▒▒▒▒▒░\n ▒██████▒\n▒████████▒\n▒██▒▒▒██▒\n ▒██████▒\n  ░▒▒▒▒░"}
                  </div>
              }
              <div className="avatar-ol" style={{ opacity: uploadingAvatar ? 1 : avatarHover ? 1 : 0 }}>
                {uploadingAvatar ? <span>subiendo...</span> : <><span style={{ fontSize:20 }}>+</span><span>cambiar foto</span></>}
              </div>
            </div>

            <SpotifyWidget userId={user.id}
              onConnect={() => window.location.href = `${API}/api/spotify/auth`}
              onDisconnect={() => fetchPerfil()} />

            <div style={card}>
              <div className="sec-title">† Stats</div>
              <TerminalCounter label="visitas" value={stats?.visitas || 0} />
              <TerminalCounter label="vlogs"   value={stats?.vlogs   || 0} />
              <TerminalCounter label="amigos"  value={stats?.amigos  || 0} />
              <TerminalCounter label="desde"   value={null} text={
                user.creadoEn ? new Date(user.creadoEn).toLocaleDateString("es-MX", { month:"short", year:"numeric" }) : "—"
              } />
            </div>
          </div>

          {/* CENTRAL */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={card}>
              <div className="sec-title">† Sobre mí</div>
              {profile.bio
                ? <div style={{ fontSize:13, color:"rgba(232,228,217,.65)", lineHeight:1.75, fontFamily:"'Inter',sans-serif" }}>{profile.bio}</div>
                : <div style={{ fontSize:12, color:"#222", cursor:"pointer" }} onClick={() => setShowEdit(true)}>+ agregar bio...</div>
              }
            </div>

            <div style={card}>
              <div className="sec-title">† Intereses</div>
              {intereses.length > 0
                ? intereses.map((t, i) => (
                  <div key={i} style={{ display:"flex", gap:10, marginBottom:5, fontSize:13, color:"rgba(232,228,217,.6)", fontFamily:"'Inter',sans-serif" }}>
                    <span style={{ color:"rgba(255,255,255,.18)", flexShrink:0 }}>—</span><span>{t}</span>
                  </div>
                ))
                : <div style={{ fontSize:12, color:"#222", cursor:"pointer" }} onClick={() => setShowEdit(true)}>+ agregar intereses...</div>
              }
            </div>

            <div style={card}>
              <div className="sec-title">† Posts</div>
              {posts.length > 0
                ? posts.map((p, i) => (
                  <div key={p.id || i} style={{ marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,.04)", paddingBottom: 12 }}>
                    {/* Imagen grande si existe */}
                    {p.imagen && (
                      <div onClick={() => setLightboxSrc(p.imagen)}
                        style={{ marginBottom: 8, background: "#050505", overflow: "hidden", borderRadius: 2, cursor: "pointer" }}>
                        <img
                          src={p.imagen.startsWith("http") ? p.imagen : `${API}${p.imagen}`}
                          alt=""
                          style={{ width: "100%", maxHeight: 320, objectFit: "contain", background: "#050505", display: "block" }}
                        />
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ display:"flex", gap:8, color:"#e8e4d9", overflow:"hidden", alignItems:"center", flex:1 }}>
                        {(p.titulo || p.contenido?.trim()) && (
                          <>
                            <span style={{ color:"rgba(255,255,255,.18)", flexShrink:0 }}>—</span>
                            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:12, fontFamily:"'Inter',sans-serif" }}>
                              {p.titulo || p.contenido?.slice(0, 50)}
                            </span>
                          </>
                        )}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, marginLeft:10 }}>
                        <span style={{ color:"#3a3a3a", fontSize:11 }}>
                          {new Date(p.creadoEn).toLocaleDateString("es-MX", { month:"short", day:"numeric" })}
                        </span>
                        <TrashBtn s={2} onDelete={() => handleDeletePost(p.id)} />
                      </div>
                    </div>
                  </div>
                ))
                : <div style={{ fontSize:12, color:"#222" }}>no hay posts aún</div>
              }
            </div>
          </div>

          {/* DERECHA */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={card}>
              <div className="sec-title">† Pictures</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className="pic-cell" onClick={() => picRefs.current[i]?.click()}>
                    {pictures[i]
                      ? <img src={`${API}${pictures[i]}`} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                      : <span style={{ fontSize:16, color:"rgba(255,255,255,.07)" }}>+</span>
                    }
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <div className="sec-title">† Links</div>
              {links.length > 0
                ? links.map((l, i) => {
                  const lbl = typeof l === "string" ? l : l.label;
                  const url = typeof l === "string" ? "#" : (l.url || "#");
                  return (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      style={{ display:"flex", gap:8, padding:"5px 0", fontSize:12, color:"#555", cursor:"pointer", transition:"color .2s", textDecoration:"none", fontFamily:"'Inter',sans-serif" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#e8e4d9"}
                      onMouseLeave={e => e.currentTarget.style.color = "#555"}>
                      <span style={{ color:"rgba(255,255,255,.15)" }}>→</span> {lbl}
                    </a>
                  );
                })
                : <div style={{ fontSize:12, color:"#222" }}>+ agregar links...</div>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}