// ════════════════════════════════════════════════════════════════════════
// MÓDULO: lib/theme.js — tokens de diseño compartidos
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: junta en un solo lugar los valores visuales que ANTES estaban
// copiados y pegados en varios archivos — colores, fuentes, la textura de
// ruido del fondo, el estilo de scrollbar, y las animaciones @keyframes que
// se repetían. Por ejemplo: antes de este archivo, `@keyframes fadeIn`
// estaba definida 5 veces en el proyecto (¡con 2 versiones distintas!),
// `spin` 4 veces y `blink` 2 veces — repartidas en feedStyles.js,
// chatStyles.js, profileStyles.js y publicStyles.js.
//
// PARA QUÉ SIRVE:
//   1. Evita que cambiar un color o una animación signifique buscarla en
//      6 archivos distintos y rezar por no olvidarse ninguno.
//   2. Es la base pensada para la Fase 3 (rediseño visual) — cuando haya
//      que cambiar la paleta o las fuentes del feed/perfil/chat, se toca
//      ESTE archivo, no cada componente uno por uno.
//
// QUÉ TIENE:
//   - COLORS  → paleta base (fondo, texto, hairlines, semánticos).
//   - FONTS   → los nombres de font-family que usa cada zona de la app.
//   - FONT_IMPORT_MAIN / FONT_IMPORT_CHAT → los @import de Google Fonts,
//     antes duplicados con pequeñas diferencias entre feed/perfil/perfil
//     público (una tenía el peso 300, otra no — ya no puede pasar).
//   - NOISE_TEXTURE → el fondo con ruido (el `body::before` con el SVG de
//     textura) que usan feed, chat, perfil propio y perfil público —
//     estaba pegado idéntico, carácter por carácter, en los 4 archivos.
//   - SCROLLBAR_THIN → el estilo de scrollbar fino que comparten feed,
//     perfil propio y perfil público (chat tiene el suyo, es distinto
//     a propósito — más finito y con el track transparente).
//   - KF → cada animación @keyframes por separado, para que cada página
//     arme SOLO las que usa (no hace falta cargar las 8 en todos lados).
//
// CON QUÉ SE CONECTA: lo consumen app/feed/feedStyles.js,
// app/chat/chatStyles.js, app/perfil/profileStyles.js y
// app/perfil/[id]/publicStyles.js. Cualquier página/componente nuevo que
// necesite estos mismos valores debería importar de acá antes de
// re-escribirlos.
// ════════════════════════════════════════════════════════════════════════

export const COLORS = {
  bg:             "#000",
  bgCard:         "#050505",
  text:           "#e8e4d9",
  textDim:        "rgba(232,228,217,.5)",
  white:          "#ffffff",
  hairline:       "rgba(255,255,255,.08)",
  hairlineSoft:   "rgba(255,255,255,.04)",
  hairlineStrong: "rgba(255,255,255,.18)",
  danger:         "#cc3344",
  dangerSoft:     "rgba(255,80,80,.85)",
  success:        "#3ddc84",
  warning:        "#ff6600",
  spotifyGreen:   "#1db954",
};

// Nombres de font-family listos para usar en CSS o en `style={{ fontFamily }}`.
export const FONTS = {
  display:    "'Cinzel',serif",          // títulos de sección (feed, perfil)
  body:       "'Inter',sans-serif",      // texto de feed y perfil
  mono:       "'Space Mono',monospace",  // labels/botones de feed y perfil
  chatMono:   "'IBM Plex Mono',monospace",
  chatSans:   "'IBM Plex Sans',sans-serif",
  chatDisplay:"'DM Serif Display',serif",
};

// Superset de pesos que necesitan feed/perfil/perfil-público juntos — antes
// cada página pedía un subconjunto ligeramente distinto por copy-paste.
export const FONT_IMPORT_MAIN =
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&display=swap');";

export const FONT_IMPORT_CHAT =
  "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500&family=DM+Serif+Display:ital@0;1&display=swap');";

// Space Mono + Cinzel, sin Inter — la usan amigos y foro (feed/perfil llevan
// la superset de arriba porque además usan Inter para el cuerpo de texto).
export const FONT_IMPORT_MONO_DISPLAY =
  "@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Cinzel:wght@400;600;900&display=swap');";

// El fondo con ruido — idéntico en feed/chat/perfil/perfil-público.
export const NOISE_TEXTURE = `
      body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:.04; pointer-events:none; z-index:9998; }`;

// Scrollbar finito 4px — feed, perfil propio y perfil público. Chat usa el
// suyo propio (3px, track transparente) porque es visualmente distinto a propósito.
export const SCROLLBAR_THIN = `
      ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:#000 } ::-webkit-scrollbar-thumb { background:#222 }`;

// Ruido + líneas de escaneo (scanline) — variante más marcada (opacidad .05)
// que usan amigos y foro. Distinta de NOISE_TEXTURE (opacidad .04, sin
// scanline) a propósito, no es la misma textura.
export const NOISE_TEXTURE_SCANLINE = `
      body::before { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:.05; pointer-events:none; z-index:9998; }
      body::after { content:''; position:fixed; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.15) 2px,rgba(0,0,0,.15) 4px); pointer-events:none; z-index:9999; }`;

// Cada animación por separado — cada *Styles.js arma solo las que necesita.
export const KF = {
  fadeIn:  `@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`,
  // Versión sin desplazamiento (solo opacidad) — la usan chat y register
  // para animaciones cortas donde no se quiere el "slide". Mismo nombre de
  // keyframe (`fadeIn`) que la de arriba, pero nunca conviven en la misma
  // página, así que no hay colisión real.
  fadeInPlain: `@keyframes fadeIn { from{opacity:0} to{opacity:1} }`,
  fadeUp:  `@keyframes fadeUp { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }`,
  slideUp: `@keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`,
  spin:    `@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`,
  blink:   `@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`,
  pulse:   `@keyframes pulse { 0%,100%{opacity:.35} 50%{opacity:.55} }`,
  wave:    `@keyframes wave { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }`,
  // Barrido de brillo diagonal ("chrome aero") — usado en el recuadro de
  // perfil (avatar) del feed y del perfil propio (Fase 3). Es el único
  // efecto animado en cajas — se probó también un borde holográfico
  // (conic-gradient) en composer y posts, pero se sacó por pedido explícito
  // ("esa estela de neón no me gusta") — el aero se queda, pero solo en el
  // recuadro de perfil, no en tarjetas enteras.
  sheen:   `@keyframes sheen { 0%,100%{background-position:120% 0} 50%{background-position:-20% 100%} }`,
};

// ════════════════════════════════════════════════════════════════════════
// Paleta "Holographic" — Fase 3, dirección visual del Muro (fondo casi
// negro, sin cassette ni semitono — esas quedaron descartadas en la
// comparación de las 4 direcciones). Tokens propios (no tocan COLORS/FONTS
// de arriba) para no afectar chat/perfil, que siguen con la paleta anterior
// hasta que les toque su turno de Fase 3.
// ════════════════════════════════════════════════════════════════════════
export const FEED_HOLO = {
  bg:         "#0a0a0d",
  panel:      "#111117",
  text:       "#f2f0f8",
  textDim:    "#8a87a0",
  hairline:   "rgba(255,255,255,.12)",
  hairlineSoft: "rgba(255,255,255,.08)",
  star:       "#ffd23d",
  marker:     "#c0524a",
};
