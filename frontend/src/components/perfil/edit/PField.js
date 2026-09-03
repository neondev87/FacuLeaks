"use client";

import { INTER, MONO } from "./constants";

// ── Campo de formulario (label + hint + children) ──
export default function PField({ label, hint, children }) {
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
