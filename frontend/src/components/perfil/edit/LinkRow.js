"use client";

import { useState } from "react";
import { INTER, MONO, PLATFORMS } from "./constants";

// MÓDULO: components/perfil/edit/LinkRow.js
// Una fila del modal de editar perfil: selector de plataforma (Discord,
// Twitter...) + input de URL + botón de quitar. Puramente de formulario,
// sin conexión al backend — EditModal.js junta todas las filas y las manda
// juntas cuando el usuario guarda.
export default function LinkRow({ link, onChange, onRemove }) {
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
