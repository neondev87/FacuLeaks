"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/Lightbox.js — visor de imagen a pantalla completa
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: tapa toda la pantalla con la imagen en grande. Se cierra
// clickeando afuera o con la tecla Escape. Acepta tanto una URL completa
// (http://...) como una relativa al backend (/uploads/...) — en el segundo
// caso le agrega automáticamente la URL del backend (lib/api.js).
//
// PARA QUÉ SIRVE: es el visor genérico que se reutiliza en varios lugares
// en vez de reimplementar el mismo "modal de imagen" cada vez.
//
// CON QUÉ SE CONECTA: no llama al backend, es puramente visual. Lo usan
// components/feed/PostCard.js, components/PostCard.js (perfil) y
// components/chat/Bubble.js (para las fotos del chat).
// ════════════════════════════════════════════════════════════════════════
import { useEffect } from "react";
import { API } from "@/lib/api";

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
