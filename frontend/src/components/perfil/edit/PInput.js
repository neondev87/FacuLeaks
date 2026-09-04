"use client";

import { useState } from "react";
import { INTER } from "./constants";

// ── Input de texto con estado de foco ──
export default function PInput({ value, onChange, placeholder, style={} }) {
  const [focus, setFocus] = useState(false);
  const base = { width:"100%", background:focus?"rgba(255,255,255,.07)":"rgba(255,255,255,.05)", border:`1px solid ${focus?"rgba(255,255,255,.25)":"rgba(255,255,255,.08)"}`, borderRadius:6, color:"rgba(255,255,255,.85)", fontFamily:INTER, fontSize:14, padding:"10px 12px", outline:"none", transition:"border-color .15s, background .15s", boxSizing:"border-box" };
  return <input value={value} onChange={onChange} placeholder={placeholder} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} style={{...base,...style}}/>;
}
