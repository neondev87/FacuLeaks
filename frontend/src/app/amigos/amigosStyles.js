// MÓDULO: app/amigos/amigosStyles.js
// CSS de la página de amigos. Se inyecta con hooks/useInjectedStyles.js
// ("amigos-styles", …) desde app/amigos/page.js. Antes vivía a mano dentro
// de la página (document.createElement("style")) — parejado con el mismo
// patrón de Fase 2 el 2026-09-04. Comparte fuentes/ruido de
// fondo/animaciones con foro (son la misma familia visual) vía lib/theme.js.
import { FONT_IMPORT_MONO_DISPLAY, NOISE_TEXTURE_SCANLINE, COLORS, KF } from "@/lib/theme";

export const amigosStyles = `
      ${FONT_IMPORT_MONO_DISPLAY}
      ${KF.fadeIn}
      ${KF.spin}
      body { background:${COLORS.bg}; color:${COLORS.text}; font-family:'Space Mono',monospace; font-size:13px; overflow-x:hidden; }
      ${NOISE_TEXTURE_SCANLINE}
      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-track{background:#000}
      ::-webkit-scrollbar-thumb{background:#333}

      .page-wrap {
        padding: 68px 28px 48px;
        max-width: 900px;
        margin: 0 auto;
        animation: fadeIn .5s ease;
      }

      .search-input {
        width: 100%;
        background: rgba(255,255,255,.04);
        border: 1px solid rgba(255,255,255,.1);
        color: #e8e4d9;
        font-family: 'Space Mono', monospace;
        font-size: 13px;
        padding: 12px 16px;
        outline: none;
        letter-spacing: .04em;
        transition: border-color .2s;
      }
      .search-input:focus { border-color: rgba(255,255,255,.3); }
      .search-input::placeholder { color: rgba(255,255,255,.2); }

      .user-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border: 1px solid rgba(255,255,255,.06);
        margin-bottom: 8px;
        transition: border-color .2s;
      }
      .user-card:hover { border-color: rgba(255,255,255,.15); }

      .btn-action {
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        letter-spacing: .15em;
        padding: 5px 14px;
        cursor: pointer;
        transition: all .2s;
        border: 1px solid;
        background: transparent;
      }
      .btn-add      { color: rgba(255,255,255,.6);  border-color: rgba(255,255,255,.2);  }
      .btn-add:hover{ color: #fff; border-color: rgba(255,255,255,.5); background: rgba(255,255,255,.05); }
      .btn-accept   { color: rgba(100,220,120,.8);  border-color: rgba(100,220,120,.3);  }
      .btn-accept:hover { color: #fff; border-color: rgba(100,220,120,.7); background: rgba(100,220,120,.08); }
      .btn-reject   { color: rgba(220,80,80,.7);    border-color: rgba(220,80,80,.2);    }
      .btn-reject:hover { color: #fff; border-color: rgba(220,80,80,.5); background: rgba(220,80,80,.08); }
      .btn-remove   { color: rgba(255,255,255,.3);  border-color: rgba(255,255,255,.08); }
      .btn-remove:hover { color: rgba(220,80,80,.8); border-color: rgba(220,80,80,.3); }

      .section-header {
        font-family: 'Cinzel', serif;
        font-size: 14px;
        letter-spacing: .2em;
        color: #fff;
        margin-bottom: 16px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255,255,255,.08);
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
        color: #333;
        font-size: 12px;
        letter-spacing: .1em;
      }

      .pending-badge {
        font-size: 9px;
        letter-spacing: .1em;
        color: #f0a500;
        border: 1px solid rgba(240,165,0,.3);
        padding: 2px 6px;
      }
      .sent-badge {
        font-size: 9px;
        letter-spacing: .1em;
        color: rgba(255,255,255,.3);
        border: 1px solid rgba(255,255,255,.1);
        padding: 2px 6px;
      }
    `;
