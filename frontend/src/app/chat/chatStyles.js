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
// Sin BgCross ni NOISE_TEXTURE a propósito (pedido explícito el mismo día):
// fondo plano, "limpio", porque el recuadro grande de "nueva conversación"
// va a llevar una animación más adelante (video en ASCII) y una textura de
// fondo encima hubiera competido con eso.
import { FONT_IMPORT_MAIN, KF, HOLO_THEME } from "@/lib/theme";

export const chatStyles = `
      ${FONT_IMPORT_MAIN}
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
      .conv-half { flex:1; overflow-y:auto; min-height:0; padding:6px 0; }
      .conv-item { padding:12px 18px; cursor:pointer; border-left:2px solid transparent; transition:all .12s; display:flex; gap:12px; align-items:center; }
      .conv-item:hover { background:rgba(255,255,255,.03); }
      .conv-item.active { background:rgba(255,255,255,.06); border-left-color:${HOLO_THEME.text}; }
      .avatar { width:42px; height:42px; border-radius:50%; background:#1c1c24; border:1.5px solid ${HOLO_THEME.hairline}; display:flex; align-items:center; justify-content:center; font-size:14px; color:${HOLO_THEME.textDim}; flex-shrink:0; position:relative; }
      .avatar-sm { width:36px; height:36px; border-radius:50%; background:#1c1c24; border:1.5px solid ${HOLO_THEME.hairlineSoft}; display:flex; align-items:center; justify-content:center; font-size:11px; color:${HOLO_THEME.textDim}; flex-shrink:0; font-family:'Space Mono',monospace; }
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
    `;
