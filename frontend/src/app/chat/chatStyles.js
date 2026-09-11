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
// plano. "Mensajes" sin chat abierto (2026-09-10, reemplaza el tratamiento
// "red-letter" bíblico anterior) es una tarjeta centrada — .chat-landing /
// .chat-landing-card / .chat-landing-lists más abajo — flotando sobre un
// fondo rojo (gradiente sobre HOLO_THEME.marker) con 2 figuras grandes
// (.empty-bg / .empty-fig*, las dibuja
// components/chat/EmptyStateBg.js).
import { FONT_IMPORT_MAIN, KF, HOLO_THEME } from "@/lib/theme";
import girlImg from "@/assets/shared/girl.png";
import chatFigAscii from "@/assets/chat/chat-fig-ascii.png";
import bgCelular from "@/assets/chat/bg-celular.jpg";

// Acento gris-tinta de la barra lateral (dirección "Vitral editorial · Tinta").
// Es el único "color" de la barra.
const TINTA = "#b8b3c2";

export const chatStyles = `
      ${FONT_IMPORT_MAIN}
      ${KF.spin}
      @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
      ${KF.fadeUp}
      ${KF.blink}
      @keyframes flicker  { 0%,100%{opacity:1;transform:scaleY(1)} 33%{opacity:.92;transform:scaleY(.97) scaleX(1.02)} 66%{opacity:.96;transform:scaleY(1.02) scaleX(.98)} }
      ${KF.pulse}
      ${KF.wave}
      body { background:${HOLO_THEME.bg}; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:16px; overflow:hidden; }
      ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:999px} ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.28)}
      /* ── Barra lateral: dirección "Vitral editorial · Tinta" ──────────────
         Paleta sin color (gris tinta ${TINTA}), avatares cuadrados con inicial
         en Cinzel, un resplandor suave desde arriba y la fila activa marcada
         con una barra iluminada + lavado. El único color de la pantalla lo
         pone el fondo red-letter del lienzo; la barra no compite. */
      .chat-side { background:radial-gradient(160% 46% at 50% -6%, rgba(184,179,194,.12), transparent 68%), #0c0c0e; width:300px; flex-shrink:0; display:flex; flex-direction:column; border-right:1px solid ${HOLO_THEME.hairlineSoft}; }
      .chat-side__hdr { position:relative; }
      .chat-side__hdr::after { content:''; position:absolute; left:22px; right:22px; bottom:0; height:1px; background:linear-gradient(90deg, rgba(184,179,194,.35), rgba(184,179,194,.04)); }
      .side-title { font-family:'Cinzel',serif; font-size:21px; color:${HOLO_THEME.text}; letter-spacing:.06em; }
      .side-kicker { font-family:'Space Mono',monospace; font-size:9px; color:rgba(184,179,194,.4); letter-spacing:.24em; margin-top:5px; }
      .conv-sec { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.3em; color:${TINTA}; opacity:.72; padding:16px 18px 8px; }
      .conv-sec--sm { padding:11px 14px 7px; font-size:10px; letter-spacing:.22em; }
      .conv-name { font-family:'Cinzel',serif; font-size:14px; letter-spacing:.02em; }
      .conv-half { flex:1; overflow-y:auto; min-height:0; padding:4px 0 8px; }
      .conv-item { padding:11px 18px; cursor:pointer; border-left:3px solid transparent; transition:background .16s, border-color .16s; display:flex; gap:12px; align-items:center; }
      .conv-item:hover { background:rgba(184,179,194,.04); }
      .conv-item.active { background:linear-gradient(90deg, rgba(184,179,194,.18), rgba(184,179,194,.03) 55%, transparent); border-left-color:${TINTA}; }
      .conv-item.active .conv-name { color:#fff; }
      .avatar { width:42px; height:42px; border-radius:6px; background:#191920; border:1.5px solid rgba(184,179,194,.34); display:flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-size:16px; text-transform:uppercase; color:rgba(238,235,242,.82); flex-shrink:0; position:relative; box-shadow:inset 0 1px 0 rgba(255,255,255,.04); }
      .conv-item.active .avatar { border-color:rgba(184,179,194,.6); }
      .avatar-sm { width:36px; height:36px; border-radius:6px; background:#191920; border:1.5px solid rgba(184,179,194,.24); display:flex; align-items:center; justify-content:center; font-size:11px; color:${HOLO_THEME.textDim}; flex-shrink:0; font-family:'Cinzel',serif; text-transform:uppercase; }
      .status-dot { position:absolute; bottom:1px; right:1px; width:11px; height:11px; border-radius:50%; border:2px solid #0c0c0e; }
      .status-dot-hdr { position:absolute; bottom:1px; right:1px; width:12px; height:12px; border-radius:50%; border:2px solid ${HOLO_THEME.bg}; }
      /* Cabecera del chat: avatar + nombre son un botón que lleva a
         /perfil/<id> de la persona con la que estás hablando. */
      .chat-hdr-id { display:flex; align-items:center; gap:16px; flex:1; min-width:0; background:none; border:0; padding:6px 8px; margin:-6px -8px; border-radius:10px; cursor:pointer; text-align:left; font:inherit; color:inherit; transition:background .16s; }
      .chat-hdr-id:hover { background:rgba(184,179,194,.06); }
      .chat-hdr-name { transition:color .16s; }
      .chat-hdr-id:hover .chat-hdr-name { color:#fff; text-decoration:underline; text-underline-offset:3px; text-decoration-thickness:1px; text-decoration-color:rgba(184,179,194,.5); }
      .chat-hdr-id:focus-visible { outline:1px solid rgba(184,179,194,.5); outline-offset:2px; }
      .chat-back { display:none; flex-shrink:0; width:32px; height:32px; align-items:center; justify-content:center; background:none; border:0; border-radius:50%; color:${HOLO_THEME.textDim}; cursor:pointer; transition:background .14s, color .14s; }
      .chat-back:hover { background:rgba(184,179,194,.08); color:#fff; }
      /* Burbujas — rediseño de la conversación activa (paleta Tinta): propia en
         marfil frío, ajena en panel; esquina "doblada" del lado del emisor;
         entrada con un rise corto y tranquilo. */
      .bubble-me { background:#ecebef; border-radius:16px 16px 5px 16px; box-shadow:0 1px 10px rgba(0,0,0,.4); overflow:hidden; animation:msgRise .24s cubic-bezier(.2,.7,.3,1); position:relative; z-index:1; }
      .bubble-other { background:#16161b; border:1px solid ${HOLO_THEME.hairlineSoft}; border-radius:16px 16px 16px 5px; box-shadow:0 1px 10px rgba(0,0,0,.4); overflow:hidden; animation:msgRise .24s cubic-bezier(.2,.7,.3,1); position:relative; z-index:1; }
      @keyframes msgRise { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
      .bubble-text-me    { font-family:'Inter',sans-serif; font-size:16px; color:#151318; line-height:1.6; letter-spacing:.01em; }
      .bubble-text-other { font-family:'Inter',sans-serif; font-size:16px; color:${HOLO_THEME.text}; line-height:1.6; letter-spacing:.01em; }
      .bubble-time-me    { font-size:11px; color:rgba(10,10,13,.4); white-space:nowrap; flex-shrink:0; font-family:'Space Mono',monospace; letter-spacing:.05em; margin-top:auto; }
      .bubble-time-other { font-size:11px; color:rgba(242,240,248,.3); white-space:nowrap; flex-shrink:0; font-family:'Space Mono',monospace; letter-spacing:.05em; margin-top:auto; }
      .reply-bar-me    { padding:8px 14px 7px; background:rgba(10,10,13,.07); border-bottom:1px solid rgba(10,10,13,.07); display:flex; gap:8px; }
      .reply-bar-other { padding:8px 14px 7px; background:rgba(255,255,255,.05); border-bottom:1px solid ${HOLO_THEME.hairlineSoft}; display:flex; gap:8px; }
      /* Acciones al pasar el mouse por un mensaje (responder / borrar) —
         íconos que aparecen con un fundido corto, no un botón de texto. */
      .bubble-actions { display:flex; gap:2px; margin-bottom:3px; opacity:0; transform:translateY(2px); transition:opacity .16s, transform .16s; }
      .bubble-wrap:hover .bubble-actions { opacity:1; transform:none; }
      .bubble-act { width:26px; height:26px; border-radius:7px; display:flex; align-items:center; justify-content:center; color:${HOLO_THEME.textDim}; background:none; border:0; cursor:pointer; padding:0; transition:color .14s, background .14s, transform .12s; }
      .bubble-act:hover { background:rgba(255,255,255,.06); color:${HOLO_THEME.text}; }
      .bubble-act:active { transform:scale(.86); }
      .bubble-act.del:hover { color:rgba(255,80,80,.9); }
      .chat-input { flex:1; background:transparent; border:none; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:15px; padding:12px 8px 12px 16px; outline:none; letter-spacing:.02em; }
      .chat-input::placeholder { color:rgba(242,240,248,.28); }
      .input-wrap { flex:1; display:flex; background:${HOLO_THEME.panel}; border-radius:24px; overflow:hidden; border:1px solid ${HOLO_THEME.hairlineSoft}; transition:border-color .2s; align-items:center; }
      .input-wrap:focus-within { border-color:${HOLO_THEME.hairline}; }

      /* ── Composer del chat activo (rediseño) ──────────────────────────────
         Iconos nuevos (adjuntar / mic) + envío como avión de papel, y el
         estado de "grabando" sin la barra verde de ondas: punto latiendo
         lento, cronómetro monoespaciado, una onda continua que se desplaza
         suave y "deslizá para cancelar". Todo con transiciones cortas. */
      .composer-bar { padding:12px 18px 16px; background:${HOLO_THEME.bg}; border-top:1px solid ${HOLO_THEME.hairlineSoft}; display:flex; gap:5px; align-items:center; position:relative; }
      .cx-btn { width:36px; height:36px; border-radius:50%; flex:none; display:flex; align-items:center; justify-content:center; color:${HOLO_THEME.textDim}; background:none; border:0; cursor:pointer; transition:color .15s, background .15s, transform .12s; }
      .cx-btn:hover:not(:disabled) { color:${HOLO_THEME.text}; background:rgba(255,255,255,.05); }
      .cx-btn:active:not(:disabled) { transform:scale(.9); }
      .cx-btn:disabled { opacity:.3; cursor:not-allowed; }
      .send-plane { flex:none; width:32px; height:32px; margin:3px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:transparent; color:${HOLO_THEME.textDim}; border:0; cursor:pointer; transition:color .18s, background .18s, transform .12s; }
      .send-plane svg { transform:translateX(1px); }
      .send-plane:not(:disabled) { background:${TINTA}; color:#151318; }
      .send-plane:not(:disabled):hover { background:#c6c1d2; }
      .send-plane:not(:disabled):active { transform:scale(.9); }
      .send-plane:disabled { opacity:.35; cursor:not-allowed; }
      .cx-rec { flex:1; display:flex; align-items:center; gap:11px; background:${HOLO_THEME.panel}; border:1px solid ${HOLO_THEME.hairline}; border-radius:24px; padding:8px 10px 8px 14px; animation:msgRise .22s ease; cursor:grab; touch-action:none; user-select:none; will-change:transform; transition:transform .34s cubic-bezier(.22,1,.36,1), border-color .18s ease, background .18s ease; }
      .cx-rec:active { cursor:grabbing; }
      .cx-rec--armed { border-color:rgba(255,90,90,.55); background:rgba(255,90,90,.06); }
      .cx-rec__dot { width:9px; height:9px; border-radius:50%; background:${TINTA}; flex:none; animation:recPulse 1.6s ease-in-out infinite; }
      .cx-rec--armed .cx-rec__dot { background:rgba(255,90,90,.95); }
      .cx-rec__t { font-family:'Space Mono',monospace; font-size:12px; color:${HOLO_THEME.text}; letter-spacing:.05em; flex:none; font-variant-numeric:tabular-nums; }
      .cx-rec__wave { flex:1; height:26px; overflow:hidden; position:relative; color:${TINTA}; -webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent); mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent); }
      .cx-rec--armed .cx-rec__wave { color:rgba(255,90,90,.85); }
      .cx-rec__wave svg { position:absolute; left:0; top:0; height:100%; width:200%; will-change:transform; animation:recDrift 3.4s linear infinite; }
      .cx-rec__cancel { display:flex; align-items:center; gap:6px; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.12em; color:${HOLO_THEME.textDim}; text-transform:uppercase; flex:none; background:none; border:0; cursor:pointer; will-change:transform,opacity; animation:recNudge 2.4s ease-in-out infinite; }
      .cx-rec--armed .cx-rec__cancel { color:rgba(255,110,110,.95); animation:none; }
      .cx-rec__cancel svg { width:11px; height:11px; }
      .cx-rec__cancel:hover { color:${HOLO_THEME.text}; }
      .cx-rec__send { width:36px; height:36px; border-radius:50%; flex:none; display:flex; align-items:center; justify-content:center; background:${TINTA}; color:#151318; border:0; cursor:pointer; transition:transform .12s; }
      .cx-rec__send:active { transform:scale(.9); }
      @keyframes recPulse { 0%,100% { opacity:.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.22); } }
      @keyframes recDrift { from { transform:translateX(0); } to { transform:translateX(-50%); } }
      @keyframes recNudge { 0%,100% { opacity:.45; transform:translateX(0); } 50% { opacity:.9; transform:translateX(-4px); } }
      .typing-dots { display:inline-flex; gap:4px; }
      .typing-dots i { width:5px; height:5px; border-radius:50%; background:${HOLO_THEME.textDim}; animation:typingBreathe 1.5s ease-in-out infinite; }
      .typing-dots i:nth-child(2) { animation-delay:.22s; }
      .typing-dots i:nth-child(3) { animation-delay:.44s; }
      @keyframes typingBreathe { 0%,100% { opacity:.22; } 50% { opacity:.9; } }
      @media (prefers-reduced-motion:reduce) { .cx-rec__wave svg, .cx-rec__cancel, .cx-rec__dot, .typing-dots i { animation:none; } }
      .buscar-input { width:100%; box-sizing:border-box; background:${HOLO_THEME.panel}; border:1px solid ${HOLO_THEME.hairline}; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:14px; padding:10px 14px; outline:none; transition:border-color .2s; border-radius:20px; }
      .buscar-input:focus { border-color:rgba(255,255,255,.3); }
      .buscar-input::placeholder { color:rgba(242,240,248,.25); }
      .resultado-item { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; cursor:pointer; border-bottom:1px solid ${HOLO_THEME.hairlineSoft}; transition:background .12s; border-radius:8px; }
      .resultado-item:hover { background:rgba(255,255,255,.06); }
      .spinner { width:10px; height:10px; border:1px solid rgba(255,255,255,.15); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
      .date-pill { display:flex; align-items:center; gap:12px; margin:18px 0 16px; }
      .date-pill::before,.date-pill::after { content:''; flex:1; height:1px; background:${HOLO_THEME.hairlineSoft}; }
      .date-pill span { font-size:11px; font-family:'Space Mono',monospace; color:${HOLO_THEME.textDim}; background:${HOLO_THEME.panel}; padding:4px 14px; border-radius:999px; letter-spacing:.1em; }

      /* ── "Mensajes" sin chat abierto ──────────────────────────────────
         .chat-landing = toda la pantalla (fondo + tarjeta centrada).
         .empty-bg / .empty-fig* = las 2 figuras grandes de fondo, las
         dibuja components/chat/EmptyStateBg.js. Son PNG RGBA ya teñidos
         del rojo del tema (alpha por luminancia, sin blend mode). Se
         funden hacia arriba con un mask-image. .chat-landing-card flota
         encima (mayor z-index) con el título, el buscador y las listas.
         En celular (media query más abajo) se reemplaza por
         assets/chat/bg-celular.jpg estirada a pantalla completa. */
      .chat-landing { flex:1; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; padding:24px; background:radial-gradient(130% 90% at 50% 100%, rgba(192,82,74,.4), transparent 65%), linear-gradient(180deg, #2a0a0c, #1a0506); }
      .empty-bg { position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0; }
      .empty-fig { position:absolute; bottom:0; background-repeat:no-repeat; background-size:contain; -webkit-mask-image:linear-gradient(to top,#000 66%,transparent 100%); mask-image:linear-gradient(to top,#000 66%,transparent 100%); }
      .empty-fig-girl { left:-2%; width:64%; height:100%; opacity:.85; background-image:url(${girlImg.src}); background-position:bottom left; }
      .empty-fig-ascii { right:-2%; width:62%; height:100%; opacity:.95; z-index:1; background-image:url(${chatFigAscii.src}); background-position:bottom right; }

      .chat-landing-card { position:relative; z-index:5; width:100%; max-width:560px; height:min(660px, 84vh); display:flex; flex-direction:column; background:rgba(12,12,14,.06); border:1px solid ${HOLO_THEME.hairlineSoft}; border-radius:18px; backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,.5); }
      /* Con la tarjeta casi transparente el texto necesita más contraste
         contra la imagen de fondo: blanco puro + sombra + un toque de peso. */
      .chat-landing-card .side-title { color:#fff; text-shadow:0 1px 8px rgba(0,0,0,.7); }
      .chat-landing-card .side-kicker { color:rgba(255,255,255,.7); text-shadow:0 1px 6px rgba(0,0,0,.7); }
      .chat-landing-card .conv-sec { color:#fff; opacity:.95; text-shadow:0 1px 6px rgba(0,0,0,.7); }
      .chat-landing-card .conv-name { color:#fff !important; font-weight:600; text-shadow:0 1px 6px rgba(0,0,0,.7); }
      .empty-search { position:relative; z-index:20; padding:0 24px 16px; }
      .chat-landing-lists { flex:1; display:flex; flex-direction:column; min-height:0; }

      @media (max-width:820px) {
        .empty-fig-girl { width:80%; }
        .empty-fig-ascii { width:76%; }
      }
      @media (max-width:600px) {
        .chat-landing { padding:14px; background-image:url(${bgCelular.src}); background-size:cover; background-position:center; }
        .chat-landing-card { height:min(660px, 90vh); }
        /* En celular el fondo ya es una imagen completa (arriba) — las 2
           figuras recortadas quedan de más y se esconden. */
        .empty-fig-girl, .empty-fig-ascii { display:none; }
      }

      /* ── Celular: con una conversación abierta, la lista angosta (.chat-side,
         solo existe en ese estado — ver chat/page.js) no entra al lado de la
         conversación, así que se esconde; la flechita (.chat-back) vuelve a
         mostrarla. Sin conversación abierta no hay "lista angosta" que
         esconder — .chat-landing ya es una sola columna centrada. ── */
      @media (max-width:760px) {
        .chat-shell--open .chat-side { display:none; }
        .chat-back { display:flex; }
      }
    `;
