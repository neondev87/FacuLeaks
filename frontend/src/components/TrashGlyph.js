// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/TrashGlyph.js — el ÚNICO ícono de papelera de la app
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: dibuja una papelera de línea, limpia y minimal. Es puro SVG,
// sin estado. Toma el color de `currentColor` (lo define quien lo usa) y el
// tamaño por `size`.
//
// PARA QUÉ SIRVE: unificar TODOS los botones de "eliminar" del proyecto en
// un solo dibujo — borrar un post (muro y perfil), borrar un comentario,
// borrar un mensaje de chat, borrar la foto de perfil o una foto de la
// galería. Si hay que cambiar el ícono de basura, se cambia acá y listo.
//
// CON QUÉ SE CONECTA: lo usan components/feed/TrashIcon.js (botón con
// animación del muro), components/PostCard.js (TrashBtn del perfil),
// components/feed/PostComments.js, components/PostCard.js (borrar
// comentario), components/chat/Bubble.js, components/AvatarMenu.js y
// components/PicturesGrid.js.
// ════════════════════════════════════════════════════════════════════════
export default function TrashGlyph({ size = 16, strokeWidth = 1.7, style }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", ...style }}
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1z" />
      <path d="M6 7l1 12.1A2 2 0 0 0 9 21h6a2 2 0 0 0 2-1.9L18 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
