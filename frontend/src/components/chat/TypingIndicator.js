"use client";

import { useState, useEffect } from "react";
import { HOLO_THEME } from "@/lib/theme";

// MÓDULO: components/chat/TypingIndicator.js
// Burbuja "Fulano está escribiendo..._" con puntitos animados. Puramente
// visual — hooks/useChat.js decide cuándo mostrarla (typing:start/stop por
// socket), este componente solo la dibuja. Lo usa app/chat/page.js.
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
        <div style={{ fontSize:12, fontFamily:"'Space Mono',monospace", color:"rgba(255,255,255,.28)", marginBottom:4, letterSpacing:".08em" }}>{username}</div>
        <div style={{ background:HOLO_THEME.panel, borderRadius:12, padding:"10px 16px", border:`1px solid ${HOLO_THEME.hairlineSoft}`, display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:14, color:"rgba(255,255,255,.25)", letterSpacing:".04em" }}>escribiendo</span>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:14, color:"rgba(255,255,255,.55)", letterSpacing:".04em", minWidth:32, display:"inline-block" }}>{frames[frame]}</span>
          <span style={{ display:"inline-block", width:8, height:15, background:"rgba(255,255,255,.45)", animation:"blink 1s step-end infinite", verticalAlign:"middle", marginLeft:1 }} />
        </div>
      </div>
    </div>
  );
}
