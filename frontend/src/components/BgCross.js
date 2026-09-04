// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/BgCross.js — el arte de fondo sutil
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: pinta la imagen public/art/bg-cross.png fija arriba a la
// derecha, muy tenue (6% de opacidad), como textura de fondo. Es 100%
// decorativo, no tiene estado ni lógica.
//
// CON QUÉ SE CONECTA: nada — es una hoja suelta. Se usa en
// app/feed/page.js, app/chat/page.js, app/amigos/page.js y app/foro/page.js.
// ════════════════════════════════════════════════════════════════════════
export default function BgCross() {
  return (
    <div style={{
      position: "fixed",
      right: 0,
      top: 0,
      width: "40vw",
      maxWidth: 600,
      height: "100vh",

      backgroundImage: "url(/art/bg-cross.png)",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right center",
      backgroundSize: "contain",
      opacity: 0.06,
      pointerEvents: "none",
      zIndex: 1,
    }} />
  );
}