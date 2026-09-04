"use client";

import { useState, useEffect } from "react";
import { API } from "@/lib/api";

// ── Vista previa de un audio citado en una respuesta ──
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
