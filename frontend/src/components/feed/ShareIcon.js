"use client";

import { motion } from "framer-motion";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/feed/ShareIcon.js — botón de "compartir a mi perfil"
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: flecha de reenvío estilo TikTok/Instagram (sin el amarillo del
// LIKE — ese color queda reservado para StarIcon). Mismo contrato
// "controlado" que StarIcon/MarkerIcon: recibe `active`/`count`, solo avisa
// el click con `onToggle`, no decide el dato real.
//
// CON QUÉ SE CONECTA: lo dibuja components/feed/PostCard.js (solo en posts
// con privacidad:"PUBLICA" — ver posts.controller.js toggleShare). El click
// termina en `toggleShare()` de hooks/useFeedPosts.js.
// ════════════════════════════════════════════════════════════════════════
export default function ShareIcon({ active = false, count = 0, onToggle }) {
  return (
    <button onClick={onToggle}
      style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 6px", display:"flex", alignItems:"center", gap:6, borderRadius:2, transition:"background .15s", outline:"none" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
    >
      <motion.svg
        width="14" height="14" viewBox="0 0 24 24"
        animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: .3, ease: "easeOut" }}
        style={{ stroke: active ? "rgba(159,224,255,.9)" : "rgba(255,255,255,.35)", fill:"none", strokeWidth: 1.6, strokeLinecap:"round", strokeLinejoin:"round" }}
      >
        <path d="M13 5l7 7-7 7" />
        <path d="M20 12H9a5 5 0 0 0-5 5v1" />
      </motion.svg>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color: active ? "rgba(159,224,255,.9)" : "#444", letterSpacing:".1em", transition:"color .3s" }}>
        {count}
      </span>
    </button>
  );
}
