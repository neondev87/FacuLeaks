"use client";

import { API } from "@/lib/api";
import { HOLO_THEME } from "@/lib/theme";
import { escudoUrl } from "@/lib/facultades";

// MÓDULO: components/amigos/UserCard.js
// Fila de usuario reusada 4 veces en app/amigos/page.js (resultados de
// búsqueda, solicitudes recibidas, enviadas, amigos) — solo cambian los
// `actions` (botones) que le pasa cada sección. Componente "tonto", sin
// conexión a backend.
export default function UserCard({ user, actions }) {
  const avatarUrl = user.imagen
    ? (user.imagen.startsWith("http") ? user.imagen : `${API}${user.imagen}`)
    : null;
  const escudo = escudoUrl(user.facultad);
  return (
    <div className="user-card">
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            backgroundColor: "#1c1c24",
            backgroundImage: avatarUrl ? `url(${avatarUrl})` : "none",
            backgroundSize: "100% 100%", backgroundPosition: "center",
            border: `1px solid ${HOLO_THEME.hairline}`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 10, color: HOLO_THEME.textDim,
          }}>{!avatarUrl && "◈"}</div>
          {escudo && (
            <div style={{ position: "absolute", top: -1, left: -1, width: 12, height: 12, backgroundImage: `url(${escudo})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.7))" }} />
          )}
        </div>
        {/* minWidth:0 + ellipsis: sin esto, un nombre completo largo (viene
            de Google, sin tope de longitud — a diferencia del username, que
            sí tiene tope de 20 caracteres en hooks/useRegister.js) empuja el
            flex y puede tapar/desbordar los botones de ACEPTAR/✕ de al lado
            en un celular angosto (bug reportado 2026-09-17). */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, color: HOLO_THEME.text, fontFamily: "'Inter',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{user.username}</div>
          <div style={{ fontSize: 11, color: HOLO_THEME.textDim, fontFamily: "'Inter',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.nombre}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        {actions}
      </div>
    </div>
  );
}
