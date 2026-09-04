"use client";

// MÓDULO: components/register/TermLine.js
// Una línea de texto "terminal" que aparece después de `delay` ms — el
// efecto de mensajes de sistema apareciendo uno tras otro en el registro.
// Componente "tonto", sin conexión a backend.
import { useState, useEffect } from "react";

export default function TermLine({ text, color = "rgba(255,255,255,.9)", delay = 0, style = {} }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  return (
    <div style={{
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 12, letterSpacing: ".06em",
      color, lineHeight: 1.7, ...style,
    }}>
      {text}
    </div>
  );
}
