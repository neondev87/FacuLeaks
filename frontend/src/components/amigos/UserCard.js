"use client";

// MÓDULO: components/amigos/UserCard.js
// Fila de usuario reusada 4 veces en app/amigos/page.js (resultados de
// búsqueda, solicitudes recibidas, enviadas, amigos) — solo cambian los
// `actions` (botones) que le pasa cada sección. Componente "tonto", sin
// conexión a backend.
export default function UserCard({ user, actions, accent = "#ffffff" }) {
  const ac = accent;
  return (
    <div className="user-card">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, background: "#0a0a0a", border: `1px solid ${ac}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: `${ac}44`, flexShrink: 0 }}>◈</div>
        <div>
          <div style={{ fontSize: 13, color: "#e8e4d9", letterSpacing: ".04em" }}>@{user.username}</div>
          <div style={{ fontSize: 11, color: "#555" }}>{user.nombre}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {actions}
      </div>
    </div>
  );
}
