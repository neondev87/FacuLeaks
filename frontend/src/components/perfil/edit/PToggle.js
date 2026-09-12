"use client";

import { INTER } from "./constants";

// MÓDULO: components/perfil/edit/PToggle.js
// Switch chiquito (redondo, on/off) con una etiqueta al lado — lo usa
// EditModal.js para "mostrar situación sentimental directo en mi perfil".
// Componente "tonto": recibe `checked`/`onChange`, no valida ni guarda nada.
export default function PToggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      style={{ display:"flex", alignItems:"center", gap:9, background:"none", border:"none", padding:0, cursor:"pointer" }}>
      <span style={{
        position:"relative", width:34, height:19, borderRadius:999, flexShrink:0,
        background: checked ? "rgba(120,200,140,.85)" : "rgba(255,255,255,.14)",
        transition:"background .15s",
      }}>
        <span style={{
          position:"absolute", top:2, left: checked ? 17 : 2, width:15, height:15, borderRadius:"50%",
          background:"#fff", transition:"left .15s", boxShadow:"0 1px 3px rgba(0,0,0,.4)",
        }} />
      </span>
      <span style={{ fontFamily:INTER, fontSize:12, color:"rgba(255,255,255,.5)" }}>{label}</span>
    </button>
  );
}
