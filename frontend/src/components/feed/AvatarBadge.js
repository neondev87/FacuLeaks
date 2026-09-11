"use client";

import { HOLO_THEME } from "@/lib/theme";
import { avatarSrc } from "@/lib/api";

// MÓDULO: components/feed/AvatarBadge.js
// Avatar circular reutilizable para el composer y las publicaciones del
// Muro. Trae preparado el slot del escudo de facultad en la esquina
// superior izquierda (prop `escudoUrl`) — hoy no hay universidad/facultad
// configurable todavía, así que ese slot siempre viene vacío y solo se ve
// el avatar (agrandado). El `style` se mergea encima para que cada caller
// lo empuje a su propia esquina (ver feed/page.js y PostCard.js).
export default function AvatarBadge({ imagen, size = 48, escudoUrl = null, onClick, glyph = "◈", style }) {
  const bg = avatarSrc(imagen);

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative", flexShrink: 0, width: size, height: size,
        borderRadius: "50%", backgroundColor: "#1c1c24",
        backgroundImage: bg ? `url(${bg})` : "none", backgroundSize: "100% 100%", backgroundPosition: "center",
        border: `1px solid ${HOLO_THEME.hairline}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.3, color: HOLO_THEME.textDim,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {!bg && glyph}
      {escudoUrl && (
        <div style={{
          position: "absolute", top: -size * 0.1, left: -size * 0.1,
          width: size * 0.42, height: size * 0.42, borderRadius: "50%",
          backgroundImage: `url(${escudoUrl})`, backgroundSize: "cover", backgroundPosition: "center",
          border: `2px solid ${HOLO_THEME.panel}`,
        }} />
      )}
    </div>
  );
}
