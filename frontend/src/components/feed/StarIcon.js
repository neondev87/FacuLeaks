"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/feed/StarIcon.js — botón de reacción LIKE (Fase 3)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: estrella de marcador/grafiti — se llena de dorado y estalla un
// resplandor radial cuando pasa a estar activa. Mismo contrato "controlado"
// que HeartIcon.js (al que reemplaza): recibe `active`/`count` como props y
// solo avisa el click con `onToggle`, no decide el dato real.
//
// CON QUÉ SE CONECTA: components/feed/reactions.js lo enchufa como ícono de
// LIKE; lo dibuja components/feed/PostCard.js. El click termina en
// `toggleReaction()` de hooks/useFeedPosts.js.
// ════════════════════════════════════════════════════════════════════════
export default function StarIcon({ active = false, count = 0, disabled = false, onToggle }) {
  const [burstKey, setBurstKey] = useState(0);

  const trigger = () => {
    if (disabled) return;
    if (!active) setBurstKey(k => k + 1);
    onToggle?.();
  };

  return (
    <button onClick={trigger} disabled={disabled}
      style={{ background:"none", border:"none", cursor: disabled ? "default" : "pointer", padding:"4px 6px", display:"flex", alignItems:"center", gap:6, borderRadius:2, transition:"background .15s, opacity .2s", outline:"none", opacity: disabled ? .2 : 1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >
      <div style={{ position:"relative", width:14, height:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <AnimatePresence>
          {burstKey > 0 && (
            <motion.span
              key={burstKey}
              initial={{ opacity: 1, scale: .3 }}
              animate={{ opacity: 0, scale: 1.9 }}
              transition={{ duration: .45, ease: "easeOut" }}
              style={{ position:"absolute", inset:-9, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,210,61,.55), transparent 65%)", pointerEvents:"none" }}
            />
          )}
        </AnimatePresence>
        <motion.svg
          width="14" height="14" viewBox="0 0 24 24"
          animate={active ? { scale: [1, 1.3, .92, 1] } : { scale: 1 }}
          transition={{ duration: .38, ease: "easeOut" }}
          style={{ stroke: active ? "#ffd23d" : "rgba(255,255,255,.35)", fill: active ? "#ffd23d" : "none", strokeWidth: 1.4 }}
        >
          <path d="M12 2l2.4 6.8L21 10l-5.5 4.3L17 21l-5-3.8L7 21l1.5-6.7L3 10l6.6-1.2z" />
        </motion.svg>
      </div>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color: active ? "#ffd23d" : "#444", letterSpacing:".1em", transition:"color .3s" }}>
        {count}
      </span>
    </button>
  );
}
