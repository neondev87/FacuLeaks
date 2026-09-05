"use client";

import { HOLO_THEME } from "@/lib/theme";

// MÓDULO: components/foro/ChannelItem.js
// Un canal de la barra lateral del foro. Componente "tonto", puramente
// visual — la lista de canales vive en hooks/useForo.js (mock).
export default function ChannelItem({ channel, active, onClick, accent = HOLO_THEME.text }) {
  return (
    <div
      className={`channel-item${active ? " active" : ""}`}
      onClick={onClick}
      style={{ borderLeftColor: active ? accent : "transparent" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: active ? accent : HOLO_THEME.textDim, letterSpacing: ".05em", fontFamily: "'Inter',sans-serif" }}>
          {channel.name}
        </span>
        {channel.unread > 0 && (
          <span style={{ background: "#cc3344", color: "#fff", fontSize: 9, padding: "1px 5px", minWidth: 16, textAlign: "center", borderRadius: 8 }}>
            {channel.unread}
          </span>
        )}
      </div>
      <div style={{ fontSize: 10, color: "rgba(242,240,248,.28)", marginTop: 2, letterSpacing: ".03em", fontFamily: "'Inter',sans-serif" }}>{channel.desc}</div>
    </div>
  );
}
