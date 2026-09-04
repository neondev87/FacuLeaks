"use client";

import { useState } from "react";

// ── Botón de ícono del composer (adjuntar, stickers, mic) ──
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
