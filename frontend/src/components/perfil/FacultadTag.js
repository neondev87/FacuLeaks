"use client";

import { escudoUrl, siglasFacultad, nombreFacultad } from "@/lib/facultades";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/perfil/FacultadTag.js — etiqueta "a qué facultad va"
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: una pill chiquita con el escudo + las siglas de la facultad
// (ej. "FCFM"), con el nombre completo como tooltip. Antes la facultad solo
// se veía como el escudito superpuesto en una esquina del avatar
// (AvatarMenu.js) — esto es la versión en TEXTO, legible, para el header
// del perfil (2026-09-11, a pedido de Erick). No pinta nada si la persona
// no eligió facultad (campo opcional en users.facultad).
//
// CON QUÉ SE CONECTA: lo dibujan app/perfil/page.js (perfil propio) y
// app/perfil/[id]/page.js (perfil público), los dos en PC y celular — es
// una pill chica que envuelve sola, no necesita media query propia.
//
// PROP `size="lg"`: versión agrandada para cuando esta pill vive sola al
// lado del avatar en celular (.profile-avatar-side) — ahí, chica, quedaba
// perdida y nadie la notaba (2026-09-11, a pedido de Erick). El uso normal
// en el header de PC sigue con el tamaño chico de siempre.
// ════════════════════════════════════════════════════════════════════════
export default function FacultadTag({ facultad, size = "sm" }) {
  const siglas = siglasFacultad(facultad);
  if (!siglas) return null;
  const url = escudoUrl(facultad);
  const lg = size === "lg";
  const iconSize = lg ? 22 : 16;

  return (
    <div title={nombreFacultad(facultad)} style={{
      display:"inline-flex", alignItems:"center", gap: lg ? 8 : 6, width:"fit-content",
      padding: lg ? (url ? "6px 16px 6px 6px" : "8px 16px") : (url ? "3px 10px 3px 4px" : "4px 10px"),
      borderRadius:999, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)",
    }}>
      {url && <img src={url} alt="" width={iconSize} height={iconSize} style={{ objectFit:"contain", borderRadius:"50%", flexShrink:0 }} />}
      <span style={{ fontFamily:"'Space Mono',monospace", fontSize: lg ? 14 : 11, letterSpacing:".04em", color:"rgba(255,255,255,.55)" }}>
        {siglas}
      </span>
    </div>
  );
}
