// MÓDULO: app/perfil/profileStyles.js
// CSS de la página de perfil propio. Se inyecta con
// hooks/useInjectedStyles.js ("profile-styles", …) desde app/perfil/page.js.
// Es puro texto CSS, no tiene lógica. Comparte fuentes/ruido de
// fondo/scrollbar/animaciones con feed y perfil público vía lib/theme.js;
// `savePop` es propia de esta página (la animación del toast de "guardado").
import { FONT_IMPORT_MAIN, NOISE_TEXTURE, SCROLLBAR_THIN, KF } from "@/lib/theme";

export const profileStyles = `
      ${FONT_IMPORT_MAIN}
      ${KF.fadeIn}
      ${KF.slideUp}
      ${KF.blink}
      @keyframes savePop { 0%{opacity:0;transform:translateY(4px)} 20%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
      body { background:#000; color:#e8e4d9; font-family:'Inter',sans-serif; font-size:13px; overflow-x:hidden; }
      ${NOISE_TEXTURE}
      ${SCROLLBAR_THIN}
      .profile-wrap { padding:68px 28px 48px; max-width:960px; margin:0 auto; animation:fadeIn .5s ease; }
      .sec-title { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.18em; margin-bottom:12px; color:rgba(255,255,255,.7); }
      .post-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,.04); font-size:12px; font-family:'Inter',sans-serif; }
      .post-row:last-child { border-bottom:none; }
    `;
