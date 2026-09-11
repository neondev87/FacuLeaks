// MÓDULO: app/perfil/profileStyles.js
// CSS de la página de perfil propio. Se inyecta con
// hooks/useInjectedStyles.js ("profile-styles", …) desde app/perfil/page.js.
// Es puro texto CSS, no tiene lógica. `savePop` es propia de esta página
// (la animación del toast de "guardado").
//
// Fase 3 (2026-09): el perfil pasó a la misma paleta "Holographic" del
// Muro (lib/theme.js → HOLO_THEME) — evolución conservadora, no un
// rediseño de layout: mismo orden de secciones, mismo contenido, tarjetas
// redondeadas en vez de cuadradas y más espaciosas. El único efecto
// animado ("chrome aero") vive en el avatar grande (components/
// AvatarMenu.js), no acá.
import { FONT_IMPORT_MAIN, SCROLLBAR_THIN, KF, HOLO_THEME } from "@/lib/theme";

export const profileStyles = `
      ${FONT_IMPORT_MAIN}
      ${KF.fadeIn}
      ${KF.slideUp}
      ${KF.blink}
      @keyframes savePop { 0%{opacity:0;transform:translateY(4px)} 20%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
      body { background:${HOLO_THEME.bg}; color:${HOLO_THEME.text}; font-family:'Inter',sans-serif; font-size:13px; overflow-x:hidden; }
      ${SCROLLBAR_THIN}
      .profile-wrap { padding:68px 28px 48px; max-width:1040px; margin:0 auto; animation:fadeIn .5s ease; }
      /* Sin columna derecha: Links se mudó adentro de "Información" (ver
         app/perfil/page.js) — ya no queda nada ahí para esa tercera columna. */
      .profile-grid { display:grid; grid-template-columns:284px 1fr; gap:18px; }
      .sec-title { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.16em; margin-bottom:16px; color:rgba(242,240,248,.75); }

      /* Spotify vive al lado del nombre en el header — ancho fijo en PC,
         se achica en celular (ver @media abajo) para dejarle aire al nombre. */
      .profile-spotify-box { width:230px; flex-shrink:0; }

      /* ── Celular: las tres columnas se apilan (avatar/stats, cuerpo, extras) ── */
      @media (max-width:880px) {
        .profile-grid { grid-template-columns:1fr; }
      }
      @media (max-width:760px) {
        .profile-wrap { padding:60px 16px 32px; }
        /* El nombre + Spotify ya no entran cómodos en una sola fila angosta:
           Spotify se acorta (230 → 132) y el nombre baja un poco de tamaño
           para no chocar con él. */
        .profile-header { gap:12px; }
        .profile-name { font-size:24px; }
        .profile-spotify-box { width:132px; }
        /* El avatar gana un poco de tamaño (165 → 196): en celular la
           columna es de ancho completo, hay lugar de sobra y se ve chico
           al lado del resto. !important porque AvatarMenu ya trae su propio
           width inline (prop size, pensado para PC). */
        .profile-avatar-box { width:196px !important; }
      }
    `;
