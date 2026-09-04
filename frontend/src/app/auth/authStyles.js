// MÓDULO: app/auth/authStyles.js
// CSS de la pantalla de login (la animación blanco→negro, el logo, el botón
// de Google, el arte del personaje). Se inyecta con hooks/useInjectedStyles.js
// ("auth-styles", …) desde app/auth/page.js. Antes vivía a mano dentro de la
// página — parejado con el patrón de Fase 2 el 2026-09-04, SIN tocar ni un
// valor visual (esta pantalla está protegida por el prompt maestro). Solo se
// reusan de lib/theme.js las piezas que eran BYTE POR BYTE idénticas
// (spin, blink, el ruido+scanline, el scrollbar) — el resto de animaciones
// (bgW2B, textW2B, fadeUp con su propio translateY, girlIn, flicker) son
// exclusivas de esta pantalla y se quedan acá.
import { NOISE_TEXTURE_SCANLINE, SCROLLBAR_THIN, KF } from "@/lib/theme";

export const authStyles = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Space+Mono:wght@400;700&display=swap');

      @keyframes bgW2B {
        0%,35% { background:#fff; }
        100%   { background:#000; }
      }
      @keyframes textW2B {
        0%,35% { color:#000; }
        80%,100% { color:#e8e4d9; }
      }
      @keyframes fadeUp {
        from { opacity:0; transform:translateY(12px); }
        to   { opacity:1; transform:translateY(0); }
      }
      ${KF.blink}
      @keyframes girlIn {
        from { opacity:0; transform:translateY(14px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes flicker {
        0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:.6} 94%{opacity:1}
      }
      ${KF.spin}

      ${NOISE_TEXTURE_SCANLINE}

      ${SCROLLBAR_THIN}

      .logo-title {
        font-family:'DM Serif Display',serif;
        font-weight:400;
        font-size:clamp(56px,7vw,82px);
        line-height:.9;
        letter-spacing:.01em;
        animation: textW2B 2.4s ease forwards, flicker 9s infinite 3s;
      }

      .btn-google {
        background:transparent;
        color:rgba(232,228,217,.5);
        font-family:'Space Mono',monospace;
        font-size:11px; letter-spacing:.2em;
        padding:14px 32px; cursor:pointer; width:100%;
        border:1px solid rgba(232,228,217,.2);
        transition:all .25s;
        display:flex; align-items:center; justify-content:center; gap:12px;
        margin-top: 8px;
      }
      .btn-google:hover {
        border-color:rgba(232,228,217,.6);
        color:#e8e4d9;
        background: rgba(232,228,217,.04);
        box-shadow: 0 0 20px rgba(232,228,217,.05);
      }
      .btn-google:disabled {
        opacity: .4;
        cursor: not-allowed;
      }

      .form-wrap { animation: fadeUp .5s ease .4s both; }

      .girl-img {
        position:absolute; bottom:0; right:5%;
        width:80%; max-height:100vh;
        object-fit:contain; object-position:bottom;
        filter:contrast(1.1) brightness(.9);
        mix-blend-mode:lighten; z-index:1;
        animation: girlIn 1.2s ease 1.6s both;
        pointer-events:none; user-select:none;
      }

      .checking-indicator {
        font-family:'Space Mono',monospace;
        font-size:9px; letter-spacing:.2em;
        color:rgba(232,228,217,.35);
        display:flex; align-items:center; gap:8px;
        margin-top:12px;
      }
      .spinner {
        width:10px; height:10px;
        border:1px solid rgba(232,228,217,.2);
        border-top-color:rgba(232,228,217,.6);
        border-radius:50%;
        animation:spin .8s linear infinite;
      }
    `;
