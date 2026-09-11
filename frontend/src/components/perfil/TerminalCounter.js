"use client";

import { useState, useEffect } from "react";
import { HOLO_THEME } from "@/lib/theme";

// MÓDULO: components/perfil/TerminalCounter.js
// Fila de estadística del perfil (ej. "amigos: 12") con el número animando
// de 0 hasta el valor real, estilo consola. Si le pasás `text` en vez de
// `value`, muestra ese texto fijo (para cosas que no son un número). El "_"
// parpadea con la keyframe `blink` que inyecta cada página de perfil (vía
// hooks/useInjectedStyles.js). Puramente visual, sin conexión a backend.
// Si le pasás `onClick`, la fila entera se vuelve clickeable (cursor +
// hover + flechita) — lo usa "amigos" en app/perfil/page.js para abrir
// components/perfil/FriendsModal.js.
export default function TerminalCounter({ label, value, text, onClick }) {
  const [display, setDisplay] = useState(0);
  const [hover, setHover] = useState(false);
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
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontSize: 12,
        color: hover ? HOLO_THEME.text : HOLO_THEME.textDim,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "7px 0",
        fontFamily: "'Inter',sans-serif",
        cursor: onClick ? "pointer" : "default",
        transition: "color .15s",
      }}>
      <span>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 5, color: HOLO_THEME.text, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
        {text || display.toLocaleString()}
        {!text && <span style={{ animation: "blink 1s step-end infinite", color: "#4a4858" }}>_</span>}
        {onClick && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={hover ? HOLO_THEME.text : HOLO_THEME.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke .15s" }}>
            <path d="m9 6 6 6-6 6" />
          </svg>
        )}
      </span>
    </div>
  );
}
