// MÓDULO: app/chat/chatStyles.js
// CSS de la página de chat (burbujas, animaciones de escribiendo/grabando,
// scrollbar). Se inyecta con hooks/useInjectedStyles.js ("chat-styles", …)
// desde app/chat/page.js. Es puro texto CSS, no tiene lógica.
//
// Fase 3 (2026-09-05): pasa a la paleta "Holographic" (HOLO_THEME) y al
// trío de fuentes Cinzel/Inter/Space Mono de Muro/Perfil/Amigos/Foro —
// misma estructura visual que esas páginas (burbujas y composer
// redondeados). Antes usaba a propósito una familia tipográfica distinta
// (IBM Plex Mono/Sans + DM Serif Display) — ese acople quedó roto por
// pedido explícito de unificar TODA la app bajo un mismo lenguaje visual.
// El scrollbar finito de 3px con track transparente SÍ se mantiene propio
// de esta página (detalle menor, no forma parte de la paleta/tipografía).
//
// Sin BgCross ni NOISE_TEXTURE global a propósito: el fondo del chat es
// plano. El recuadro de "nueva conversación" (sin chat abierto) SÍ lleva un
// fondo decorativo propio — tratamiento "red-letter": columnas de texto
// serif (Reina-Valera 1909, palabras de Cristo en rojo) + las dos figuras
// al pie. Ese fondo lo dibuja components/chat/EmptyStateBg.js y su CSS son
// las clases .empty-bg / .bible-layer / .empty-fig* de acá abajo. (Reemplaza
// la idea previa del "video en ASCII", que quedó descartada.)
// 'EB Garamond' se importa solo acá porque es exclusiva de esa capa de
// texto; el resto de la app usa el trío Cinzel/Inter/Space Mono de theme.js.
import { FONT_IMPORT_MAIN, KF, HOLO_THEME } from "@/lib/theme";

// Acento gris-tinta de la barra lateral (dirección "Vitral editorial · Tinta").
// Es el único "color" de la barra: no compite con el rojo del fondo red-letter.
const TINTA = "#b8b3c2";

export const chatStyles = `
      ${FONT_IMPORT_MAIN}
      @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital@0;1&display=swap');
      ${KF.spin}
      @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
      ${KF.fadeUp}
      ${KF.blink}
      @keyframes flicker  { 0%,100%{opacity:1;transform:scaleY(1)} 33%{opacity:.92;transform:scaleY(.97) scaleX(1.02)} 66%{opacity:.96;transform:scaleY(1.02) scaleX(.98)} }
      ${KF.pulse}
      ${KF.wave}
      @keyframes micPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
      body { background:${HOLO_THEME.bg}; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:16px; overflow:hidden; }
      ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:999px} ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.28)}
      /* ── Barra lateral: dirección "Vitral editorial · Tinta" ──────────────
         Paleta sin color (gris tinta ${TINTA}), avatares cuadrados con inicial
         en Cinzel, un resplandor suave desde arriba y la fila activa marcada
         con una barra iluminada + lavado. El único color de la pantalla lo
         pone el fondo red-letter del lienzo; la barra no compite. */
      .chat-side { background:radial-gradient(120% 40% at 50% 0%, rgba(255,255,255,.05), transparent 70%), ${HOLO_THEME.panel}; }
      .conv-sec { font-family:'Cinzel',serif; font-size:11px; letter-spacing:.22em; color:rgba(236,234,240,.42); padding:13px 18px 5px; }
      .conv-sec--sm { padding:10px 14px 6px; font-size:10px; letter-spacing:.18em; }
      .conv-name { font-family:'Cinzel',serif; font-size:13.5px; letter-spacing:.015em; }
      .conv-half { flex:1; overflow-y:auto; min-height:0; padding:6px 0; }
      .conv-item { padding:12px 18px; cursor:pointer; border-left:3px solid transparent; transition:background .14s, border-color .14s; display:flex; gap:12px; align-items:center; }
      .conv-item:hover { background:rgba(255,255,255,.03); }
      .conv-item.active { background:linear-gradient(90deg, rgba(184,179,194,.11), transparent); border-left-color:${TINTA}; }
      .avatar { width:42px; height:42px; border-radius:7px; background:#17171b; border:1.5px solid rgba(184,179,194,.26); display:flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-size:15px; text-transform:uppercase; color:rgba(236,234,240,.8); flex-shrink:0; position:relative; }
      .avatar-sm { width:36px; height:36px; border-radius:6px; background:#17171b; border:1.5px solid rgba(184,179,194,.2); display:flex; align-items:center; justify-content:center; font-size:11px; color:${HOLO_THEME.textDim}; flex-shrink:0; font-family:'Space Mono',monospace; }
      .status-dot { position:absolute; bottom:1px; right:1px; width:11px; height:11px; border-radius:50%; border:2px solid ${HOLO_THEME.panel}; }
      .status-dot-hdr { position:absolute; bottom:1px; right:1px; width:12px; height:12px; border-radius:50%; border:2px solid ${HOLO_THEME.bg}; }
      .bubble-me { background:${HOLO_THEME.text}; border-radius:16px; box-shadow:0 2px 14px rgba(0,0,0,.45); overflow:hidden; animation:fadeUp .15s ease; position:relative; z-index:1; }
      .bubble-other { background:${HOLO_THEME.panel}; border:1px solid ${HOLO_THEME.hairlineSoft}; border-radius:16px; box-shadow:0 2px 14px rgba(0,0,0,.45); overflow:hidden; animation:fadeUp .15s ease; position:relative; z-index:1; }
      .bubble-text-me    { font-family:'Inter',sans-serif; font-size:16px; color:${HOLO_THEME.bg}; line-height:1.6; letter-spacing:.01em; }
      .bubble-text-other { font-family:'Inter',sans-serif; font-size:16px; color:${HOLO_THEME.text}; line-height:1.6; letter-spacing:.01em; }
      .bubble-time-me    { font-size:11px; color:rgba(10,10,13,.4); white-space:nowrap; flex-shrink:0; font-family:'Space Mono',monospace; letter-spacing:.05em; margin-top:auto; }
      .bubble-time-other { font-size:11px; color:rgba(242,240,248,.3); white-space:nowrap; flex-shrink:0; font-family:'Space Mono',monospace; letter-spacing:.05em; margin-top:auto; }
      .reply-bar-me    { padding:8px 14px 7px; background:rgba(10,10,13,.07); border-bottom:1px solid rgba(10,10,13,.07); display:flex; gap:8px; }
      .reply-bar-other { padding:8px 14px 7px; background:rgba(255,255,255,.05); border-bottom:1px solid ${HOLO_THEME.hairlineSoft}; display:flex; gap:8px; }
      .reply-btn { padding:3px 12px; background:rgba(255,255,255,.05); border-radius:999px; border:1px solid ${HOLO_THEME.hairlineSoft}; font-size:12px; font-family:'Space Mono',monospace; color:${HOLO_THEME.textDim}; cursor:pointer; display:inline-flex; gap:4px; align-items:center; animation:fadeIn .1s ease; letter-spacing:.06em; transition:all .15s; }
      .reply-btn:hover { background:rgba(255,255,255,.1); color:${HOLO_THEME.text}; }
      .chat-input { flex:1; background:transparent; border:none; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:15px; padding:13px 18px; outline:none; letter-spacing:.02em; }
      .chat-input::placeholder { color:rgba(242,240,248,.28); }
      .input-wrap { flex:1; display:flex; background:${HOLO_THEME.panel}; border-radius:26px; overflow:hidden; border:1px solid ${HOLO_THEME.hairlineSoft}; transition:border-color .2s; align-items:center; }
      .input-wrap:focus-within { border-color:${HOLO_THEME.hairline}; }
      .send-arrow { background:transparent; border:none; border-left:1px solid ${HOLO_THEME.hairlineSoft}; padding:0 18px; color:${HOLO_THEME.textDim}; font-size:19px; cursor:pointer; transition:color .2s; height:100%; }
      .send-arrow:hover { color:${HOLO_THEME.text}; }
      .send-arrow:disabled { opacity:.2; cursor:not-allowed; }
      .buscar-input { width:100%; box-sizing:border-box; background:${HOLO_THEME.panel}; border:1px solid ${HOLO_THEME.hairline}; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:14px; padding:10px 14px; outline:none; transition:border-color .2s; border-radius:20px; }
      .buscar-input:focus { border-color:rgba(255,255,255,.3); }
      .buscar-input::placeholder { color:rgba(242,240,248,.25); }
      .resultado-item { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; cursor:pointer; border-bottom:1px solid ${HOLO_THEME.hairlineSoft}; transition:background .12s; border-radius:8px; }
      .resultado-item:hover { background:rgba(255,255,255,.06); }
      .spinner { width:10px; height:10px; border:1px solid rgba(255,255,255,.15); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
      .date-pill { display:flex; align-items:center; gap:12px; margin:18px 0 16px; }
      .date-pill::before,.date-pill::after { content:''; flex:1; height:1px; background:${HOLO_THEME.hairlineSoft}; }
      .date-pill span { font-size:11px; font-family:'Space Mono',monospace; color:${HOLO_THEME.textDim}; background:${HOLO_THEME.panel}; padding:4px 14px; border-radius:999px; letter-spacing:.1em; }
      .mic-recording { animation:micPulse 1s ease-in-out infinite; }

      /* ── Fondo decorativo del recuadro "nueva conversación" (sin chat abierto) ──
         Lo monta components/chat/EmptyStateBg.js. Acomodo "anchas simétricas":
         texto red-letter al fondo + las dos figuras al pie. Las figuras son PNG
         RGBA ya teñidos del rojo del tema (alpha por luminancia — nada de blend
         mode, así no aparece el recuadro gris de antes). El buscador
         (.empty-search) va SIEMPRE por delante con z-index más alto. */
      .empty-bg { position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0; }
      .bible-layer { position:absolute; inset:0; padding:26px 30px; font-family:'EB Garamond',Georgia,'Times New Roman',serif; font-size:8.5px; line-height:1.5; text-align:justify; hyphens:auto; -webkit-hyphens:auto; column-count:5; column-gap:20px; color:rgba(255,244,240,.075); user-select:none; overflow:hidden; }
      .bible-layer p { margin:0 0 7px; }
      .bible-layer .rl-rojo { color:rgba(192,82,74,.46); }
      .empty-fig { position:absolute; bottom:0; background-repeat:no-repeat; background-size:contain; -webkit-mask-image:linear-gradient(to top,#000 66%,transparent 100%); mask-image:linear-gradient(to top,#000 66%,transparent 100%); }
      .empty-fig-l { left:-4%; width:45%; height:85%; opacity:.8; background-image:url('/art/chat-fig-izq.png'); background-position:bottom left; }
      .empty-fig-r { right:-2%; width:50%; height:93%; opacity:.95; background-image:url('/art/chat-fig-der.png'); background-position:bottom right; }
      .empty-search { position:relative; z-index:20; }
      @media (max-width:820px) { .bible-layer { column-count:3; } .empty-fig-l { width:52%; } .empty-fig-r { width:58%; } }
    `;
