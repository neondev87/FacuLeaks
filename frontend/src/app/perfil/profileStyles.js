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
      .sec-title { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.16em; margin-bottom:16px; color:rgba(242,240,248,.75); }
      .post-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid ${HOLO_THEME.hairlineSoft}; font-size:12px; font-family:'Inter',sans-serif; }
      .post-row:last-child { border-bottom:none; }
    `;
