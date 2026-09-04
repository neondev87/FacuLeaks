"use client";

import { useState, useEffect } from "react";
import { API } from "@/lib/api";

// MÓDULO: components/chat/AudioReplyPreview.js
// Cuando respondés a un mensaje de audio, muestra "🎤 0:07" en vez del
// audio completo (sería raro tener un reproductor adentro de la cita). Solo
// necesita la duración, así que carga el audio en silencio para leer su
// metadata. Lo usa components/chat/Bubble.js.
export default function AudioReplyPreview({ src }) {
  const [dur, setDur] = useState("...");
  useEffect(() => {
    const a = new Audio();
    a.crossOrigin = "use-credentials"; // manda la cookie al backend (audio gateado)
    a.src = `${API}${src}`;
    a.onloadedmetadata = () => {
      const s = Math.floor(a.duration);
      setDur(`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`);
    };
  }, [src]);
  return <span>🎤 {dur}</span>;
}
