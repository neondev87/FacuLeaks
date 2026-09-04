// MÓDULO: app/foro/foroStyles.js
// CSS de la página de foro. Se inyecta con hooks/useInjectedStyles.js
// ("foro-styles", …) desde app/foro/page.js. Antes vivía a mano dentro de
// la página — parejado con el mismo patrón de Fase 2 el 2026-09-04.
// Comparte fuente y textura de fondo con amigos (misma familia visual) vía
// lib/theme.js. Este archivo es CSS nomás — la página en sí sigue siendo
// mock, eso no cambió.
import { FONT_IMPORT_MONO_DISPLAY, NOISE_TEXTURE_SCANLINE, COLORS } from "@/lib/theme";

export const foroStyles = `
      ${FONT_IMPORT_MONO_DISPLAY}
      body { background:${COLORS.bg}; color:${COLORS.text}; font-family:'Space Mono',monospace; font-size:13px; overflow:hidden; }
      ${NOISE_TEXTURE_SCANLINE}
      ::-webkit-scrollbar { width:4px }
      ::-webkit-scrollbar-track { background:#000 }
      ::-webkit-scrollbar-thumb { background:#222 }

      .channel-item {
        padding: 7px 16px;
        cursor: pointer;
        border-left: 2px solid transparent;
        transition: all .15s;
      }
      .channel-item:hover { background: rgba(255,255,255,.03); }
      .channel-item.active { background: rgba(255,255,255,.07); border-left-color: #fff; }

      .msg-input {
        flex: 1;
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.08);
        color: #e8e4d9;
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        padding: 11px 16px;
        outline: none;
        letter-spacing: .03em;
        transition: border-color .2s;
      }
      .msg-input:focus { border-color: rgba(255,255,255,.3); }
      .msg-input::placeholder { color: rgba(255,255,255,.2); }

      .send-btn {
        background: rgba(255,255,255,.1);
        border: 1px solid rgba(255,255,255,.25);
        color: #fff;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        padding: 11px 18px;
        cursor: pointer;
        letter-spacing: .15em;
        transition: all .2s;
      }
      .send-btn:hover { background: rgba(255,255,255,.18); }
    `;
