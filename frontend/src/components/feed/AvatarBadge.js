"use client";

import { HOLO_THEME } from "@/lib/theme";
import { avatarSrc } from "@/lib/api";

// MÓDULO: components/feed/AvatarBadge.js
// Avatar circular reutilizable para el composer y las publicaciones del
// Muro. Trae el slot del escudo de facultad en la esquina superior
// izquierda (prop `escudoUrl`, ver lib/facultades.js → escudoUrl()) — si el
// usuario no eligió facultad, `escudoUrl` viene null y no se dibuja nada.
// El `style` se mergea encima para que cada caller lo empuje a su propia
// esquina (ver feed/page.js y PostCard.js).
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
          position: "absolute", top: -size * 0.14, left: -size * 0.14,
          width: size * 0.32, height: size * 0.32,
          backgroundImage: `url(${escudoUrl})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,.75))", zIndex: 2,
        }} />
      )}
    </div>
  );
}
