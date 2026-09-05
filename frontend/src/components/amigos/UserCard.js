"use client";

import { API } from "@/lib/api";
import { HOLO_THEME } from "@/lib/theme";

// MÓDULO: components/amigos/UserCard.js
// Fila de usuario reusada 4 veces en app/amigos/page.js (resultados de
// búsqueda, solicitudes recibidas, enviadas, amigos) — solo cambian los
// `actions` (botones) que le pasa cada sección. Componente "tonto", sin
// conexión a backend.
export default function UserCard({ user, actions }) {
  const avatarUrl = user.imagen
    ? (user.imagen.startsWith("http") ? user.imagen : `${API}${user.imagen}`)
    : null;
  return (
    <div className="user-card">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          backgroundColor: "#1c1c24",
          backgroundImage: avatarUrl ? `url(${avatarUrl})` : "none",
          backgroundSize: "cover", backgroundPosition: "center",
          border: `1px solid ${HOLO_THEME.hairline}`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 10, color: HOLO_THEME.textDim, flexShrink: 0,
        }}>{!avatarUrl && "◈"}</div>
        <div>
          <div style={{ fontSize: 13, color: HOLO_THEME.text, fontFamily: "'Inter',sans-serif" }}>@{user.username}</div>
          <div style={{ fontSize: 11, color: HOLO_THEME.textDim, fontFamily: "'Inter',sans-serif" }}>{user.nombre}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {actions}
      </div>
    </div>
  );
}
