"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/feed/HeartIcon.js — botón de reacción LIKE
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: corazón estilo "doble-tap" de Instagram — pop elástico al
// activarse y tres mini-corazones que flotan hacia arriba y se desvanecen.
// Mismo contrato controlado que el resto de los íconos de reacción: recibe
// `active`/`count`/`disabled` y solo avisa el click con `onToggle`, no
// decide el dato real.
//
// CON QUÉ SE CONECTA: components/feed/reactions.js lo enchufa como ícono de
// LIKE; lo dibuja components/feed/PostCard.js y components/PostCard.js.
// El click termina en toggleReaction() de hooks/useFeedPosts.js.
// ════════════════════════════════════════════════════════════════════════

const HEART_PATH = "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";

export default function HeartIcon({ active = false, count = 0, disabled = false, onToggle }) {
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
        {/* mini-corazones que flotan al activarse */}
        <AnimatePresence>
          {burstKey > 0 && [...Array(3)].map((_, i) => (
            <motion.span
              key={`${burstKey}-${i}`}
              initial={{ opacity: 1, x: (i - 1) * 6, y: 0, scale: .6 }}
              animate={{ opacity: 0, y: -20 - i * 3, scale: 1 }}
              transition={{ duration: .7, delay: i * .08, ease: "easeOut" }}
              style={{ position:"absolute", fontSize:9, color:"#ff5252", pointerEvents:"none" }}
            >❤</motion.span>
          ))}
        </AnimatePresence>
        <motion.svg
          width="14" height="14" viewBox="0 0 24 24"
          animate={active ? { scale: [1, 1.32, .88, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: .55, ease: "easeOut" }}
        >
          <path
            d={HEART_PATH}
            style={{ fill: active ? "#ff5252" : "rgba(255,255,255,.12)", stroke: active ? "#ff5252" : "rgba(255,255,255,.28)", strokeWidth: 1, transition: "fill .2s, stroke .2s" }}
          />
        </motion.svg>
      </div>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color: active ? "#ff5252" : "#444", letterSpacing:".1em", transition:"color .3s" }}>
        {count}
      </span>
    </button>
  );
}
