"use client";

import { cloneElement } from "react";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/perfil/SocialLinks.js — íconos de redes junto al nombre
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: de los links que la persona cargó en "Redes y links" (Editar
// perfil), filtra los que son de una red con ícono reconocido (Instagram,
// Discord, YouTube, Kick, Twitch, Facebook, Spotify — las que pidió Erick,
// 2026-09-11) y dibuja un ícono clickeable por cada una, en el header del
// perfil, al lado del nombre. Los links a otras plataformas (Twitter,
// Tumblr, GitHub, "otro") siguen guardándose y mostrándose como texto en
// "Información" (perfil público) — simplemente no tienen ícono acá.
// Solo formato PC: en celular no entra al lado del nombre, así que
// SocialLinks se esconde con CSS (.profile-social-icons, ver profileStyles.js
// / publicStyles.js) en vez de con JS.
//
// CON QUÉ SE CONECTA: `profile.links` (mismo array que llena LinkRow.js en
// el modal de editar). Lo dibujan app/perfil/page.js y app/perfil/[id]/page.js.
// ════════════════════════════════════════════════════════════════════════

// Un trazo simple por red — no son los logos oficiales pixel-perfect, son
// glifos reconocibles con el mismo estilo lineal que el resto de los íconos
// de la app (ver components/feed/ShareIcon.js, StarIcon.js).
const ICONS = {
  instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  discord: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5.5c-2.8.6-4.3 1.7-4.3 1.7C2.3 10 2 14 2.4 17.9c0 0 1.8 1.6 5.1 2.1l.9-1.6" />
      <path d="M16 5.5c2.8.6 4.3 1.7 4.3 1.7.9 2.8 1.2 6.8.8 10.7 0 0-1.8 1.6-5.1 2.1l-.9-1.6" />
      <ellipse cx="9" cy="13" rx="1.4" ry="1.6" fill="currentColor" stroke="none" />
      <ellipse cx="15" cy="13" rx="1.4" ry="1.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  youtube: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.3v5.4l4.8-2.7z" fill="currentColor" stroke="none" />
    </svg>
  ),
  kick: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8.5 7v10M8.5 12l4-5h3.2l-4.4 5 4.4 5h-3.2z" strokeLinejoin="round" />
    </svg>
  ),
  twitch: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3h16v10.5L16 17h-3.5L10 20H7v-3H4z" />
      <path d="M13 7.2v4M17 7.2v4" />
    </svg>
  ),
  facebook: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M14 8.2h-1.6c-1 0-1.4.5-1.4 1.5V11h3l-.4 2.6h-2.6V21" />
    </svg>
  ),
  spotify: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M7 10.2c3.6-1 8-.6 10 .7M7.6 13.5c3-.8 6.5-.5 8.4.6M8.3 16.5c2.4-.6 5-.4 6.6.5" />
    </svg>
  ),
};

// Un solo lugar para mapear la etiqueta guardada en el link (viene de
// components/perfil/edit/constants.js → PLATFORMS, tal cual la eligió el
// usuario en el <select>) al ícono — case-insensitive por las dudas.
const norm = s => (s || "").trim().toLowerCase();

// El backend (perfil.controller.js → linksValidos()) ya solo guarda links
// http(s), pero esto es defensa en profundidad por si hay links viejos
// guardados antes de ese fix — sin esto, un `url` tipo "javascript:..."
// se dibuja igual como `<a href>` y ejecuta con solo el click.
const ESQUEMA_SEGURO = /^https?:\/\//i;

// Saca el "@usuario" de una URL de Instagram (instagram.com/usuario/...)
// para mostrarlo al lado del ícono en la variante "expanded" — así se ve
// DE UNA a quién sigue, no solo un glifo suelto (2026-09-11, a pedido de
// Erick: "se ve muy feo y chiquito, nadie lo notará").
const igHandle = url => {
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean)[0];
    return seg ? decodeURIComponent(seg) : null;
  } catch {
    return null;
  }
};

// PROP `variant`:
//  - "compact" (default): solo íconos en fila, uso de siempre en el header
//    de PC (al lado del nombre).
//  - "expanded": íconos más grandes, en columna, con pill de fondo y el
//    @usuario de Instagram visible al lado — para cuando este bloque vive
//    solo al lado del avatar en celular (.profile-social-icons-side).
export default function SocialLinks({ links, className, color = "rgba(255,255,255,.4)", hoverColor = "#fff", variant = "compact" }) {
  const expanded = variant === "expanded";

  const items = (Array.isArray(links) ? links : [])
    .map(l => {
      const lbl = typeof l === "string" ? l : l?.label;
      const url = typeof l === "string" ? null : l?.url;
      const key = norm(lbl);
      const icon = ICONS[key];
      if (!icon || !url || !ESQUEMA_SEGURO.test(url)) return null;
      const handle = expanded && key === "instagram" ? igHandle(url) : null;
      return { key, icon, url, lbl, handle };
    })
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className={className} style={{ display: "flex", flexDirection: expanded ? "column" : "row", alignItems: expanded ? "stretch" : "center", gap: expanded ? 8 : 6 }}>
      {items.map(it => (
        <a key={it.key} href={it.url} target="_blank" rel="noopener noreferrer" title={it.lbl}
          style={{
            color, display: "flex", alignItems: "center", gap: expanded ? 8 : 0, transition: "all .15s",
            ...(expanded ? { padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)" } : {}),
          }}
          onMouseEnter={e => { e.currentTarget.style.color = hoverColor; if (expanded) e.currentTarget.style.borderColor = "rgba(255,255,255,.25)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = color; if (expanded) e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; }}
        >
          {expanded ? cloneElement(it.icon, { width: 20, height: 20 }) : it.icon}
          {it.handle && (
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, color: "rgba(255,255,255,.65)" }}>
              @{it.handle}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
