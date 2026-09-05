"use client";

import { HOLO_THEME } from "@/lib/theme";

// MÓDULO: components/foro/MessageRow.js
// Un mensaje del foro. Componente "tonto", puramente visual — los mensajes
// de prueba viven en hooks/useForo.js (mock).
export default function MessageRow({ msg, accent = HOLO_THEME.text }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#1c1c24", border: `1px solid ${HOLO_THEME.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: HOLO_THEME.textDim, flexShrink: 0, marginTop: 2 }}>◈</div>
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: msg.color, fontWeight: 700, letterSpacing: ".03em", fontFamily: "'Inter',sans-serif" }}>{msg.user}</span>
          <span style={{ fontSize: 10, color: HOLO_THEME.textDim, fontFamily: "'Space Mono',monospace" }}>{msg.time}</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(242,240,248,.65)", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "'Inter',sans-serif" }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}
