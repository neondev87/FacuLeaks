"use client";

import { motion } from "framer-motion";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/feed/BrokenHeartIcon.js — botón de reacción DISLIKE
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: corazón partido al medio por una grieta — al activarse la
// grieta se traza, las dos mitades se separan y se desvanecen, y quedan
// otra vez enteras (ya coloreadas, como estado de reposo "activo"). Mismo
// contrato controlado que el resto de los íconos de reacción: recibe
// `active`/`count`/`disabled` y solo avisa el click con `onToggle`, no
// decide el dato real.
//
// CON QUÉ SE CONECTA: components/feed/reactions.js lo enchufa como ícono de
// DISLIKE; lo dibuja components/feed/PostCard.js y components/PostCard.js.
// El click termina en toggleReaction() de hooks/useFeedPosts.js.
// ════════════════════════════════════════════════════════════════════════

const HEART_LEFT  = "M12 21 C 6 15, 2 11, 2 7.5 C 2 4.5 4.5 2 7.5 2 C 9.5 2 11 3 12 5 L12 21 Z";
const HEART_RIGHT = "M12 21 C 18 15, 22 11, 22 7.5 C 22 4.5 19.5 2 16.5 2 C 14.5 2 13 3 12 5 L12 21 Z";
const CRACK       = "M12 4 L10.5 8 L13.5 11 L10 14 L12 20";

export default function BrokenHeartIcon({ active = false, count = 0, disabled = false, onToggle }) {
  const trigger = () => { if (!disabled) onToggle?.(); };
  const color = active ? "#8b8fd9" : "rgba(255,255,255,.28)";

  return (
    <button onClick={trigger} disabled={disabled}
      style={{ background:"none", border:"none", cursor: disabled ? "default" : "pointer", padding:"4px 6px", display:"flex", alignItems:"center", gap:6, borderRadius:2, transition:"background .15s, opacity .2s", outline:"none", opacity: disabled ? .2 : 1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >
      <div style={{ position:"relative", width:14, height:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="14" height="14" viewBox="0 0 24 24">
          <motion.path
            d={HEART_LEFT}
            style={{ fill: color, transformOrigin: "65% 45%", transition: "fill .2s" }}
            animate={active
              ? { x: [0, -1.8, 0], y: [0, 1.8, 0], rotate: [0, -12, 0], opacity: [1, 0, 1] }
              : { x: 0, y: 0, rotate: 0, opacity: 1 }}
            transition={{ duration: .78, times: active ? [0, .55, 1] : undefined, ease: "easeInOut" }}
          />
          <motion.path
            d={HEART_RIGHT}
            style={{ fill: color, transformOrigin: "35% 45%", transition: "fill .2s" }}
            animate={active
              ? { x: [0, 1.8, 0], y: [0, 1.8, 0], rotate: [0, 12, 0], opacity: [1, 0, 1] }
              : { x: 0, y: 0, rotate: 0, opacity: 1 }}
            transition={{ duration: .78, times: active ? [0, .55, 1] : undefined, ease: "easeInOut" }}
          />
          <motion.path
            d={CRACK}
            fill="none" stroke="#e7e6f5" strokeWidth="1.3" strokeLinecap="round"
            initial={false}
            animate={{
              pathLength: active ? [0, 1, 1, 0] : 0,
              opacity: active ? [0, 1, 1, 0] : 0,
            }}
            transition={{ duration: .78, times: active ? [0, .25, .55, .7] : undefined, ease: "easeInOut" }}
          />
        </svg>
      </div>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color: active ? "#8b8fd9" : "#444", letterSpacing:".1em", transition:"color .3s" }}>
        {count}
      </span>
    </button>
  );
}
