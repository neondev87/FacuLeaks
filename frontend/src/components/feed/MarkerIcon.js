"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/feed/MarkerIcon.js — botón de reacción DISLIKE (Fase 3)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: mini-tag en forma de estrella (para hacer pareja visual con
// StarIcon.js) tachado por un marcador — el tachón se dibuja con
// `pathLength` de Framer Motion según el estado real (`active`), no con un
// efecto transitorio, así se ve tachado también al recargar la página si ya
// habías reaccionado. Al activar, un pequeño "cap" de marcador se desliza y
// desaparece, como si acabara de pasar por ahí. Reemplaza a SkullIcon.js con
// el mismo contrato controlado (`active`/`count`/`onToggle`).
//
// CON QUÉ SE CONECTA: components/feed/reactions.js lo enchufa como ícono de
// DISLIKE; lo dibuja components/feed/PostCard.js. El click termina en
// `toggleReaction()` de hooks/useFeedPosts.js.
// ════════════════════════════════════════════════════════════════════════
export default function MarkerIcon({ active = false, count = 0, disabled = false, onToggle }) {
  const [swipeKey, setSwipeKey] = useState(0);

  const trigger = () => {
    if (disabled) return;
    if (!active) setSwipeKey(k => k + 1);
    onToggle?.();
  };

  return (
    <button onClick={trigger} disabled={disabled}
      style={{ background:"none", border:"none", cursor: disabled ? "default" : "pointer", padding:"4px 6px", display:"flex", alignItems:"center", gap:6, borderRadius:2, transition:"background .15s, opacity .2s", outline:"none", opacity: disabled ? .2 : 1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >
      <div style={{ position:"relative", width:14, height:14 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ stroke: active ? "#c0524a" : "rgba(255,255,255,.35)", fill:"none", strokeWidth:1.6 }}>
          <path d="M12 5l1.4 4h4.2l-3.4 2.5 1.3 4-3.5-2.5-3.5 2.5 1.3-4L6.4 9h4.2z" />
          {/* El tachón queda siempre trazado (aunque tenue) para que el botón
              se distinga del de like en reposo — solo cambia de color/grosor
              al activarse, en vez de aparecer de la nada. */}
          <motion.path
            d="M4 20l16-16"
            strokeLinecap="round"
            initial={false}
            animate={{
              pathLength: 1,
              stroke: active ? "#c0524a" : "rgba(255,255,255,.3)",
              strokeWidth: active ? 2.4 : 1.4,
            }}
            transition={{ duration: .22, ease: "easeOut" }}
          />
        </svg>
        <AnimatePresence>
          {swipeKey > 0 && (
            <motion.div
              key={swipeKey}
              initial={{ opacity: 1, x: 0, y: 0, rotate: -15 }}
              animate={{ opacity: 0, x: 10, y: -10 }}
              transition={{ duration: .3, ease: "easeOut" }}
              style={{ position:"absolute", left:-2, top:8, width:6, height:6, background:"#c0524a", clipPath:"polygon(0 100%,100% 100%,50% 0%)", pointerEvents:"none" }}
            />
          )}
        </AnimatePresence>
      </div>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color: active ? "#c0524a" : "#444", letterSpacing:".1em", transition:"color .3s" }}>
        {count}
      </span>
    </button>
  );
}
