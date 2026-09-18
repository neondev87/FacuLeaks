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

      .auth-page {
        width:100vw; height:100vh;
        display:grid; grid-template-columns:1fr 1fr;
        overflow:hidden;
        animation: bgW2B 1.44s ease forwards;
      }

      .auth-left {
        display:flex; flex-direction:column; justify-content:center;
        padding:0 8% 0 10%; position:relative;
      }

      .auth-right { position:relative; overflow:hidden; }

      .auth-status {
        position:absolute; top:24px; left:18px; z-index:4;
        font-family:'Space Mono',monospace; font-size:8px;
        color:rgba(255,255,255,.2); letter-spacing:.2em; line-height:2.2;
      }
      .auth-status span { color:rgba(255,255,255,.1); }

      .auth-cross-wrap { position:absolute; top:160px; right:14px; z-index:3; }
      .auth-neon-wrap  { position:absolute; top:68px; right:20px; z-index:5; }

      .auth-version {
        position:absolute; bottom:28px;
        font-family:'Space Mono',monospace; font-size:8px; letter-spacing:.15em;
      }

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

      /* ── Celular: la pantalla dividida 1fr/1fr no entra — el panel del
         arte pasa a ser una franja arriba (mismo criterio que .foro-side
         en foroStyles.js) y el panel de login queda abajo con su propio
         padding, en vez de dos columnas de ~180px cada una. Ningún valor
         de escritorio cambia.
         2026-09-17: altura fija a 100dvh (antes "height:auto;
         min-height:100vh" — el 100vh de más contaba la barra de
         direcciones del navegador móvil, así que la página quedaba más
         alta que la pantalla visible y obligaba a scrollear). Todo el
         bloque de auth-left ahora se centra verticalmente en vez de ir
         pegado arriba, para que el logo y el botón de Google queden un
         poco más abajo.
         OJO — este bloque tiene que ir DESPUÉS de .logo-title y .girl-img
         (arriba): con la misma especificidad, CSS le da la razón a la regla
         que aparece última en el archivo sin importar el @media — puesto
         antes (como estaba, reportado 2026-09-17) este fix quedaba pisado
         en silencio por las reglas de escritorio y nunca se aplicaba en
         celular. Mismo bug ya visto en feedStyles.js. ── */
      @media (max-width:760px) {
        .auth-page {
          grid-template-columns:1fr; grid-template-rows:34vh 1fr;
          height:100vh; height:100dvh; overflow:hidden;
        }
        .auth-left { grid-row:2; padding:28px 24px 28px; justify-content:center; }
        .auth-right { grid-row:1; height:34vh; }

        .auth-status { display:none; }
        .auth-neon-wrap { top:10px; right:14px; }
        .auth-cross-wrap { top:auto; bottom:10px; right:14px; }

        .girl-img { width:60%; right:50%; transform:translateX(50%); max-height:100%; }

        .logo-title { font-size:clamp(38px,13vw,58px); }

        .auth-version { position:static; margin-top:20px; text-align:center; }
      }
    `;
