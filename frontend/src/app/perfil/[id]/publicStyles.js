// MÓDULO: app/perfil/[id]/publicStyles.js
// CSS de la página de perfil público (de otro usuario). Se inyecta con
// hooks/useInjectedStyles.js ("perfil-pub-styles", …) desde
// app/perfil/[id]/page.js. Es puro texto CSS, no tiene lógica. Es
// prácticamente idéntica a profileStyles.js (comparten `.sec-title`,
// `.post-row`, fuentes, ruido de fondo) salvo el nombre de la clase wrapper
// (acá `.pub-wrap`) y que esta página no tiene el toast de "guardado".
import { FONT_IMPORT_MAIN, NOISE_TEXTURE, SCROLLBAR_THIN, KF } from "@/lib/theme";

export const publicStyles = `
      ${FONT_IMPORT_MAIN}
      ${KF.fadeIn}
      ${KF.blink}
      body { background:#000; color:#e8e4d9; font-family:'Inter',sans-serif; font-size:13px; overflow-x:hidden; }
      ${NOISE_TEXTURE}
      ${SCROLLBAR_THIN}
      .pub-wrap { padding:68px 28px 48px; max-width:960px; margin:0 auto; animation:fadeIn .5s ease; }
      .sec-title { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.18em; margin-bottom:12px; color:rgba(255,255,255,.7); }
      .post-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,.04); font-size:12px; font-family:'Inter',sans-serif; }
      .post-row:last-child { border-bottom:none; }
    `;
