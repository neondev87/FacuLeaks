"use client";

import { INTER } from "./constants";

// MÓDULO: components/perfil/edit/PDivider.js
// Línea divisoria del modal de editar perfil, con un texto opcional al medio.
export default function PDivider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,.06)" }}/>
      {label && <span style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontFamily:INTER, letterSpacing:".08em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{label}</span>}
      {label && <div style={{ flex:1, height:1, background:"rgba(255,255,255,.06)" }}/>}
    </div>
  );
}
