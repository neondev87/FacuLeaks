// MÓDULO: app/register/registerStyles.js
// CSS de la página de registro (estética terminal, a tono con el login).
// Se inyecta con hooks/useInjectedStyles.js ("register-styles", …) desde
// app/register/page.js. Antes vivía a mano dentro de la página — parejado
// con el patrón de Fase 2 el 2026-09-04. El ruido de fondo + scanline de
// esta página son MÁS sutiles que los de amigos/foro (opacidades distintas
// a propósito, look más "terminal" y menos "glitch") — por eso se quedan
// acá en vez de compartir NOISE_TEXTURE_SCANLINE.
import { COLORS, KF } from "@/lib/theme";

export const registerStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
      ${KF.blink}
      ${KF.fadeInPlain}
      @keyframes scanline { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
      body { background:${COLORS.bg}; overflow:hidden; }
      body::before {
        content:''; position:fixed; inset:0;
        background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
        opacity:.04; pointer-events:none; z-index:9998;
      }
      body::after {
        content:''; position:fixed; inset:0;
        background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.12) 2px,rgba(0,0,0,.12) 4px);
        pointer-events:none; z-index:9999;
      }
      .term-input {
        background:transparent; border:none; outline:none;
        font-family:'Share Tech Mono',monospace;
        font-size:14px; letter-spacing:.08em;
        color:#ffffff; caret-color:#ffffff; width:100%; padding:0;
      }
      .term-input::placeholder { color:rgba(255,255,255,.2); }
      .cursor-blink { animation:blink 1s step-end infinite; }
      .req-ok  { color:rgba(100,220,120,.9); }
      .req-bad { color:rgba(255,255,255,.25); }
      .confirm-btn {
        background:transparent; border:1px solid rgba(255,255,255,.2);
        color:rgba(255,255,255,.55); font-family:'Share Tech Mono',monospace;
        font-size:10px; letter-spacing:.2em; padding:4px 14px;
        cursor:pointer; transition:all .2s;
      }
      .confirm-btn:hover { border-color:rgba(255,255,255,.7); color:#fff; }
      .moving-scan {
        position:fixed; top:0; left:0; right:0; height:1px;
        background:rgba(255,255,255,.03);
        animation:scanline 10s linear infinite;
        pointer-events:none; z-index:10000;
      }
    `;
