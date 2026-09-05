"use client";

import { useState, useEffect } from "react";
import { HOLO_THEME } from "@/lib/theme";

// MÓDULO: components/perfil/TerminalCounter.js
// Fila de estadística del perfil (ej. "amigos: 12") con el número animando
// de 0 hasta el valor real, estilo consola. Si le pasás `text` en vez de
// `value`, muestra ese texto fijo (para cosas que no son un número). El "_"
// parpadea con la keyframe `blink` que inyecta cada página de perfil (vía
// hooks/useInjectedStyles.js). Puramente visual, sin conexión a backend.
export default function TerminalCounter({ label, value, text }) {
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
    <div style={{ fontSize: 12, color: HOLO_THEME.textDim, display: "flex", justifyContent: "space-between", padding: "7px 0", fontFamily: "'Inter',sans-serif" }}>
      <span>{label}</span>
      <span style={{ color: HOLO_THEME.text, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
        {text || display.toLocaleString()}
        {!text && <span style={{ animation: "blink 1s step-end infinite", color: "#4a4858" }}>_</span>}
      </span>
    </div>
  );
}
