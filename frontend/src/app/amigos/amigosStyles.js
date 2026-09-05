// MÓDULO: app/amigos/amigosStyles.js
// CSS de la página de amigos. Se inyecta con hooks/useInjectedStyles.js
// ("amigos-styles", …) desde app/amigos/page.js.
//
// Fase 3 (2026-09-05): pasa a la paleta "Holographic" (HOLO_THEME) y al
// trío de fuentes Cinzel/Inter/Space Mono de Muro y Perfil — misma
// estructura visual que esas dos páginas (tarjetas redondeadas, botones
// tipo pill). Antes compartía paleta/ruido con Foro (COLORS +
// NOISE_TEXTURE_SCANLINE, esquinas cuadradas) — ese acople queda roto a
// propósito: cada página usa ahora los tokens que le tocan en su turno de
// Fase 3, foro todavía no tuvo el suyo.
import { FONT_IMPORT_MAIN, NOISE_TEXTURE, SCROLLBAR_THIN, KF, HOLO_THEME } from "@/lib/theme";

export const amigosStyles = `
      ${FONT_IMPORT_MAIN}
      ${KF.fadeIn}
      ${KF.spin}
      body { background:${HOLO_THEME.bg}; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:13px; overflow-x:hidden; }
      ${NOISE_TEXTURE}
      ${SCROLLBAR_THIN}

      .page-wrap {
        padding: 68px 28px 48px;
        max-width: 900px;
        margin: 0 auto;
        animation: fadeIn .5s ease;
      }

      .search-input {
        width: 100%;
        background: ${HOLO_THEME.panel};
        border: 1px solid ${HOLO_THEME.hairlineSoft};
        color: ${HOLO_THEME.text};
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        padding: 12px 16px;
        outline: none;
        border-radius: 20px;
        transition: border-color .2s;
      }
      .search-input:focus { border-color: ${HOLO_THEME.hairline}; }
      .search-input::placeholder { color: rgba(242,240,248,.28); }

      .user-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border: 1px solid ${HOLO_THEME.hairlineSoft};
        border-radius: 10px;
        background: ${HOLO_THEME.panel};
        margin-bottom: 8px;
        transition: border-color .2s;
      }
      .user-card:hover { border-color: ${HOLO_THEME.hairline}; }

      .btn-action {
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        letter-spacing: .12em;
        padding: 6px 14px;
        cursor: pointer;
        transition: all .2s;
        border: 1px solid;
        background: transparent;
        border-radius: 20px;
      }
      .btn-add      { color: ${HOLO_THEME.textDim};  border-color: ${HOLO_THEME.hairline};  }
      .btn-add:hover{ color: #fff; border-color: rgba(255,255,255,.5); background: rgba(255,255,255,.05); }
      .btn-accept   { color: rgba(100,220,120,.8);  border-color: rgba(100,220,120,.3);  }
      .btn-accept:hover { color: #fff; border-color: rgba(100,220,120,.7); background: rgba(100,220,120,.08); }
      .btn-reject   { color: rgba(220,80,80,.7);    border-color: rgba(220,80,80,.2);    }
      .btn-reject:hover { color: #fff; border-color: rgba(220,80,80,.5); background: rgba(220,80,80,.08); }
      .btn-remove   { color: ${HOLO_THEME.textDim};  border-color: ${HOLO_THEME.hairlineSoft}; }
      .btn-remove:hover { color: rgba(220,80,80,.8); border-color: rgba(220,80,80,.3); }

      .section-header {
        font-family: 'Cinzel', serif;
        font-size: 14px;
        letter-spacing: .2em;
        color: ${HOLO_THEME.text};
        margin-bottom: 16px;
        padding-bottom: 10px;
        border-bottom: 1px solid ${HOLO_THEME.hairlineSoft};
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .badge {
        background: #cc3344;
        color: #fff;
        font-family: 'Space Mono', monospace;
        font-size: 9px;
        padding: 1px 6px;
        min-width: 18px;
        text-align: center;
        border-radius: 8px;
      }

      .spinner {
        width: 12px; height: 12px;
        border: 1px solid rgba(255,255,255,.15);
        border-top-color: rgba(255,255,255,.5);
        border-radius: 50%;
        animation: spin .7s linear infinite;
        display: inline-block;
      }

      .empty-state {
        text-align: center;
        padding: 32px 0;
        color: ${HOLO_THEME.textDim};
        font-size: 12px;
        letter-spacing: .05em;
        font-family: 'Inter', sans-serif;
      }

      .pending-badge {
        font-size: 9px;
        letter-spacing: .1em;
        color: #f0a500;
        border: 1px solid rgba(240,165,0,.3);
        padding: 2px 6px;
        border-radius: 8px;
      }
      .sent-badge {
        font-size: 9px;
        letter-spacing: .1em;
        color: ${HOLO_THEME.textDim};
        border: 1px solid ${HOLO_THEME.hairlineSoft};
        padding: 2px 6px;
        border-radius: 8px;
      }
    `;
