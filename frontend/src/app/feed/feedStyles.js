// MÓDULO: app/feed/feedStyles.js
// CSS de la página de feed (animaciones, fondo, hairlines, fuentes de
// Google Fonts propias de esta página). Se inyecta con
// hooks/useInjectedStyles.js ("feed-styles", …) desde app/feed/page.js.
// Es puro texto CSS, no tiene lógica. Los valores compartidos con otras
// páginas (fuentes, animaciones, la paleta "Holographic" de Fase 3) vienen
// de lib/theme.js — ver ese archivo si hay que cambiar alguno.
//
// Fase 3 (2026-09): el feed pasó de fondo negro plano a la dirección
// "Holographic" — fondo casi negro, sin el cassette/semitono de las otras
// direcciones probadas. El borde iridiscente animado se probó en composer y
// posts pero se sacó de los dos ("mucha estela de neón") — el único efecto
// animado que quedó es el brillo "chrome aero" del recuadro de perfil
// (avatar). Perfil y Chat siguen con la paleta vieja hasta que les toque su
// rediseño.
import { FONT_IMPORT_MAIN, SCROLLBAR_THIN, KF, FEED_HOLO } from "@/lib/theme";

export const feedStyles = `
      ${FONT_IMPORT_MAIN}
      ${KF.fadeIn}
      ${KF.spin}
      ${KF.sheen}
      body {
        background: ${FEED_HOLO.bg};
        color: ${FEED_HOLO.text};
        font-family:'Inter',sans-serif; font-size:13px; overflow-x:hidden;
      }
      ${SCROLLBAR_THIN}
      .feed-wrap { padding:68px 28px 48px; max-width:860px; margin:0 auto; animation:fadeIn .5s ease; }

      /* ── Tabs (RECIENTES/TRENDING/SIGUIENDO) ── */
      .feed-tab { cursor:pointer; transition:color .2s; color:${FEED_HOLO.textDim}; font-weight:400; }
      .feed-tab.active { color:${FEED_HOLO.text}; font-weight:500; }
      .feed-tab:hover { color:${FEED_HOLO.text}; }

      /* ── Recuadro de usuario del composer — "chrome aero": vidrio con
         brillo diagonal que recorre el panel en loop. ── */
      .composer-avatar {
        position:relative; overflow:hidden; flex-shrink:0; border-radius:50%;
        background-color: #1c1c24;
        border:1px solid ${FEED_HOLO.hairline};
      }
      .composer-avatar::after {
        content:''; position:absolute; inset:0;
        background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.35) 45%, transparent 60%);
        background-size:250% 250%;
        animation: sheen 5s ease-in-out infinite;
        pointer-events:none;
      }

      .post-title-input { width:100%; background:transparent; border:none; outline:none; font-family:'Inter',sans-serif; font-size:14px; font-weight:500; color:rgba(242,240,248,.55); padding:4px 0; margin-bottom:6px; border-bottom:1px solid ${FEED_HOLO.hairlineSoft}; }
      .post-title-input::placeholder { color:rgba(242,240,248,.28); }
      .post-title-input:focus { color:${FEED_HOLO.text}; border-bottom-color:${FEED_HOLO.hairline}; }
      .post-body-input { width:100%; background:transparent; border:none; outline:none; font-family:'Inter',sans-serif; font-size:13px; color:rgba(242,240,248,.45); padding:4px 0; margin-bottom:8px; resize:none; min-height:36px; }
      .post-body-input::placeholder { color:rgba(242,240,248,.28); }
      .post-body-input:focus { color:${FEED_HOLO.text}; }
      .publish-btn { background:${FEED_HOLO.text}; border:none; color:${FEED_HOLO.bg}; font-family:'Space Mono',monospace; font-weight:700; font-size:11px; padding:8px 18px; cursor:pointer; letter-spacing:.14em; border-radius:20px; transition:opacity .2s; }
      .publish-btn:hover { opacity:.85; }
      .publish-btn:disabled { opacity:.25; cursor:not-allowed; background:${FEED_HOLO.textDim}; }
      .spinner { width:14px; height:14px; border:1px solid rgba(255,255,255,.15); border-top-color:rgba(255,255,255,.5); border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
      .new-badge { background:rgba(255,255,255,.05); border:1px solid ${FEED_HOLO.hairlineSoft}; color:${FEED_HOLO.textDim}; font-family:'Inter',sans-serif; font-size:11px; padding:5px 16px; cursor:pointer; transition:all .2s; display:block; width:100%; text-align:center; margin-bottom:12px; }
      .new-badge:hover { background:rgba(255,255,255,.08); color:${FEED_HOLO.text}; }
      .imagen-preview { position:relative; margin-bottom:10px; }
      .imagen-preview img { width:100%; max-height:200px; object-fit:contain; background:#0a0a0d; border:1px solid ${FEED_HOLO.hairlineSoft}; }
      .imagen-preview-remove { position:absolute; top:6px; right:6px; background:#0a0a0d; border:1px solid ${FEED_HOLO.hairline}; color:${FEED_HOLO.textDim}; width:22px; height:22px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; }
    `;
