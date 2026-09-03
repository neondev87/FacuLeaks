"use client";

import { useState, useEffect } from "react";

// ── Contador terminal con animación ──
// Anima de 0 a `value`; o muestra `text` fijo si viene. El "_" parpadea con
// la keyframe `blink` que inyecta cada página de perfil.
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
    <div style={{ fontSize: 12, color: "#555", display: "flex", justifyContent: "space-between", padding: "3px 0", fontFamily: "'Inter',sans-serif" }}>
      <span>{label}</span>
      <span style={{ color: "#e8e4d9", fontWeight: 500 }}>
        {text || display.toLocaleString()}
        {!text && <span style={{ animation: "blink 1s step-end infinite", color: "#333" }}>_</span>}
      </span>
    </div>
  );
}
