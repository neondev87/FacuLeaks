"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/chat/EmptyStateBg.js — fondo decorativo de Mensajes
// sin chat abierto
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: dibuja el fondo grande detrás de la tarjeta "chat-landing"
// (ver app/chat/page.js) cuando no hay ninguna conversación abierta. Dos
// figuras, ancladas cada una a un costado, bien grandes:
//   - `.empty-fig-girl` — assets/shared/girl.png, la misma ilustración
//     estilo anime que usa la pantalla de login (components/auth/*).
//   - `.empty-fig-ascii` — assets/chat/chat-fig-ascii.png (2026-09-10,
//     reemplaza al ángel con la cruz que había antes): una figura
//     encapuchada armada con dígitos binarios ("la chica ascii"). Viene de
//     una foto que pasó Erick (`Desktop/derecha.jpg`) — se le sacó el alpha
//     por luminancia con PIL (negro del jpg → transparente, los unos/ceros
//     brillantes quedan opacos), mismo tratamiento que ya se usaba en las
//     otras figuras de esta pantalla.
// Ambas se funden hacia arriba con un `mask-image`.
//
// En celular ambas se esconden y `.chat-landing` usa en su lugar
// assets/chat/bg-celular.jpg de fondo completo (ver media query en
// chatStyles.js).
//
// El componente es puramente decorativo (`aria-hidden`, `pointer-events`
// desactivados en el CSS): NO tapa ni compite con la tarjeta de encima
// (mayor z-index, ver `.chat-landing-card` en chatStyles.js).
//
// CON QUÉ SE CONECTA: lo monta app/chat/page.js dentro de `.chat-landing`.
// El CSS de las dos capas está en app/chat/chatStyles.js (`.empty-bg`,
// `.empty-fig*`). Los PNG/JPG en sí viven en src/assets/ (shared/chat/
// backgrounds), no en public/ — se importan como módulo y no como URL
// estática, para poder organizarlos por carpeta.
// ════════════════════════════════════════════════════════════════════════
export default function EmptyStateBg() {
  return (
    <div className="empty-bg" aria-hidden="true">
      <div className="empty-fig empty-fig-girl" />
      <div className="empty-fig empty-fig-ascii" />
    </div>
  );
}
