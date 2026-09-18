"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/chat/EmptyStateBg.js — fondo decorativo de Mensajes
// sin chat abierto
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: dibuja el fondo grande detrás de la tarjeta "chat-landing"
// (ver app/chat/page.js) cuando no hay ninguna conversación abierta. Dos
// figuras, ancladas cada una a un costado, mismo peso/opacidad ("balance
// parejo", 2026-09-17):
//   - `.empty-fig-angel` — assets/chat/chat-fig-angel.png: un ángel con
//     una cruz, estatua en foto halftone/punteada. Reemplaza a girl.png
//     (la ilustración anime que comparte /auth, ESA no se tocó). Mismo
//     tratamiento de alpha por luminancia que la otra figura.
//   - `.empty-fig-ascii` — assets/chat/chat-fig-ascii.png (2026-09-10):
//     una figura encapuchada armada con dígitos binarios ("la chica
//     ascii"). Viene de una foto que pasó Erick (`Desktop/derecha.jpg`) —
//     se le sacó el alpha por luminancia con PIL (negro del jpg →
//     transparente, los unos/ceros brillantes quedan opacos).
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
      <div className="empty-fig empty-fig-angel" />
      <div className="empty-fig empty-fig-ascii" />
    </div>
  );
}
