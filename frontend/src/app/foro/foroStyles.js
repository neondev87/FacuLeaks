// MÓDULO: app/foro/foroStyles.js
// CSS de la página de foro. Se inyecta con hooks/useInjectedStyles.js
// ("foro-styles", …) desde app/foro/page.js. Este archivo es CSS nomás —
// la página en sí sigue siendo mock, eso no cambió.
//
// Fase 3 (2026-09-05): pasa a la paleta "Holographic" (HOLO_THEME) y al
// trío de fuentes Cinzel/Inter/Space Mono de Muro/Perfil/Amigos — misma
// estructura visual que esas páginas (esquinas redondeadas, hairlines
// finos). Antes compartía paleta/ruido "scanline" con amigos, que ya tuvo
// su turno de Fase 3 y se separó de acá.
import { FONT_IMPORT_MAIN, NOISE_TEXTURE, HOLO_THEME } from "@/lib/theme";

export const foroStyles = `
      ${FONT_IMPORT_MAIN}
      body { background:${HOLO_THEME.bg}; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:13px; overflow:hidden; }
      ${NOISE_TEXTURE}
      ::-webkit-scrollbar { width:4px }
      ::-webkit-scrollbar-track { background:#000 }
      ::-webkit-scrollbar-thumb { background:#222 }

      .channel-item {
        padding: 7px 16px;
        margin: 0 8px 2px;
        border-radius: 8px;
        cursor: pointer;
        border-left: 2px solid transparent;
        transition: all .15s;
      }
      .channel-item:hover { background: rgba(255,255,255,.03); }
      .channel-item.active { background: rgba(255,255,255,.07); border-left-color: ${HOLO_THEME.text}; }

      .msg-input {
        flex: 1;
        background: ${HOLO_THEME.panel};
        border: 1px solid ${HOLO_THEME.hairlineSoft};
        color: ${HOLO_THEME.text};
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        padding: 11px 16px;
        outline: none;
        border-radius: 20px;
        transition: border-color .2s;
      }
      .msg-input:focus { border-color: ${HOLO_THEME.hairline}; }
      .msg-input::placeholder { color: rgba(242,240,248,.28); }

      .send-btn {
        background: ${HOLO_THEME.text};
        border: none;
        color: ${HOLO_THEME.bg};
        font-family: 'Space Mono', monospace;
        font-weight: 700;
        font-size: 11px;
        padding: 11px 20px;
        cursor: pointer;
        letter-spacing: .14em;
        border-radius: 20px;
        transition: opacity .2s;
      }
      .send-btn:hover { opacity: .85; }
    `;
