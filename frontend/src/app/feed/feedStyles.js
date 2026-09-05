// MÓDULO: app/feed/feedStyles.js
// CSS de la página de feed (animaciones, fondo, hairlines, fuentes de
// Google Fonts propias de esta página). Se inyecta con
// hooks/useInjectedStyles.js ("feed-styles", …) desde app/feed/page.js.
// Es puro texto CSS, no tiene lógica. Los valores compartidos con otras
// páginas (fuentes, animaciones, la paleta "Mezcla" de Fase 3) vienen de
// lib/theme.js — ver ese archivo si hay que cambiar alguno.
//
// Fase 3 (2026-09): el feed pasó de fondo negro plano a la dirección
// "Mezcla" — cassette (carrete, ámbar cálido) + grano de semitono + borde
// holográfico animado en el composer. Perfil y Chat siguen con la paleta
// vieja hasta que les toque su rediseño.
import { FONT_IMPORT_MAIN, SCROLLBAR_THIN, KF, FEED_MIX, HOLO_PROPERTY } from "@/lib/theme";

export const feedStyles = `
      ${FONT_IMPORT_MAIN}
      ${HOLO_PROPERTY}
      ${KF.fadeIn}
      ${KF.spin}
      ${KF.sheen}
      ${KF.reelSpin}
      ${KF.holoSpin}
      body {
        background: linear-gradient(180deg, ${FEED_MIX.bgTop}, ${FEED_MIX.bgBottom});
        color: ${FEED_MIX.text};
        font-family:'Inter',sans-serif; font-size:13px; overflow-x:hidden;
      }
      /* Grano de semitono (dirección Newsprint) sobre el fondo cassette */
      body::before {
        content:''; position:fixed; inset:0; pointer-events:none; z-index:9998;
        background-image: radial-gradient(rgba(255,255,255,.045) 1.1px, transparent 1.1px);
        background-size: 4.5px 4.5px;
      }
      ${SCROLLBAR_THIN}
      .feed-wrap { padding:68px 28px 48px; max-width:860px; margin:0 auto; animation:fadeIn .5s ease; }

      /* ── Tabs (RECIENTES/TRENDING/SIGUIENDO) ── */
      .feed-tab { cursor:pointer; transition:color .2s; color:${FEED_MIX.textDim}; font-weight:400; }
      .feed-tab.active { color:${FEED_MIX.text}; font-weight:500; }
      .feed-tab:hover { color:${FEED_MIX.text}; }

      /* ── Recuadro de usuario del composer — "chrome aero": vidrio con
         brillo diagonal que recorre el panel en loop. ── */
      .composer-avatar {
        position:relative; overflow:hidden; flex-shrink:0;
        background-color: #241a10;
        border:1px solid ${FEED_MIX.hairline};
      }
      .composer-avatar::after {
        content:''; position:absolute; inset:0;
        background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.35) 45%, transparent 60%);
        background-size:250% 250%;
        animation: sheen 5s ease-in-out infinite;
        pointer-events:none;
      }

      /* ── Carrete de cassette (decoración del composer) ── */
      .composer-reel {
        position:absolute; right:14px; top:14px; width:26px; height:26px; border-radius:50%;
        border:3px dashed rgba(243,230,200,.35); animation:reelSpin 6s linear infinite; pointer-events:none;
      }

      /* ── Panel con borde holográfico animado (composer + posts) ── */
      .holo-panel { position:relative; }
      .holo-panel::before {
        content:''; position:absolute; inset:0; padding:1.5px; border-radius:inherit;
        background:${FEED_MIX.holo};
        -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite:xor; mask-composite:exclude;
        animation:holoSpin 6s linear infinite; pointer-events:none;
      }

      .post-title-input { width:100%; background:transparent; border:none; outline:none; font-family:'Inter',sans-serif; font-size:14px; font-weight:500; color:rgba(243,230,200,.55); padding:4px 0; margin-bottom:6px; border-bottom:1px dashed ${FEED_MIX.dashed}; }
      .post-title-input::placeholder { color:rgba(243,230,200,.28); }
      .post-title-input:focus { color:${FEED_MIX.text}; border-bottom-color:rgba(255,207,159,.5); }
      .post-body-input { width:100%; background:transparent; border:none; outline:none; font-family:'Inter',sans-serif; font-size:13px; color:rgba(243,230,200,.45); padding:4px 0; margin-bottom:8px; resize:none; min-height:36px; }
      .post-body-input::placeholder { color:rgba(243,230,200,.28); }
      .post-body-input:focus { color:${FEED_MIX.text}; }
      .publish-btn { background:none; border:1px solid rgba(255,159,224,.4); color:${FEED_MIX.text}; font-family:'Space Mono',monospace; font-size:11px; padding:7px 18px; cursor:pointer; letter-spacing:.14em; border-radius:20px; transition:all .2s; }
      .publish-btn:hover { background:${FEED_MIX.sealGradient}; color:#1c1508; border-color:transparent; }
      .publish-btn:disabled { opacity:.3; cursor:not-allowed; }
      .spinner { width:14px; height:14px; border:1px solid rgba(255,255,255,.15); border-top-color:rgba(255,255,255,.5); border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
      .new-badge { background:rgba(255,255,255,.05); border:1px solid ${FEED_MIX.hairlineSoft}; color:${FEED_MIX.textDim}; font-family:'Inter',sans-serif; font-size:11px; padding:5px 16px; cursor:pointer; transition:all .2s; display:block; width:100%; text-align:center; margin-bottom:12px; }
      .new-badge:hover { background:rgba(255,255,255,.08); color:${FEED_MIX.text}; }
      .imagen-preview { position:relative; margin-bottom:10px; }
      .imagen-preview img { width:100%; max-height:200px; object-fit:contain; background:#100b06; border:1px solid ${FEED_MIX.hairlineSoft}; }
      .imagen-preview-remove { position:absolute; top:6px; right:6px; background:#100b06; border:1px solid ${FEED_MIX.hairline}; color:${FEED_MIX.textDim}; width:22px; height:22px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; }
    `;
