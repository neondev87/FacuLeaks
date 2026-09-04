"use client";

import { useState, useEffect, useRef } from "react";
import PixelSkull from "./pixel/PixelSkull";

// ── SKULL ICON (reacción DISLIKE) ──
// Controlado por el padre: `active` = el usuario tiene esta reacción,
// `count` = total autoritativo del backend, `onToggle` = alterna la reacción.
// La animación de colapso de la calavera es puramente visual.
export default function SkullIcon({ active = false, count = 0, disabled = false, onToggle }) {
  const [phase, setPhase] = useState("idle");
  const resetRef = useRef();

  const trigger = () => {
    if (disabled) return;
    clearTimeout(resetRef.current);
    onToggle?.();
    if (active) { setPhase("idle"); return; }
    setPhase("dead");
    setTimeout(() => setPhase("gone"), 420);
    resetRef.current = setTimeout(() => setPhase("idle"), 1800);
  };

  useEffect(() => () => clearTimeout(resetRef.current), []);

  return (
    <button onClick={trigger} disabled={disabled}
      style={{ background:"none", border:"none", cursor: disabled ? "default" : "pointer", padding:"4px 6px", display:"flex", alignItems:"center", gap:6, borderRadius:2, transition:"background .15s, opacity .2s", outline:"none", opacity: disabled ? .2 : 1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >
      <div style={{
        display:"inline-block",
        transition: phase === "dead" ? "all .55s cubic-bezier(.4,0,1,1)" : "none",
        opacity:   phase === "dead" || phase === "gone" ? 0 : 1,
        transform: phase === "dead" ? "scale(.05) perspective(200px) translateZ(-120px)" : "scale(1)",
        filter:    phase === "dead" ? "brightness(0)" : "none",
      }}>
        <PixelSkull s={3} color={active ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.35)"} />
      </div>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color: active ? "rgba(255,255,255,.6)" : "#444", letterSpacing:".1em", transition:"color .3s" }}>
        {count}
      </span>
    </button>
  );
}
