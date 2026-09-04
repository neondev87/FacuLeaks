"use client";

import { useEffect } from "react";
import { API } from "@/lib/api";

// ── LIGHTBOX ──
// Visor de imagen a pantalla completa. Cierra con click fuera o Escape.
// Acepta `src` absoluto (http…) o relativo al backend (/uploads/…).
// `dim` = color de fondo del overlay (feed usaba .92; perfil usa .95).
export default function Lightbox({ src, onClose, dim = "rgba(0,0,0,.92)" }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:dim, zIndex:99999, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
      <img src={src.startsWith("http") ? src : `${API}${src}`} alt="full" onClick={e => e.stopPropagation()}
        style={{ maxWidth:"92vw", maxHeight:"92vh", objectFit:"contain", cursor:"default", border:"1px solid rgba(255,255,255,.1)" }} />
      <div style={{ position:"absolute", top:20, right:24, color:"rgba(255,255,255,.4)", fontSize:22, cursor:"pointer" }} onClick={onClose}>✕</div>
    </div>
  );
}
