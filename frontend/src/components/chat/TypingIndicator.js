"use client";

import { useState, useEffect } from "react";

// ── Indicador "escribiendo..." del otro usuario ──
export default function TypingIndicator({ username }) {
  const frames = ["_", "._", ".._", "..._"];
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % frames.length), 380);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginBottom:10, animation:"fadeUp .18s ease" }}>
      <div className="avatar-sm">◈</div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
        <div style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace", color:"rgba(255,255,255,.28)", marginBottom:3, letterSpacing:".08em" }}>{username}</div>
        <div style={{ background:"#0d0d0d", borderRadius:3, padding:"8px 14px", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:"rgba(255,255,255,.25)", letterSpacing:".04em" }}>escribiendo</span>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:"rgba(255,255,255,.55)", letterSpacing:".04em", minWidth:28, display:"inline-block" }}>{frames[frame]}</span>
          <span style={{ display:"inline-block", width:7, height:13, background:"rgba(255,255,255,.45)", animation:"blink 1s step-end infinite", verticalAlign:"middle", marginLeft:1 }} />
        </div>
      </div>
    </div>
  );
}
