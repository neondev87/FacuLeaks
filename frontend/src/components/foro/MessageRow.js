"use client";

// MÓDULO: components/foro/MessageRow.js
// Un mensaje del foro. Componente "tonto", puramente visual — los mensajes
// de prueba viven en hooks/useForo.js (mock).
export default function MessageRow({ msg, accent = "#ffffff" }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
      <div style={{ width: 30, height: 30, background: "#0a0a0a", border: `1px solid ${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: `${accent}44`, flexShrink: 0, marginTop: 2 }}>◈</div>
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: msg.color, fontWeight: 700, letterSpacing: ".03em" }}>{msg.user}</span>
          <span style={{ fontSize: 10, color: "#333" }}>{msg.time}</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(232,228,217,.7)", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "'Space Mono', monospace" }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}
