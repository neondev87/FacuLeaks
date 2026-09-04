"use client";

import { useState, useEffect, useRef } from "react";
import PixelHeart from "./pixel/PixelHeart";

// ── HEART ICON ──
export default function HeartIcon({ count = 0, reaction, setReaction }) {
  const liked = reaction === "heart";
  const [phase, setPhase] = useState("idle");
  const resetRef = useRef();

  const trigger = () => {
    clearTimeout(resetRef.current);
    if (liked) { setReaction(null); setPhase("idle"); return; }
    if (reaction === "skull") return; // bloqueado
    setReaction("heart");
    setPhase("white");
    setTimeout(() => setPhase("dead"), 280);
    setTimeout(() => setPhase("gone"), 620);
    resetRef.current = setTimeout(() => setPhase("idle"), 1800);
  };

  useEffect(() => () => clearTimeout(resetRef.current), []);

  const disabled = reaction === "skull";

  return (
    <button onClick={trigger} disabled={disabled}
      style={{ background:"none", border:"none", cursor: disabled ? "default" : "pointer", padding:"4px 6px", display:"flex", alignItems:"center", gap:6, borderRadius:2, transition:"background .15s, opacity .2s", outline:"none", opacity: disabled ? .2 : 1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >
      <div style={{
        display:"inline-block",
        transition: phase === "dead" ? "all .38s cubic-bezier(.4,0,.6,1)" : "none",
        opacity:   phase === "dead" || phase === "gone" ? 0 : 1,
        transform: phase === "dead" ? "scale(.15) rotate(-30deg)" : "scale(1)",
        filter:    phase === "white" ? "saturate(0) brightness(6)" : "none",
      }}>
        <PixelHeart s={3} white={phase === "white"} />
      </div>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color: liked ? "#c00000" : "#444", letterSpacing:".1em", transition:"color .3s" }}>
        {count + (liked ? 1 : 0)}
      </span>
    </button>
  );
}
