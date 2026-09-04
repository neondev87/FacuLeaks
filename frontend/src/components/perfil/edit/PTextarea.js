"use client";

import { useState } from "react";
import { INTER } from "./constants";

// MÓDULO: components/perfil/edit/PTextarea.js
// Igual que PInput.js pero para texto largo (la bio). Mismo criterio: solo
// estilo, sin lógica de negocio.
export default function PTextarea({ value, onChange, placeholder, rows=4 }) {
  const [focus, setFocus] = useState(false);
  const base = { width:"100%", background:focus?"rgba(255,255,255,.07)":"rgba(255,255,255,.05)", border:`1px solid ${focus?"rgba(255,255,255,.25)":"rgba(255,255,255,.08)"}`, borderRadius:6, color:"rgba(255,255,255,.85)", fontFamily:INTER, fontSize:14, padding:"10px 12px", outline:"none", transition:"border-color .15s, background .15s", resize:"vertical", lineHeight:1.6, boxSizing:"border-box" };
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} style={base}/>;
}
