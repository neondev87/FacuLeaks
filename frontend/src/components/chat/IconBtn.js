"use client";

import { useState } from "react";

// MÓDULO: components/chat/IconBtn.js
// Botón genérico para los íconos de la barra de escribir del chat
// (adjuntar imagen, stickers, micrófono) — le da a cualquier ícono el mismo
// hover/disabled. No sabe nada de lo que hace cada botón, solo envuelve
// `children` con el comportamiento visual. Lo usa app/chat/page.js.
export default function IconBtn({ onClick, title, children, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:"none", border:"none", cursor: disabled ? "not-allowed" : "pointer", padding:"0 4px", transition:"opacity .15s", display:"flex", alignItems:"center", justifyContent:"center", opacity: disabled ? .3 : hov ? 1 : .5 }}>
      {children}
    </button>
  );
}
