"use client";

import { useState } from "react";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/perfil/FriendRequestButton.js — botón "agregar amigo"
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: botón de texto en el header del perfil ajeno, mismo estilo que
// el botón "ir a mi perfil" de al lado, con 4 estados según
// `estadoAmistad`/`esSolicitante` (mismo contrato que
// amigos.controller.js/buscarUsuarios y hooks/useAmigos.js):
//   - sin relación                  → "mandar solicitud de amistad", clickeable.
//   - PENDIENTE, la mandé yo        → "solicitud enviada", deshabilitado.
//   - PENDIENTE, me la mandó a mí   → "aceptar solicitud", clickeable.
//   - ACEPTADO                      → "ya son amigos", deshabilitado.
// Reemplaza a la v1 (ícono redondo solo, sin texto) a pedido de Erick,
// 2026-09-16 — ahora dice explícitamente qué hace. Para rechazar una
// solicitud recibida o eliminar una amistad existente sigue estando la
// página /amigos completa.
//
// CON QUÉ SE CONECTA: hooks/usePublicProfile.js (enviarSolicitud,
// aceptarSolicitud) → app/perfil/[id]/page.js.
// ════════════════════════════════════════════════════════════════════════
export default function FriendRequestButton({ estadoAmistad, esSolicitante, onEnviar, onAceptar }) {
  const [busy, setBusy] = useState(false);

  let label = "mandar solicitud de amistad", clickable = true, onClick = onEnviar;
  if (estadoAmistad === "ACEPTADO") {
    label = "ya son amigos"; clickable = false; onClick = null;
  } else if (estadoAmistad === "PENDIENTE" && esSolicitante) {
    label = "solicitud enviada"; clickable = false; onClick = null;
  } else if (estadoAmistad === "PENDIENTE" && !esSolicitante) {
    label = "aceptar solicitud"; clickable = true; onClick = onAceptar;
  }

  const handleClick = async () => {
    if (!clickable || busy || !onClick) return;
    setBusy(true);
    try { await onClick(); } finally { setBusy(false); }
  };

  return (
    <button onClick={handleClick} disabled={!clickable || busy}
      style={{
        background:"none", border:"1px solid rgba(255,255,255,.08)",
        color: clickable ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.2)",
        fontFamily:"'Inter',sans-serif", fontSize:11, padding:"6px 14px",
        cursor: clickable ? "pointer" : "default", transition:"all .2s", borderRadius:4,
        opacity: busy ? .6 : 1,
      }}
      onMouseEnter={e => { if (clickable) { e.currentTarget.style.borderColor="rgba(255,255,255,.25)"; e.currentTarget.style.color="#e8e4d9"; } }}
      onMouseLeave={e => { if (clickable) { e.currentTarget.style.borderColor="rgba(255,255,255,.08)"; e.currentTarget.style.color="rgba(255,255,255,.3)"; } }}>
      {label}
    </button>
  );
}
