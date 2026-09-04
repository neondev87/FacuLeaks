"use client";

import { INTER } from "./constants";

// ── Pestaña del modal de editar perfil ──
export default function PTab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ background:"transparent", border:"none", cursor:"pointer", fontFamily:INTER, fontSize:13, fontWeight:active?500:400, color:active?"rgba(255,255,255,.88)":"rgba(255,255,255,.35)", padding:"10px 0", borderBottom:`2px solid ${active?"rgba(255,255,255,.7)":"transparent"}`, transition:"all .15s", letterSpacing:".01em" }}
      onMouseEnter={e=>{ if(!active) e.currentTarget.style.color="rgba(255,255,255,.6)"; }}
      onMouseLeave={e=>{ if(!active) e.currentTarget.style.color="rgba(255,255,255,.35)"; }}>
      {children}
    </button>
  );
}
